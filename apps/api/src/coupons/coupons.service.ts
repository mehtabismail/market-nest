import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CouponQuote {
  code: string;
  description: string | null;
  /** Absolute amount to deduct, already capped and clamped to the subtotal. */
  discount: number;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves a code against a subtotal and returns the money to take off.
   *
   * Deliberately returns an amount rather than a coupon object. The caller
   * writes that number onto the order, which means a coupon later edited or
   * deleted cannot retroactively change what a historical order charged.
   *
   * Rejections are specific — "expired" and "below minimum" are different
   * problems with different fixes, and a single "invalid code" would leave the
   * buyer guessing which one they hit.
   */
  async quote(codeInput: string, subtotal: number): Promise<CouponQuote> {
    const code = codeInput.trim().toUpperCase();
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('That promo code is not valid.');
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException('That promo code is not active yet.');
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      throw new BadRequestException('That promo code has expired.');
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('That promo code has been fully redeemed.');
    }

    const minSubtotal = Number(coupon.minSubtotal);
    if (subtotal < minSubtotal) {
      throw new BadRequestException(
        `Spend at least $${minSubtotal.toFixed(2)} to use this code.`,
      );
    }

    const value = Number(coupon.value);
    let discount = coupon.type === 'percentage' ? (subtotal * value) / 100 : value;

    if (coupon.maxDiscount !== null) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }

    // Never let a discount exceed the goods — a fixed-amount code on a small
    // cart would otherwise produce a negative total the payment step accepts.
    discount = Math.min(discount, subtotal);

    return {
      code: coupon.code,
      description: coupon.description,
      discount: Math.round(discount * 100) / 100,
    };
  }

  /**
   * Records a redemption. Called once the order is committed, not at quote
   * time — quoting is a preview and must not consume a limited code.
   *
   * The conditional update is what makes the limit hold under concurrency: two
   * simultaneous checkouts on the last remaining use both pass `quote`, but
   * only one matches `usedCount < usageLimit` at write time.
   */
  async redeem(code: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.coupon.updateMany({
      where: {
        code,
        isActive: true,
        OR: [{ usageLimit: null }, { usedCount: { lt: this.prisma.coupon.fields.usageLimit } }],
      },
      data: { usedCount: { increment: 1 } },
    });
  }

  list() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: {
    code: string;
    description?: string;
    type: 'percentage' | 'fixed';
    value: number;
    minSubtotal?: number;
    maxDiscount?: number | null;
    startsAt?: string | null;
    endsAt?: string | null;
    usageLimit?: number | null;
  }) {
    return this.prisma.coupon.create({
      data: {
        // Codes are matched case-insensitively by normalising on the way in,
        // so `save20` and `SAVE20` cannot become two different coupons.
        code: data.code.trim().toUpperCase(),
        description: data.description ?? null,
        type: data.type,
        value: data.value,
        minSubtotal: data.minSubtotal ?? 0,
        maxDiscount: data.maxDiscount ?? null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        usageLimit: data.usageLimit ?? null,
      },
    });
  }

  update(id: string, data: Prisma.CouponUpdateInput) {
    return this.prisma.coupon.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }
}
