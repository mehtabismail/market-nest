import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  /** SE-10: earnings summary from delivered seller-owned/assigned items */
  async getSellerEarnings(user: RequestUser) {
    if (!user.sellerId) return null;

    const seller = await this.prisma.seller.findUnique({
      where: { id: user.sellerId },
    });
    if (!seller) return null;

    const rate = Number(seller.commissionRate) / 100;

    const items = await this.prisma.orderItem.findMany({
      where: {
        sellerId: user.sellerId,
        ownerType: { in: ['seller_owned', 'seller_assigned'] },
        status: 'delivered',
      },
    });

    const gross = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
    const commission = gross * rate;
    const net = gross - commission;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sumSince = (since: Date) => {
      const filtered = items.filter((i) => i.createdAt >= since);
      const g = filtered.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
      const c = g * rate;
      return { gross: g, commission: c, net: g - c };
    };

    return {
      commissionRate: Number(seller.commissionRate),
      allTime: { gross, commission, net },
      week: sumSince(weekAgo),
      month: sumSince(monthAgo),
      dailyChart: await this.dailyEarnings(user.sellerId, 30, rate),
    };
  }

  async listSellerPayouts(user: RequestUser) {
    if (!user.sellerId) return [];
    return this.prisma.payout.findMany({
      where: { sellerId: user.sellerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAllPayouts() {
    return this.prisma.payout.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            inviteEmail: true,
          },
        },
      },
    });
  }

  /** Admin: generate weekly payout records for sellers */
  async generateWeeklyPayouts() {
    const sellers = await this.prisma.seller.findMany({
      where: { isSystem: false, isActive: true, userId: { not: null } },
    });

    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const created = [];

    for (const seller of sellers) {
      const rate = Number(seller.commissionRate) / 100;
      const items = await this.prisma.orderItem.findMany({
        where: {
          sellerId: seller.id,
          ownerType: { in: ['seller_owned', 'seller_assigned'] },
          status: 'delivered',
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      });

      if (!items.length) continue;

      const gross = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
      const commission = gross * rate;
      const net = gross - commission;

      const payout = await this.prisma.payout.create({
        data: {
          sellerId: seller.id,
          amount: net,
          grossAmount: gross,
          commissionAmount: commission,
          netAmount: net,
          periodStart,
          periodEnd,
          status: 'pending',
        },
      });
      created.push(payout);
    }

    return { created: created.length, payouts: created };
  }

  private async dailyEarnings(sellerId: string, days: number, rate: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const items = await this.prisma.orderItem.findMany({
      where: {
        sellerId,
        status: 'delivered',
        createdAt: { gte: since },
      },
    });

    const byDay = new Map<string, number>();
    for (const i of items) {
      const key = i.createdAt.toISOString().slice(0, 10);
      const net = Number(i.unitPrice) * i.quantity * (1 - rate);
      byDay.set(key, (byDay.get(key) ?? 0) + net);
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, net]) => ({ date, net: Number(net.toFixed(2)) }));
  }
}
