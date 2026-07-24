import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForProduct(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { fullName: true, avatarUrl: true } },
      },
    });

    const stats = await this.aggregate(productId);

    return {
      ...stats,
      items: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        buyerName: r.buyer.fullName ?? 'Verified buyer',
      })),
    };
  }

  async aggregate(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true },
    });

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) {
      dist[d.rating] = d._count.rating;
    }

    return {
      averageRating: agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : null,
      reviewCount: agg._count.rating,
      distribution: dist,
    };
  }

  async aggregateBatch(
    productIds: string[],
  ): Promise<Map<string, { averageRating: number | null; reviewCount: number }>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const stats = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const result = new Map<string, { averageRating: number | null; reviewCount: number }>();

    for (const productId of productIds) {
      result.set(productId, { averageRating: null, reviewCount: 0 });
    }

    for (const stat of stats) {
      result.set(stat.productId, {
        averageRating: stat._avg.rating ? Number(stat._avg.rating.toFixed(1)) : null,
        reviewCount: stat._count.rating,
      });
    }

    return result;
  }

  async create(buyerId: string, productId: string, rating: number, body?: string) {
    const eligibility = await this.eligibility(buyerId, productId);
    if (!eligibility.canReview) {
      throw new ForbiddenException(eligibility.reason ?? 'You cannot review this product');
    }

    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: 'published' },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.review.create({
      data: { productId, buyerId, rating, body },
    });
  }

  /**
   * Single source of truth for "may this buyer write a review".
   * Requires a delivered order line for the product and no existing review.
   */
  async eligibility(buyerId: string, productId: string) {
    const existing = await this.prisma.review.findUnique({
      where: { productId_buyerId: { productId, buyerId } },
      select: { id: true },
    });
    if (existing) {
      return { canReview: false, reason: 'You already reviewed this product' as const };
    }

    const delivered = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        status: 'delivered',
        order: { buyerId },
      },
      select: { id: true },
    });

    if (!delivered) {
      return {
        canReview: false,
        reason: 'You can only review products from delivered orders' as const,
      };
    }

    return { canReview: true as const, reason: null };
  }

  async reviewableProducts(buyerId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        status: 'delivered',
        order: { buyerId },
      },
      distinct: ['productId'],
      include: { product: { select: { id: true, title: true, images: true } } },
    });

    const reviewed = await this.prisma.review.findMany({
      where: { buyerId, productId: { in: items.map((i) => i.productId) } },
      select: { productId: true },
    });
    const reviewedSet = new Set(reviewed.map((r) => r.productId));

    return items
      .filter((i) => !reviewedSet.has(i.productId))
      .map((i) => ({
        productId: i.productId,
        title: i.product.title,
        thumbnail: Array.isArray(i.product.images)
          ? (i.product.images as string[])[0]
          : null,
      }));
  }
}
