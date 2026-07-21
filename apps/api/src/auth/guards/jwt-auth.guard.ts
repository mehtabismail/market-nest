import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { SupabaseService } from '../supabase.service';
import type { RequestUser } from '../auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileCacheService, type CachedProfile } from '../profile-cache.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
    private readonly profileCache: ProfileCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: RequestUser;
    }>();

    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    const { data, error } = await this.supabase.getClient().auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = data.user.id;
    const userEmail = data.user.email ?? '';

    const cached = await this.profileCache.get(userId);
    if (cached) {
      this.validateSellerStatus(cached);
      request.user = {
        id: cached.id,
        email: cached.email,
        role: cached.role as RequestUser['role'],
        sellerId: cached.sellerId,
      };
      return true;
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      include: { seller: { select: { id: true, isActive: true, status: true } } },
    });

    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    const cachedData: CachedProfile = {
      id: profile.id,
      email: userEmail,
      role: profile.role,
      sellerId: profile.seller?.id,
      sellerActive: profile.seller?.isActive,
      sellerStatus: profile.seller?.status,
    };

    await this.profileCache.set(userId, cachedData);

    this.validateSellerStatus(cachedData);

    request.user = {
      id: profile.id,
      email: userEmail,
      role: profile.role as RequestUser['role'],
      sellerId: profile.seller?.id,
    };

    return true;
  }

  private validateSellerStatus(profile: CachedProfile) {
    if (
      profile.role === 'seller' &&
      profile.sellerId &&
      (!profile.sellerActive || profile.sellerStatus === 'suspended')
    ) {
      throw new ForbiddenException(
        'Seller account is suspended or inactive. Please contact support.',
      );
    }
  }
}
