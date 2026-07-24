import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';

@Module({
  // AuthModule for ProfileCacheService — onboarding flips the role and must
  // invalidate the cached profile the JWT guard reads.
  imports: [AuthModule, NotificationsModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
