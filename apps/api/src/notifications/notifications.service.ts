import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../auth/supabase.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { QUEUE_EMAIL } from './notifications.constants';

export type EmailJobType =
  | 'order_confirmation_buyer'
  | 'order_confirmation_seller'
  | 'order_shipped_buyer'
  | 'seller_new_order'
  | 'seller_suspended';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly email: EmailService,
    private readonly sms: SmsService,
    @Optional() @InjectQueue(QUEUE_EMAIL) private readonly emailQueue?: Queue,
  ) {}

  async enqueueEmail(type: EmailJobType, data: Record<string, string>) {
    if (!this.emailQueue) {
      await this.processEmailJob(type, data);
      return;
    }
    try {
      await this.emailQueue.add(type, data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (e) {
      this.logger.warn('Queue unavailable, sending email inline', e);
      await this.processEmailJob(type, data);
    }
  }

  async processEmailJob(type: EmailJobType, data: Record<string, string>) {
    switch (type) {
      case 'order_confirmation_buyer':
        return this.sendBuyerOrderConfirmation(data.orderId!);
      case 'order_confirmation_seller':
      case 'seller_new_order':
        return this.sendSellerNewOrder(data.orderId!, data.sellerId);
      case 'order_shipped_buyer':
        return this.sendBuyerShipped(data.orderId!);
      case 'seller_suspended':
        return this.sendSellerSuspended(data.sellerId!, data.reason);
      default:
        return false;
    }
  }

  async sendBuyerOrderConfirmation(orderId: string) {
    const order = await this.getOrderForEmail(orderId);
    if (!order?.buyerEmail) return false;

    const itemsHtml = order.items
      .map((i) => `<li>${i.title} � ${i.quantity} � $${i.lineTotal.toFixed(2)}</li>`)
      .join('');

    return this.email.send({
      to: order.buyerEmail,
      subject: `MarketNest order confirmed #${orderId.slice(0, 8)}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px">
          <h2 style="color:#0F6E56">Thank you for your order</h2>
          <p>Order <strong>#${orderId.slice(0, 8)}</strong></p>
          <ul>${itemsHtml}</ul>
          <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
          <p style="color:#5F5E5A;font-size:12px">MarketNest � your order is being processed. No seller information is included per our buyer protection policy.</p>
        </div>
      `,
      text: `Order confirmed #${orderId.slice(0, 8)}. Total $${order.total.toFixed(2)}`,
    });
  }

  async sendSellerNewOrder(orderId: string, sellerId?: string) {
    const order = await this.getOrderForEmail(orderId);
    if (!order) return false;

    const sellers = sellerId
      ? order.sellerContacts.filter((s) => s.sellerId === sellerId)
      : order.sellerContacts;

    for (const s of sellers) {
      if (!s.email) continue;
      await this.email.send({
        to: s.email,
        subject: `New MarketNest order #${orderId.slice(0, 8)}`,
        html: `<p>New order for your store. Items: ${s.itemCount}. Buyer city: ${order.city ?? 'N/A'}.</p>`,
      });
    }
    return true;
  }

  async sendBuyerShipped(orderId: string) {
    const order = await this.getOrderForEmail(orderId);
    if (!order?.buyerEmail) return false;

    const shipped = order.items.find((i) => i.trackingNumber);
    const tracking = shipped?.trackingNumber ?? 'See your order page';
    const courier = shipped?.courierName ?? '';

    await this.email.send({
      to: order.buyerEmail,
      subject: `Your MarketNest order has shipped`,
      html: `<p>Order #${orderId.slice(0, 8)} is on its way.</p><p>Tracking: <strong>${tracking}</strong> (${courier})</p><p>� MarketNest</p>`,
    });

    if (order.buyerPhone) {
      await this.sms.send(
        order.buyerPhone,
        `MarketNest: Your order shipped. Tracking: ${tracking}`,
      );
    }
    return true;
  }

  async sendSellerSuspended(sellerId: string, reason?: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        storeName: true,
        inviteEmail: true,
        userId: true,
      },
    });
    if (!seller) return false;

    const email = seller.userId
      ? (await this.resolveEmail(seller.userId)) ?? seller.inviteEmail
      : seller.inviteEmail;
    if (!email) return false;

    return this.email.send({
      to: email,
      subject: `MarketNest seller account suspended`,
      html: `<p>Your seller account for <strong>${seller.storeName}</strong> has been suspended.</p><p>Reason: ${reason ?? 'Policy review pending'}.</p><p>Please contact support for next steps.</p>`,
      text: `Your seller account for ${seller.storeName} has been suspended. Reason: ${reason ?? 'Policy review pending'}.`,
    });
  }

  private async getOrderForEmail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        items: { include: { product: { select: { title: true } } } },
      },
    });
    if (!order) return null;

    const buyerEmail = await this.resolveEmail(order.buyerId);
    const addr = order.shippingAddress as { phone?: string; city?: string };

    const sellerIds = [...new Set(order.items.map((i) => i.sellerId).filter(Boolean))] as string[];
    const sellers = await this.prisma.seller.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, inviteEmail: true, userId: true },
    });

    const sellerContacts = await Promise.all(
      sellers.map(async (s) => {
        const email = s.userId
          ? (await this.resolveEmail(s.userId)) ?? s.inviteEmail
          : s.inviteEmail;
        const itemCount = order.items.filter((i) => i.sellerId === s.id).length;
        return { sellerId: s.id, email, itemCount };
      }),
    );

    return {
      buyerEmail,
      buyerPhone: addr.phone ?? order.buyer.phone,
      city: addr.city,
      total: Number(order.total),
      items: order.items.map((i) => ({
        title: i.product.title,
        quantity: i.quantity,
        lineTotal: Number(i.unitPrice) * i.quantity,
        trackingNumber: i.trackingNumber,
        courierName: i.courierName,
      })),
      sellerContacts,
    };
  }

  private async resolveEmail(userId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.getClient().auth.admin.getUserById(userId);
      if (error || !data.user) return null;
      return data.user.email ?? null;
    } catch {
      return null;
    }
  }
}
