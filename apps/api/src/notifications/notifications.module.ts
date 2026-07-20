import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { QUEUE_EMBEDDING } from '../search/search.constants';
import { QUEUE_EMAIL, QUEUE_EXPORT } from './notifications.constants';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationsService } from './notifications.service';
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
  providers: [
    EmailService,
    SmsService,
    NotificationsService,
    ...(redisUrl ? [EmailProcessor] : []),
  ],
  exports: [BullModule, NotificationsService, EmailService, SmsService],
})
export class NotificationsModule {}
