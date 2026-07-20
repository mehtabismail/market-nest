import { Module, forwardRef } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersController, SellerOrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    CartModule,
    ProductsModule,
    NotificationsModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [OrdersController, SellerOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
