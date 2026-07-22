import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { QUEUE_EMBEDDING } from '../search/search.constants';
import { QUEUE_EMAIL, QUEUE_EXPORT } from './notifications.constants';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationsService } from './notifications.service';
import { NotificationFeedService } from './notification-feed.service';
import { NotificationFeedController } from './notification-feed.controller';
import { EmailProcessor } from './email.processor';

const redisUrl = process.env.REDIS_URL;

const bullImports = redisUrl
  ? [
      BullModule.forRoot({ connection: { url: redisUrl } }),
      BullModule.registerQueue(
        { name: QUEUE_EMAIL },
        { name: QUEUE_EXPORT },
        { name: QUEUE_EMBEDDING },
      ),
    ]
  : [];

@Module({
  imports: [...bullImports, AuthModule],
  // The in-app feed ships here rather than in its own module because it is the
  // durable counterpart to the same events the email queue sends — an order
  // status change writes both, and splitting them puts the two halves of one
  // notification in two modules.
  controllers: [NotificationFeedController],
  providers: [
    EmailService,
    SmsService,
    NotificationsService,
    NotificationFeedService,
    ...(redisUrl ? [EmailProcessor] : []),
  ],
  exports: [BullModule, NotificationsService, NotificationFeedService, EmailService, SmsService],
})
export class NotificationsModule {}
