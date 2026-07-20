import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthSession } from '@marketnest/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from './supabase.service';
import { AuthPortal, LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { SellerSetupPasswordDto } from './dto/seller-setup-password.dto';
import { OauthCallbackDto } from './dto/oauth-callback.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDto): Promise<AuthSession> {
    const { data, error } = await this.supabase.getClient().auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let profile = await this.prisma.profile.findUnique({
      where: { id: data.user.id },
      include: { seller: { select: { id: true, isActive: true, status: true } } },
    });

    if (!profile) {
      profile = await this.claimSellerInvite(data.user.id, data.user.email ?? dto.email);
    }

    if (!profile) {
      throw new BadRequestException(
        'Profile not found. Register as a buyer or use your seller invite.',
      );
    }

    if (
      profile.role === 'seller' &&
      profile.seller &&
      (!profile.seller.isActive || profile.seller.status === 'suspended')
    ) {
      throw new ForbiddenException(
        'Seller account is suspended or inactive. Please contact support.',
      );
    }

    this.assertPortalAccess(dto.portal, profile.role);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email ?? dto.email,
        role: profile.role as AuthSession['user']['role'],
        fullName: profile.fullName,
      },
    };
  }

  async register(dto: RegisterDto): Promise<AuthSession> {
    const { data, error } = await this.supabase.getClient().auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user) {
      throw new BadRequestException(error?.message ?? 'Registration failed');
    }

    const profile = await this.prisma.profile.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        role: 'buyer',
        fullName: dto.fullName ?? null,
      },
      update: {},
    });

    if (!data.session) {
      throw new BadRequestException('Check your email to confirm your account');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: dto.email,
        role: profile.role as AuthSession['user']['role'],
        fullName: profile.fullName,
      },
    };
  }

  async oauthCallback(dto: OauthCallbackDto): Promise<AuthSession> {
    const accessToken = dto.resolvedAccessToken;
    const { data, error } = await this.supabase.getClient().auth.getUser(accessToken);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid OAuth token');
    }

    const email = data.user.email;
    if (!email) {
      throw new BadRequestException('OAuth account email is required');
    }

    const metadataName =
      this.readStringMetadata(data.user.user_metadata, 'full_name') ??
      this.readStringMetadata(data.user.user_metadata, 'name');

    const profile = await this.prisma.profile.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        role: 'buyer',
        fullName: metadataName ?? null,
      },
      update: {
        role: 'buyer',
        ...(metadataName ? { fullName: metadataName } : {}),
      },
    });

    return {
      accessToken,
      user: {
        id: data.user.id,
        email,
        role: profile.role as AuthSession['user']['role'],
        fullName: profile.fullName,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const redirectTo =
      process.env.AUTH_RESET_REDIRECT_URL ?? 'http://localhost:3000/shop/reset-password';

    const { error } = await this.supabase.getClient().auth.resetPasswordForEmail(dto.email, {
      redirectTo,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { ok: true, message: 'If the email exists, a reset link has been sent.' };
  }

  async sellerInviteStatus(email: string) {
    if (!email?.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    const seller = await this.prisma.seller.findFirst({
      where: { inviteEmail: email.toLowerCase(), status: { in: ['invited', 'active'] } },
      select: { storeName: true, status: true, userId: true },
    });

    return {
      invited: Boolean(seller),
      storeName: seller?.storeName ?? null,
      hasAccount: Boolean(seller?.userId),
    };
  }

  async sellerSetupPassword(dto: SellerSetupPasswordDto): Promise<AuthSession> {
    const { data, error } = await this.supabase.getClient().auth.getUser(dto.accessToken);
    if (error || !data.user?.email) {
      throw new UnauthorizedException('Invalid or expired invite link');
    }

    const email = data.user.email;

    const { error: updateError } = await this.supabase.getClient().auth.admin.updateUserById(
      data.user.id,
      { password: dto.password },
    );

    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    let profile = await this.prisma.profile.findUnique({
      where: { id: data.user.id },
      include: { seller: { select: { id: true, isActive: true, status: true } } },
    });

    if (!profile) {
      profile = await this.claimSellerInvite(data.user.id, email);
    }

    if (!profile || profile.role !== 'seller') {
      throw new BadRequestException('No seller invite found for this account');
    }

    // Invite/recovery tokens are often one-time — sign in to issue a fresh session token.
    const { data: signInData, error: signInError } = await this.supabase
      .getClient()
      .auth.signInWithPassword({ email, password: dto.password });

    if (signInError || !signInData.session) {
      throw new BadRequestException(
        signInError?.message ?? 'Password saved. Please sign in with your new password.',
      );
    }

    return {
      accessToken: signInData.session.access_token,
      user: {
        id: data.user.id,
        email,
        role: 'seller',
        fullName: profile.fullName,
      },
    };
  }

  async getMe(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      include: { seller: { select: { id: true, storeName: true, storeSlug: true } } },
    });

    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    return {
      id: profile.id,
      email: null,
      role: profile.role,
      fullName: profile.fullName,
      phone: profile.phone,
      avatarUrl: profile.avatarUrl,
      seller: profile.seller,
    };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    if (!dto.fullName && !dto.phone) {
      throw new BadRequestException('At least one field is required');
    }

    const profile = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
      include: { seller: { select: { id: true, storeName: true, storeSlug: true } } },
    });

    return {
      id: profile.id,
      email: null,
      role: profile.role,
      fullName: profile.fullName,
      phone: profile.phone,
      avatarUrl: profile.avatarUrl,
      seller: profile.seller,
    };
  }

  private assertPortalAccess(portal: AuthPortal | undefined, role: string) {
    if (!portal) return;

    if (portal === AuthPortal.admin && role !== 'superadmin') {
      throw new ForbiddenException('Super admin access only');
    }

    if (portal === AuthPortal.seller && role !== 'seller' && role !== 'superadmin') {
      throw new ForbiddenException('Seller access only');
    }

    if (portal === AuthPortal.buyer && role === 'superadmin') {
      throw new ForbiddenException('Use the admin portal to sign in as super admin');
    }
  }

  private readStringMetadata(metadata: unknown, key: string): string | null {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private async claimSellerInvite(userId: string, email: string) {
    const seller = await this.prisma.seller.findFirst({
      where: { inviteEmail: email.toLowerCase(), userId: null },
    });
    if (!seller) return null;

    await this.prisma.profile.create({
      data: {
        id: userId,
        role: 'seller',
        fullName: seller.storeName,
      },
    });

    await this.prisma.seller.update({
      where: { id: seller.id },
      data: { userId, status: 'active', isActive: true },
    });

    return this.prisma.profile.findUnique({
      where: { id: userId },
      include: { seller: { select: { id: true, isActive: true, status: true } } },
    });
  }
}
