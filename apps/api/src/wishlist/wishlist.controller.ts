import { Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { WishlistService } from './wishlist.service';

// Buyers and sellers: a seller is also a shopper and keeps a wishlist.
@ApiTags('wishlist')
@ApiBearerAuth()
@Roles('buyer', 'seller')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.wishlist.list(user.id);
  }

  @Get('ids')
  listIds(@CurrentUser() user: RequestUser) {
    return this.wishlist.listIds(user.id);
  }

  @Post(':productId')
  add(@CurrentUser() user: RequestUser, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.wishlist.add(user.id, productId, user.sellerId);
  }

  @Delete(':productId')
  remove(@CurrentUser() user: RequestUser, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.wishlist.remove(user.id, productId);
  }
}
