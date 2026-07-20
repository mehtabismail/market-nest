import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_EXPORT } from '../notifications/notifications.constants';

type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed';

@Injectable()
export class AnalyticsService {
  private readonly inlineExports = new Map<string, { csv: string; filename: string }>();

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @InjectQueue(QUEUE_EXPORT) private readonly exportQueue?: Queue,
  ) {}

  async getPlatformAnalytics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const validStatuses = { notIn: ['cancelled', 'refunded'] as ('cancelled' | 'refunded')[] };

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: since }, status: validStatuses },
      include: { items: true },
    });

    const gmv = orders.reduce((s, o) => s + Number(o.total), 0);
    const orderCount = orders.length;
    const aov = orderCount ? gmv / orderCount : 0;

    const byDay = new Map<string, { gmv: number; orders: number }>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { gmv: 0, orders: 0 };
      cur.gmv += Number(o.total);
      cur.orders += 1;
      byDay.set(key, cur);
    }

    const dailyGmv = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, gmv: v.gmv, orders: v.orders }));

    const ownerBreakdown = await this.prisma.orderItem.groupBy({
      by: ['ownerType'],
      where: { order: { createdAt: { gte: since }, status: validStatuses } },
      _sum: { unitPrice: true },
      _count: true,
    });

    const topSellersRaw = await this.prisma.orderItem.groupBy({
      by: ['sellerId'],
      where: {
        sellerId: { not: null },
        order: { createdAt: { gte: since }, status: validStatuses },
      },
      _sum: { unitPrice: true },
    });
    const topSellers = topSellersRaw
      .sort(
        (a, b) =>
          Number(b._sum?.unitPrice ?? 0) - Number(a._sum?.unitPrice ?? 0),
      )
      .slice(0, 10);

    const sellerIds = topSellers.map((t) => t.sellerId!).filter(Boolean);
    const sellers = await this.prisma.seller.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, storeName: true },
    });
    const sellerMap = new Map(sellers.map((s) => [s.id, s.storeName]));

    const topProductsRaw = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { createdAt: { gte: since }, status: validStatuses } },
      _sum: { unitPrice: true },
      _count: true,
    });
    const topProducts = topProductsRaw
      .sort((a, b) => (b._count ?? 0) - (a._count ?? 0))
      .slice(0, 10);

    const productIds = topProducts.map((t) => t.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p.title]));

    const [newBuyers, newSellers] = await Promise.all([
      this.prisma.profile.count({ where: { role: 'buyer', createdAt: { gte: since } } }),
      this.prisma.seller.count({ where: { isSystem: false, createdAt: { gte: since } } }),
    ]);

    return {
      periodDays: days,
      gmv,
      orderCount,
      averageOrderValue: Number(aov.toFixed(2)),
      newBuyers,
      newSellers,
      dailyGmv,
      revenueByOwnerType: ownerBreakdown.map((o) => ({
        ownerType: o.ownerType,
        itemCount: o._count ?? 0,
        revenue: Number(o._sum?.unitPrice ?? 0),
      })),
      topSellers: topSellers.map((t) => ({
        sellerId: t.sellerId,
        storeName: sellerMap.get(t.sellerId!) ?? 'Unknown',
        gmv: Number(t._sum?.unitPrice ?? 0),
      })),
      topProducts: topProducts.map((t) => ({
        productId: t.productId,
        title: productMap.get(t.productId) ?? 'Unknown',
        units: t._count ?? 0,
      })),
    };
  }

  async exportCsv(days = 30): Promise<string> {
    const data = await this.getPlatformAnalytics(days);
    const lines = [
      'date,orders,gmv',
      ...data.dailyGmv.map((d) => `${d.date},${d.orders},${d.gmv.toFixed(2)}`),
      '',
      `summary_period_days,${days}`,
      `total_gmv,${data.gmv.toFixed(2)}`,
      `total_orders,${data.orderCount}`,
      `new_buyers,${data.newBuyers}`,
      `new_sellers,${data.newSellers}`,
    ];
    return lines.join('\n');
  }

  async getRevenueSummary(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const validStatuses = { notIn: ['cancelled', 'refunded'] as ('cancelled' | 'refunded')[] };

    const [orders, orderItems] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: since }, status: validStatuses },
        select: { id: true, createdAt: true, total: true },
      }),
      this.prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: since }, status: validStatuses } },
        select: {
          createdAt: true,
          ownerType: true,
          sellerId: true,
          quantity: true,
          unitPrice: true,
        },
      }),
    ]);

    const gmv = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const sellerIds = Array.from(
      new Set(orderItems.map((item) => item.sellerId).filter((id): id is string => Boolean(id))),
    );
    const sellers = await this.prisma.seller.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, commissionRate: true },
    });
    const sellerRateMap = new Map(sellers.map((seller) => [seller.id, Number(seller.commissionRate ?? 0)]));

    let totalCommission = 0;
    let platformOwnedRevenue = 0;
    const daily = new Map<string, { gmv: number; commission: number; netPlatformRevenue: number }>();

    for (const item of orderItems) {
      const lineTotal = Number(item.unitPrice) * item.quantity;
      const key = item.createdAt.toISOString().slice(0, 10);
      const current = daily.get(key) ?? { gmv: 0, commission: 0, netPlatformRevenue: 0 };
      current.gmv += lineTotal;

      if (item.ownerType === 'platform_owned') {
        platformOwnedRevenue += lineTotal;
        current.netPlatformRevenue += lineTotal;
      } else {
        const rate = (sellerRateMap.get(item.sellerId ?? '') ?? 0) / 100;
        const commission = lineTotal * rate;
        totalCommission += commission;
        current.commission += commission;
        current.netPlatformRevenue += commission;
      }

      daily.set(key, current);
    }

    return {
      periodDays: days,
      gmv: Number(gmv.toFixed(2)),
      commission: Number(totalCommission.toFixed(2)),
      platformOwnedRevenue: Number(platformOwnedRevenue.toFixed(2)),
      netPlatformRevenue: Number((totalCommission + platformOwnedRevenue).toFixed(2)),
      orderCount: orders.length,
      daily: Array.from(daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({
          date,
          gmv: Number(value.gmv.toFixed(2)),
          commission: Number(value.commission.toFixed(2)),
          netPlatformRevenue: Number(value.netPlatformRevenue.toFixed(2)),
        })),
    };
  }

  async enqueueExport(days = 30) {
    if (!this.exportQueue) {
      const csv = await this.exportCsv(days);
      const filename = `marketnest-analytics-${Date.now()}.csv`;
      const jobId = `inline-${Date.now()}`;
      this.inlineExports.set(jobId, { csv, filename });
      return { jobId, status: 'completed' as ExportStatus };
    }

    const job = await this.exportQueue.add(
      'analytics-export',
      { days },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
    return { jobId: String(job.id), status: 'queued' as ExportStatus };
  }

  async getExportStatus(jobId: string) {
    if (!this.exportQueue) {
      const inline = this.inlineExports.get(jobId);
      if (!inline) throw new NotFoundException('Export job not found');
      return { status: 'completed' as ExportStatus, ...inline };
    }

    const job = await this.exportQueue.getJob(jobId);
    if (!job) throw new NotFoundException('Export job not found');

    const state = await job.getState();
    const status = this.mapQueueState(state);
    if (status === 'completed') {
      const value = (job.returnvalue ?? {}) as { csv?: string; filename?: string };
      return { status, csv: value.csv, filename: value.filename };
    }

    return { status };
  }

  private mapQueueState(state: string): ExportStatus {
    if (state === 'completed') return 'completed';
    if (state === 'failed') return 'failed';
    if (state === 'active') return 'processing';
    return 'queued';
  }
}
