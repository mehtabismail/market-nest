import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const FEED_PAGE_SIZE = 50;

/**
 * The in-app notification feed.
 *
 * Separate from `NotificationsService`, which queues transactional email. The
 * two look similar but have opposite delivery models: email is fire-and-forget
 * to an external provider, this is durable state the user reads, marks, and
 * comes back to. Merging them would mean every email send writes a feed row
 * nobody asked for.
 */
@Injectable()
export class NotificationFeedService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: FEED_PAGE_SIZE,
    });
  }

  /** Drives the badge dot on the home header. */
  async unreadCount(userId: string): Promise<{ unread: number }> {
    const unread = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { unread };
  }

  /**
   * Scoped by `userId` as well as `id` so a guessed notification id cannot mark
   * someone else's feed read. `updateMany` rather than `update` because a
   * mismatch should be a no-op, not a thrown 404 that confirms the id exists.
   */
  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { id, read: true };
  }

  async markAllRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { marked: count };
  }

  /** Called by order, payout, and KYC flows when something changes. */
  create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  }
}
