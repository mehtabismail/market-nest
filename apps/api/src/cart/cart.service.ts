import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CartDTO, CartItemInput, CartLineDTO } from '@marketnest/shared-types';
import { RedisService } from '../redis/redis.service';
import { ProductsService } from '../products/products.service';
import { toBuyerProductListItemDTO } from '../products/buyer-product.mapper';

const CART_TTL_SEC = 7 * 24 * 60 * 60; // 7 days
const GUEST_PREFIX = 'cart:guest:';
const USER_PREFIX = 'cart:user:';

interface StoredCart {
  items: CartItemInput[];
}

@Injectable()
export class CartService {
  constructor(
    private readonly redis: RedisService,
    private readonly products: ProductsService,
  ) {}

  createGuestSession(): { sessionId: string } {
    return { sessionId: randomUUID() };
  }

  private cartKey(guestSession?: string, userId?: string): string {
    if (userId) return `${USER_PREFIX}${userId}`;
    if (guestSession) return `${GUEST_PREFIX}${guestSession}`;
    throw new BadRequestException('Guest session or authentication required');
  }

  private async loadRaw(key: string): Promise<StoredCart> {
    const client = this.redis.getClient();
    // Returning an empty cart when the store is unreachable is indistinguishable
    // from a genuinely empty cart, which surfaces to the buyer as "Cart is
    // empty" at checkout. Fail loudly instead.
    if (!client) {
      throw new ServiceUnavailableException(
        'Cart storage unavailable — configure REDIS_URL',
      );
    }
    const raw = await client.get(key);
    if (!raw) return { items: [] };
    return JSON.parse(raw) as StoredCart;
  }

  private async saveRaw(key: string, cart: StoredCart) {
    const client = this.redis.getClient();
    if (!client) {
      throw new ServiceUnavailableException(
        'Cart storage unavailable — configure REDIS_URL',
      );
    }
    await client.setex(key, CART_TTL_SEC, JSON.stringify(cart));
  }

  async getCart(guestSession?: string, userId?: string): Promise<CartDTO> {
    const key = this.cartKey(guestSession, userId);
    const raw = await this.loadRaw(key);
    return this.hydrate(raw, key);
  }

  async addItem(
    input: CartItemInput,
    guestSession?: string,
    userId?: string,
  ): Promise<CartDTO> {
    if (input.quantity < 1) throw new BadRequestException('Quantity must be at least 1');

    const product = await this.products.getPublishedForPurchase(input.productId);
    if (product.stockQty < input.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const key = this.cartKey(guestSession, userId);
    const raw = await this.loadRaw(key);

    const idx = raw.items.findIndex(
      (i) => i.productId === input.productId && (i.variantId ?? null) === (input.variantId ?? null),
    );

    if (idx >= 0) {
      const newQty = raw.items[idx].quantity + input.quantity;
      if (newQty > product.stockQty) {
        throw new BadRequestException('Insufficient stock');
      }
      raw.items[idx].quantity = newQty;
    } else {
      raw.items.push({
        productId: input.productId,
        variantId: input.variantId ?? null,
        quantity: input.quantity,
      });
    }

    await this.saveRaw(key, raw);
    return this.hydrate(raw, key);
  }

  async updateQuantity(
    productId: string,
    quantity: number,
    variantId: string | null | undefined,
    guestSession?: string,
    userId?: string,
  ): Promise<CartDTO> {
    const key = this.cartKey(guestSession, userId);
    const raw = await this.loadRaw(key);

    const idx = raw.items.findIndex(
      (i) => i.productId === productId && (i.variantId ?? null) === (variantId ?? null),
    );
    if (idx < 0) throw new NotFoundException('Item not in cart');

    if (quantity <= 0) {
      raw.items.splice(idx, 1);
    } else {
      const product = await this.products.getPublishedForPurchase(productId);
      const qty = Math.min(quantity, product.stockQty);
      raw.items[idx].quantity = qty;
    }

    await this.saveRaw(key, raw);
    return this.hydrate(raw, key);
  }

  async removeItem(
    productId: string,
    variantId: string | null | undefined,
    guestSession?: string,
    userId?: string,
  ): Promise<CartDTO> {
    return this.updateQuantity(productId, 0, variantId, guestSession, userId);
  }

  /** BU-07: merge guest cart into user cart on login */
  async mergeGuestIntoUser(guestSession: string, userId: string): Promise<CartDTO> {
    const guestKey = `${GUEST_PREFIX}${guestSession}`;
    const userKey = `${USER_PREFIX}${userId}`;

    const guestCart = await this.loadRaw(guestKey);
    if (!guestCart.items.length) {
      return this.getCart(undefined, userId);
    }

    const userCart = await this.loadRaw(userKey);

    for (const guestItem of guestCart.items) {
      const product = await this.products.getPublishedForPurchase(guestItem.productId);
      const idx = userCart.items.findIndex(
        (i) =>
          i.productId === guestItem.productId &&
          (i.variantId ?? null) === (guestItem.variantId ?? null),
      );

      const cappedQty = Math.min(
        idx >= 0 ? userCart.items[idx].quantity + guestItem.quantity : guestItem.quantity,
        product.stockQty,
      );

      if (idx >= 0) {
        userCart.items[idx].quantity = cappedQty;
      } else {
        userCart.items.push({ ...guestItem, quantity: cappedQty });
      }
    }

    await this.saveRaw(userKey, userCart);
    const client = this.redis.getClient();
    if (client) await client.del(guestKey);

    return this.hydrate(userCart, userKey);
  }

  async clearForCheckout(guestSession?: string, userId?: string) {
    const key = this.cartKey(guestSession, userId);
    const client = this.redis.getClient();
    if (client) await client.del(key);
  }

  private async hydrate(raw: StoredCart, cartId: string): Promise<CartDTO> {
    const lines: CartLineDTO[] = [];
    let subtotal = 0;
    let itemCount = 0;

    for (const item of raw.items) {
      const product = await this.products.getPublishedForPurchase(item.productId);
      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      itemCount += item.quantity;

      lines.push({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        product: toBuyerProductListItemDTO(product),
      });
    }

    return { id: cartId, items: lines, subtotal, itemCount };
  }
}
