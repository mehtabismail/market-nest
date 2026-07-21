import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { CartService } from '../cart/cart.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { RequestUser } from '../auth/auth.types';
import { OrdersService } from './orders.service';
import type { CheckoutBodyDto } from './dto/checkout.dto';

const BUYER: RequestUser = { id: 'user-1', email: 'buyer@example.com', role: 'buyer' };

const CHECKOUT_DTO = {
  paymentMethod: 'cod',
  shippingAddress: { fullName: 'Test Buyer', line1: 'Somewhere', city: 'Lahore' },
} as unknown as CheckoutBodyDto;

function buildHarness() {
  const tx = {
    order: { create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    product: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    orderItem: { create: jest.fn(), updateMany: jest.fn() },
    payment: { updateMany: jest.fn() },
  };

  const prisma = {
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
    order: { findUnique: jest.fn().mockResolvedValue({ id: 'order-1' }) },
  } as unknown as PrismaService;

  const cart = {
    getCart: jest.fn().mockResolvedValue({
      items: [{ productId: 'prod-1', variantId: null, quantity: 2, unitPrice: 50 }],
      subtotal: 100,
      itemCount: 2,
    }),
    clearForCheckout: jest.fn(),
  } as unknown as CartService;

  const notifications = { enqueueEmail: jest.fn() } as unknown as NotificationsService;

  return {
    tx,
    prisma,
    cart,
    notifications,
    service: new OrdersService(prisma, cart, notifications),
  };
}

describe('OrdersService checkout stock claim', () => {
  it('claims stock with a conditional update rather than checking then writing', async () => {
    const { service, tx } = buildHarness();
    tx.order.create.mockResolvedValue({ id: 'order-1' });
    tx.product.findFirst.mockResolvedValue({
      id: 'prod-1',
      title: 'Widget',
      sellerId: 'seller-1',
      ownerType: 'seller_owned',
    });
    tx.product.updateMany.mockResolvedValue({ count: 0 });

    await service.checkout(BUYER, CHECKOUT_DTO).catch(() => undefined);

    // The `gte` guard is what makes the decrement safe under concurrency: two
    // buyers racing for the last unit cannot both match the WHERE clause.
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'prod-1', stockQty: { gte: 2 } },
      data: { stockQty: { decrement: 2 } },
    });
  });

  it('rejects the order when the stock claim matches no row', async () => {
    const { service, tx } = buildHarness();
    tx.order.create.mockResolvedValue({ id: 'order-1' });
    tx.product.findFirst.mockResolvedValue({
      id: 'prod-1',
      title: 'Widget',
      sellerId: 'seller-1',
      ownerType: 'seller_owned',
    });
    tx.product.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.checkout(BUYER, CHECKOUT_DTO)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.orderItem.create).not.toHaveBeenCalled();
  });
});

describe('OrdersService.cancelBuyerOrder restock claim', () => {
  // Mirror image of the oversell race: the pre-transaction status check lets two
  // concurrent cancels through, and both restock, inflating inventory.
  it('does not restock when the cancellation claim matches no row', async () => {
    const { service, prisma, tx } = buildHarness();
    (prisma as unknown as { order: { findFirst: jest.Mock } }).order = {
      findFirst: jest.fn().mockResolvedValue({
        id: 'order-1',
        status: 'pending_cod',
        items: [{ productId: 'prod-1', quantity: 2 }],
      }),
    };
    tx.order.updateMany.mockResolvedValue({ count: 0 });

    await service.cancelBuyerOrder('user-1', 'order-1').catch(() => undefined);

    expect(tx.product.update).not.toHaveBeenCalled();
  });
});

describe('OrdersService.confirmPayment idempotency', () => {
  it('sends the confirmation email on the first delivery', async () => {
    const { service, tx, notifications } = buildHarness();
    tx.order.updateMany.mockResolvedValue({ count: 1 });

    await service.confirmPayment('order-1');

    expect(notifications.enqueueEmail).toHaveBeenCalledTimes(1);
  });

  // Stripe redelivers webhooks; a replay must not re-email the buyer or drag a
  // cancelled order back to confirmed.
  it('does nothing when the order is no longer awaiting payment', async () => {
    const { service, tx, notifications } = buildHarness();
    tx.order.updateMany.mockResolvedValue({ count: 0 });

    await service.confirmPayment('order-1');

    expect(notifications.enqueueEmail).not.toHaveBeenCalled();
    expect(tx.payment.updateMany).not.toHaveBeenCalled();
  });
});
