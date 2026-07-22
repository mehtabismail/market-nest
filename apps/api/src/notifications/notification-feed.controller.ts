import { Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { NotificationFeedService } from './notification-feed.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationFeedController {
  constructor(private readonly feed: NotificationFeedService) {}

  /**
   * No `@Roles` guard: every signed-in role has a feed. Sellers get payout and
   * KYC notices, buyers get order updates, admins get both.
   */
  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.feed.list(user.id);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: RequestUser) {
    return this.feed.unreadCount(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.feed.markRead(user.id, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.feed.markAllRead(user.id);
  }
}
