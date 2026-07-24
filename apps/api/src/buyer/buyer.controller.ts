import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { BuyerService } from './buyer.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

// Customers — buyers and sellers both. A seller checks out too, so they need
// their saved addresses just like any shopper.
@ApiTags('buyer')
@ApiBearerAuth()
@Roles('buyer', 'seller')
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

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.buyerService.updateAddress(user.id, id, dto);
  }

  @Delete('addresses/:id')
  removeAddress(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.buyerService.removeAddress(user.id, id);
  }
}
