import { Body, Controller, Delete, Get, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { GuestSession } from '../common/decorators/guest-session.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import type { RequestUser } from '../auth/auth.types';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const GUEST_COOKIE = 'mn_guest';

// NOTE: @Public() is applied per-method, never at class level. A class-level
// @Public() is inherited by every handler and silently disables JwtAuthGuard on
// routes that declare it (getAllAndOverride falls through to the class), which
// made POST /cart/merge unauthenticated.
@ApiTags('cart')
@UseGuards(OptionalJwtGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Public()
  @Post('guest-session')
  createGuestSession(@Res({ passthrough: true }) res: Response) {
    const { sessionId } = this.cart.createGuestSession();
    res.cookie(GUEST_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { sessionId };
  }

  @Public()
  @ApiHeader({ name: 'x-guest-session', required: false })
  @Get()
  getCart(@GuestSession() guest: string | undefined, @CurrentUser() user?: RequestUser) {
    return this.cart.getCart(guest, user?.id);
  }

  @Public()
  @ApiHeader({ name: 'x-guest-session', required: false })
  @Post('items')
  addItem(
    @Body() dto: AddCartItemDto,
    @GuestSession() guest: string | undefined,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.cart.addItem(dto, guest, user?.id, user?.sellerId);
  }

  @Public()
  @ApiHeader({ name: 'x-guest-session', required: false })
  @Patch('items')
  updateItem(
    @Body() dto: UpdateCartItemDto,
    @GuestSession() guest: string | undefined,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.cart.updateQuantity(
      dto.productId,
      dto.quantity,
      dto.variantId,
      guest,
      user?.id,
    );
  }

  @Public()
  @ApiHeader({ name: 'x-guest-session', required: false })
  @Delete('items/:productId')
  removeItem(
    @Param('productId') productId: string,
    @GuestSession() guest: string | undefined,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.cart.removeItem(productId, null, guest, user?.id);
  }

  @ApiBearerAuth()
  @Post('merge')
  async merge(
    @GuestSession() guest: string | undefined,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!guest) return this.cart.getCart(undefined, user.id);
    const result = await this.cart.mergeGuestIntoUser(guest, user.id);
    res.clearCookie(GUEST_COOKIE);
    return result;
  }
}
