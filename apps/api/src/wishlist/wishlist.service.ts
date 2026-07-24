import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** First image URL from the product's `images` JSON, or null. */
function firstImage(images: Prisma.JsonValue): string | null {
  if (Array.isArray(images) && typeof images[0] === 'string') return images[0];
  return null;
}

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The buyer's saved products, newest first.
   *
   * Returns the same anonymised shape as the catalogue — a wishlist entry is
   * still a buyer-facing product view, so it must not leak seller identity.
   */
  async list(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            comparePrice: true,
            images: true,
            hue: true,
            status: true,
            sellerId: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    const seller = await this.prisma.seller.findFirst({
      where: { userId },
      select: { id: true },
    });

    // Drop archived + own listings (a seller should never see their own product saved).
    return items
      .filter((item) => item.product.status === 'published')
      .filter((item) => !seller || item.product.sellerId !== seller.id)
      .map((item) => ({
        id: item.product.id,
        title: item.product.title,
        price: Number(item.product.price),
        comparePrice: item.product.comparePrice ? Number(item.product.comparePrice) : null,
        thumbnail: firstImage(item.product.images),
        hue: item.product.hue,
        category: item.product.category?.name ?? null,
        savedAt: item.createdAt,
      }));
  }

  /** Just the ids, for painting heart states across a grid in one request. */
  async listIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });
    return rows.map((r) => r.productId);
  }

  /**
   * Idempotent add. A double-tap on the heart must not 500 on the unique
   * constraint, so the conflict is absorbed rather than surfaced.
   */
  async add(userId: string, productId: string, sellerId?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: 'published' },
      select: { id: true, sellerId: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (sellerId && product.sellerId === sellerId) {
      throw new BadRequestException('You cannot save your own listing');
    }

    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    return { productId, wishlisted: true };
  }

  /** Idempotent remove — deleting an absent row is a success, not a 404. */
  async remove(userId: string, productId: string) {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return { productId, wishlisted: false };
  }

  async toggle(userId: string, productId: string, sellerId?: string) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true },
    });
    return existing ? this.remove(userId, productId) : this.add(userId, productId, sellerId);
  }
}
