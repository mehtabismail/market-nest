import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    }
  }

  async createPaymentIntent(orderId: string, buyerId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerId },
    });

    if (!order) throw new BadRequestException('Order not found');
    if (order.paymentMethod !== 'online') {
      throw new BadRequestException('Order is not an online payment order');
    }
    if (order.status !== 'pending_payment') {
      throw new BadRequestException('Order is not awaiting payment');
    }

    const amountCents = Math.round(Number(order.total) * 100);

    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { orderId: order.id },
      automatic_payment_methods: { enabled: true },
    });

    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        stripePaymentIntentId: intent.id,
        amount: order.total,
        status: 'pending',
      },
      update: {
        stripePaymentIntentId: intent.id,
        status: 'pending',
      },
    });

    return {
      orderId: order.id,
      clientSecret: intent.client_secret,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    // Misconfiguration must fail closed. Returning 2xx tells Stripe the event
    // was handled, so it stops retrying and the delivery is lost for good —
    // buyers are charged and their orders never leave pending_payment. A 5xx
    // makes Stripe retry with backoff, so events survive a bad deploy.
    if (!this.stripe) {
      this.logger.error('Stripe webhook received but STRIPE_SECRET_KEY is not configured');
      throw new ServiceUnavailableException('Payment processing is not configured');
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('Stripe webhook received but STRIPE_WEBHOOK_SECRET is not set');
      throw new ServiceUnavailableException('Payment processing is not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await this.orders.confirmPayment(orderId);
      }
    }

    return { received: true };
  }
}
