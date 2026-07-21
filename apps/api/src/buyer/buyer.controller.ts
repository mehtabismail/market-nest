import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { BuyerService } from './buyer.service';
import { CreateAddressDto } from './dto/create-address.dto';

@ApiTags('buyer')
@ApiBearerAuth()
@Roles('buyer')
@Controller('buyer')
export class BuyerController {
  constructor(private readonly buyerService: BuyerService) {}

  @Get('addresses')
  listAddresses(@CurrentUser() user: RequestUser) {
    return this.buyerService.listAddresses(user.id);
  }

  @Post('addresses')
  createAddress(@CurrentUser() user: RequestUser, @Body() dto: CreateAddressDto) {
    return this.buyerService.addAddress(user.id, dto);
  }
}
