import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type { RedisService } from '../redis/redis.service';
import type { ProductsService } from '../products/products.service';
import { CartService } from './cart.service';

/**
 * The cart key resolves to "user id if present, otherwise guest session".
 *
 * The web client used to omit the bearer token on cart requests, so items were
 * written to cart:guest:* while checkout — which did send a token — read
 * cart:user:*. Every checkout failed with "Cart is empty" despite a populated
 * cart badge. These assertions pin the precedence that the client relies on.
 */
describe('CartService cart key resolution', () => {
  const redisClient = { get: jest.fn(), setex: jest.fn(), del: jest.fn() };

  function makeService(client: typeof redisClient | null = redisClient) {
    redisClient.get.mockResolvedValue(null);
    const redis = { getClient: () => client } as unknown as RedisService;
    const products = {} as ProductsService;
    return new CartService(redis, products);
  }

  beforeEach(() => jest.clearAllMocks());

  it('prefers the user cart when both a session and a user are present', async () => {
    await makeService().getCart('guest-abc', 'user-123');

    expect(redisClient.get).toHaveBeenCalledWith('cart:user:user-123');
  });

  it('falls back to the guest cart when there is no user', async () => {
    await makeService().getCart('guest-abc', undefined);

    expect(redisClient.get).toHaveBeenCalledWith('cart:guest:guest-abc');
  });

  it('rejects a request with neither a session nor a user', async () => {
    await expect(makeService().getCart(undefined, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // An unreachable store previously returned an empty cart, which the buyer saw
  // as "Cart is empty" at checkout rather than an outage.
  it('reports a storage outage instead of returning an empty cart', async () => {
    await expect(makeService(null).getCart('guest-abc', 'user-123')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
