import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { PayoutsService } from './payouts.service';

@ApiTags('seller-payouts')
@ApiBearerAuth()
@Roles('seller')
@Controller('seller')
export class SellerPayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get('earnings')
  earnings(@CurrentUser() user: RequestUser) {
    return this.payouts.getSellerEarnings(user);
  }

  @Get('payouts')
  list(@CurrentUser() user: RequestUser) {
    return this.payouts.listSellerPayouts(user);
  }
}

@ApiTags('admin-payouts')
@ApiBearerAuth()
@Roles('superadmin')
@Controller('admin/payouts')
export class AdminPayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get()
  listAll() {
    return this.payouts.listAllPayouts();
  }

  @Post('generate-weekly')
  generateWeekly() {
    return this.payouts.generateWeeklyPayouts();
  }
}
