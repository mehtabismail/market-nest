import { ServiceUnavailableException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { OrdersService } from '../orders/orders.service';
import { PaymentsService } from './payments.service';

/**
 * A misconfigured webhook must fail closed.
 *
 * Returning 2xx tells Stripe the event was handled, so it stops retrying and
 * the delivery is lost permanently — buyers are charged while their orders sit
 * in pending_payment forever. A 5xx keeps Stripe retrying with backoff.
 */
describe('PaymentsService webhook misconfiguration', () => {
  const prisma = {} as PrismaService;
  const orders = { confirmPayment: jest.fn() } as unknown as OrdersService;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects with 503 when Stripe is not configured', async () => {
    const service = new PaymentsService(prisma, orders);

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects with 503 when the webhook signing secret is missing', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    const service = new PaymentsService(prisma, orders);

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('never confirms an order on a misconfigured delivery', async () => {
    const service = new PaymentsService(prisma, orders);

    await service.handleWebhook(Buffer.from('{}'), 'sig').catch(() => undefined);

    expect(orders.confirmPayment).not.toHaveBeenCalled();
  });
});
