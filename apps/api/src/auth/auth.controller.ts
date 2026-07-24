import { Body, Controller, Get, Headers, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import { AuthService } from './auth.service';
import type { RequestUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { OauthCallbackDto } from './dto/oauth-callback.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { SellerSetupPasswordDto } from './dto/seller-setup-password.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @RateLimit('auth')
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @RateLimit('auth')
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @RateLimit('auth')
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshSession(dto);
  }

  @Public()
  @Post('logout')
  logout(@Headers('authorization') authorization?: string) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim() || null;
    return this.authService.logout(accessToken);
  }

  @Public()
  @RateLimit('auth')
  @Post('oauth/callback')
  oauthCallback(@Body() dto: OauthCallbackDto) {
    return this.authService.oauthCallback(dto);
  }

  @Public()
  @RateLimit('auth')
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Get('seller/invite-status')
  sellerInviteStatus(@Query('email') email: string) {
    return this.authService.sellerInviteStatus(email);
  }

  @Public()
  @RateLimit('auth')
  @Post('seller/setup-password')
  sellerSetupPassword(@Body() dto: SellerSetupPasswordDto) {
    return this.authService.sellerSetupPassword(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user.id);
  }

  @ApiBearerAuth()
  @Patch('me')
  updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user.id, dto);
  }
}
