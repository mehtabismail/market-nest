import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportProcessor } from './analytics-export.processor';

const redisUrl = process.env.REDIS_URL;

@Module({
  imports: [AuthModule, ProductsModule, OrdersModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService, AnalyticsService, ...(redisUrl ? [AnalyticsExportProcessor] : [])],
})
export class AdminModule {}
