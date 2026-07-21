import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GuestSession } from '../common/decorators/guest-session.decorator';
import type { RequestUser } from '../auth/auth.types';
import { OrdersService } from './orders.service';
import { CheckoutBodyDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaymentsService } from '../payments/payments.service';
import { RateLimit } from '../rate-limit/rate-limit.decorator';

// Buyer-only by design. Admins read orders through /admin/orders and
// /admin/fulfilment; letting them transact here would break separation of
// duties (place order -> approve -> trigger payout) and would put internal
// test orders into GMV and revenue analytics.
@ApiTags('orders')
@ApiBearerAuth()
@Roles('buyer')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
  ) {}

  @ApiHeader({ name: 'x-guest-session', required: false })
  @RateLimit('checkout')
  @Post('checkout')
  checkout(
    @CurrentUser() user: RequestUser,
    @Body() dto: CheckoutBodyDto,
    @GuestSession() guest?: string,
  ) {
    return this.orders.checkout(user, dto, guest);
  }

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.orders.listBuyerOrders(user.id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.getBuyerOrder(user.id, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.cancelBuyerOrder(user.id, id);
  }

  @Post(':id/payment-intent')
  paymentIntent(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.payments.createPaymentIntent(id, user.id);
  }
}

@ApiTags('seller-orders')
@ApiBearerAuth()
@Roles('seller')
@Controller('seller/orders')
export class SellerOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.orders.listSellerOrders(user);
  }

  @Patch('items/:itemId/status')
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateSellerOrderItem(user, itemId, dto);
  }
}
