import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { OrderDetailDTO, OrderSummaryDTO } from '@marketnest/shared-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import type { RequestUser } from '../auth/auth.types';
import { CheckoutBodyDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { NotificationsService } from '../notifications/notifications.service';

const SHIPPING_FEE = 5;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly notifications: NotificationsService,
  ) {}

  async checkout(
    user: RequestUser,
    dto: CheckoutBodyDto,
    guestSession?: string,
  ) {
    if (user.role !== 'buyer' && user.role !== 'superadmin') {
      throw new ForbiddenException('Buyer account required');
    }

    const cart = await this.cart.getCart(guestSession, user.id);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = cart.subtotal;
    const shippingFee = SHIPPING_FEE;
    const total = subtotal + shippingFee;

    const initialStatus =
      dto.paymentMethod === 'cod' ? 'pending_cod' : 'pending_payment';

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          buyerId: user.id,
          status: initialStatus,
          paymentMethod: dto.paymentMethod,
          subtotal,
          shippingFee,
          total,
          shippingAddress: dto.shippingAddress as unknown as Prisma.InputJsonValue,
        },
      });

      for (const line of cart.items) {
        // Read inside the transaction: the previous version validated stock via
        // this.prisma, outside it.
        const product = await tx.product.findFirst({
          where: { id: line.productId, status: 'published' },
          select: { id: true, title: true, sellerId: true, ownerType: true },
        });

        if (!product) {
          throw new NotFoundException(`Product ${line.productId} not available`);
        }

        // Claim stock with a conditional update rather than checking then
        // writing. At READ COMMITTED a check-then-write lets two concurrent
        // checkouts both observe the last unit and both decrement, driving
        // stock negative. Gating the decrement on `stockQty >= quantity` makes
        // the DB serialise the claim: exactly one of them updates a row.
        const claimed = await tx.product.updateMany({
          where: { id: product.id, stockQty: { gte: line.quantity } },
          data: { stockQty: { decrement: line.quantity } },
        });

        if (claimed.count === 0) {
          throw new BadRequestException(`Insufficient stock for ${product.title}`);
        }

        await tx.orderItem.create({
          data: {
            orderId: created.id,
            productId: product.id,
            sellerId: product.sellerId,
            ownerType: product.ownerType,
            variantId: line.variantId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            status: initialStatus === 'pending_cod' ? 'confirmed' : 'pending_payment',
          },
        });
      }

      if (dto.paymentMethod === 'cod') {
        await tx.order.update({
          where: { id: created.id },
          data: { status: 'confirmed' },
        });
      }

      return created;
    });

    await this.cart.clearForCheckout(guestSession, user.id);

    void this.notifications.enqueueEmail('order_confirmation_buyer', { orderId: order.id });

    const sellerIds = [
      ...new Set(
        (
          await this.prisma.orderItem.findMany({
            where: { orderId: order.id, sellerId: { not: null } },
            select: { sellerId: true },
          })
        ).map((i) => i.sellerId!),
      ),
    ];
    for (const sellerId of sellerIds) {
      void this.notifications.enqueueEmail('seller_new_order', { orderId: order.id, sellerId });
    }

    return this.getBuyerOrder(user.id, order.id);
  }

  async listBuyerOrders(userId: string): Promise<OrderSummaryDTO[]> {
    const orders = await this.prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });

    return orders.map((o) => this.toSummary(o, o._count.items));
  }

  async getBuyerOrder(userId: string, orderId: string): Promise<OrderDetailDTO> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerId: userId },
      include: {
        items: {
          include: {
            product: {
              select: { title: true, ownerType: true },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return this.toDetail(order);
  }

  async cancelBuyerOrder(userId: string, orderId: string): Promise<OrderDetailDTO> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerId: userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!['pending_cod', 'pending_payment'].includes(order.status)) {
      throw new BadRequestException(
        'Only pending COD or pending payment orders can be cancelled',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Claim the cancellation before restocking. The status check above runs
      // outside this transaction, so two concurrent cancels (a double-click, a
      // client retry) would both pass it and both increment stock, inflating
      // inventory. Gating on the pending statuses lets exactly one through.
      const { count } = await tx.order.updateMany({
        where: { id: order.id, status: { in: ['pending_cod', 'pending_payment'] } },
        data: { status: 'cancelled' },
      });

      if (count === 0) {
        throw new BadRequestException(
          'Only pending COD or pending payment orders can be cancelled',
        );
      }

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
      }

      await tx.orderItem.updateMany({
        where: { orderId: order.id },
        data: { status: 'cancelled' },
      });
    });

    return this.getBuyerOrder(userId, orderId);
  }

  async listSellerOrders(user: RequestUser) {
    if (!user.sellerId) throw new ForbiddenException('Seller profile required');

    const items = await this.prisma.orderItem.findMany({
      where: { sellerId: user.sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            buyer: { select: { fullName: true, phone: true } },
          },
        },
        product: { select: { title: true } },
      },
    });

    const byOrder = new Map<string, typeof items>();
    for (const item of items) {
      const list = byOrder.get(item.orderId) ?? [];
      list.push(item);
      byOrder.set(item.orderId, list);
    }

    return Array.from(byOrder.entries()).map(([orderId, lines]) => ({
      orderId,
      status: lines[0].status,
      createdAt: lines[0].order.createdAt,
      buyerName: lines[0].order.buyer?.fullName,
      buyerPhone: lines[0].order.buyer?.phone,
      paymentMethod: lines[0].order.paymentMethod,
      shippingAddress: lines[0].order.shippingAddress,
      items: lines.map((l) => ({
        id: l.id,
        title: l.product.title,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice),
        status: l.status,
        trackingNumber: l.trackingNumber,
        courierName: l.courierName,
      })),
      sellerTotal: lines.reduce((s, l) => s + Number(l.unitPrice) * l.quantity, 0),
    }));
  }

  async updateSellerOrderItem(
    user: RequestUser,
    orderItemId: string,
    dto: UpdateOrderStatusDto,
  ) {
    if (!user.sellerId) throw new ForbiddenException('Seller profile required');

    const item = await this.prisma.orderItem.findFirst({
      where: { id: orderItemId, sellerId: user.sellerId },
      include: { order: true },
    });

    if (!item) throw new NotFoundException('Order item not found');

    if (dto.status === 'shipped' && (!dto.trackingNumber || !dto.courierName)) {
      throw new BadRequestException('Tracking number and courier required when shipping');
    }

    const updated = await this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        status: dto.status,
        trackingNumber: dto.trackingNumber,
        courierName: dto.courierName,
      },
    });

    if (dto.status === 'shipped') {
      void this.notifications.enqueueEmail('order_shipped_buyer', {
        orderId: item.orderId,
      });
    }

    return updated;
  }

  /** Platform-owned fulfilment queue (admin) */
  async listPlatformFulfilment() {
    return this.prisma.orderItem.findMany({
      where: { ownerType: 'platform_owned' },
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
        product: { select: { title: true, sku: true } },
      },
    });
  }

  async listAllAdmin() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        buyer: { select: { fullName: true } },
        _count: { select: { items: true } },
      },
    });
  }

  /**
   * Idempotent: Stripe redelivers webhooks, and a replay previously re-sent the
   * confirmation email and could resurrect a cancelled order back to confirmed.
   * The status guard means only the first delivery transitions the order.
   */
  async confirmPayment(orderId: string) {
    const transitioned = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: orderId, status: 'pending_payment' },
        data: { status: 'confirmed' },
      });

      if (count === 0) return false;

      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status: 'confirmed' },
      });
      await tx.payment.updateMany({
        where: { orderId },
        data: { status: 'succeeded', paidAt: new Date() },
      });
      return true;
    });

    if (transitioned) {
      void this.notifications.enqueueEmail('order_confirmation_buyer', { orderId });
    }

    return this.prisma.order.findUnique({ where: { id: orderId } });
  }

  private toSummary(
    order: { id: string; status: string; paymentMethod: string; subtotal: unknown; shippingFee: unknown; total: unknown; createdAt: Date },
    itemCount: number,
  ): OrderSummaryDTO {
    return {
      id: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod as OrderSummaryDTO['paymentMethod'],
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      itemCount,
    };
  }

  private toDetail(order: {
    id: string;
    status: string;
    paymentMethod: string;
    subtotal: unknown;
    shippingFee: unknown;
    total: unknown;
    createdAt: Date;
    shippingAddress: unknown;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      unitPrice: unknown;
      status: string;
      trackingNumber: string | null;
      courierName: string | null;
      product: { title: string; ownerType: string };
    }>;
  }): OrderDetailDTO {
    return {
      ...this.toSummary(order, order.items.length),
      shippingAddress: order.shippingAddress as OrderDetailDTO['shippingAddress'],
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        title: i.product.title,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        isMarketNestOfficial: i.product.ownerType === 'platform_owned',
        status: i.status,
        trackingNumber: i.trackingNumber,
        courierName: i.courierName,
      })),
    };
  }
}
