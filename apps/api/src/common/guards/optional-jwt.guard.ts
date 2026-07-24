import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../auth/supabase.service';
import type { RequestUser } from '../../auth/auth.types';
import {
  ProfileCacheService,
  type CachedProfile,
} from '../../auth/profile-cache.service';
import { PrismaService } from '../../prisma/prisma.service';

/** Sets request.user when Bearer token present; never throws. */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
    private readonly profileCache: ProfileCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: RequestUser;
    }>();

    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    if (!token) return true;

    try {
      const { data, error } = await this.supabase.getClient().auth.getUser(token);
      if (error || !data.user) return true;

      const userId = data.user.id;
      const userEmail = data.user.email ?? '';

      const cached = await this.profileCache.get(userId);
      if (cached) {
        request.user = {
          id: cached.id,
          email: cached.email || userEmail,
          role: cached.role as RequestUser['role'],
          sellerId: cached.sellerId,
        };
        return true;
      }

      const profile = await this.prisma.withRetry(
        () =>
          this.prisma.profile.findUnique({
            where: { id: userId },
            include: { seller: { select: { id: true, isActive: true, status: true } } },
          }),
        'optional-jwt profile',
      );

      if (profile) {
        const cachedData: CachedProfile = {
          id: profile.id,
          email: userEmail,
          role: profile.role,
          sellerId: profile.seller?.id,
          sellerActive: profile.seller?.isActive,
          sellerStatus: profile.seller?.status,
        };
        await this.profileCache.set(userId, cachedData);

        request.user = {
          id: profile.id,
          email: userEmail,
          role: profile.role as RequestUser['role'],
          sellerId: profile.seller?.id,
        };
      }
    } catch {
      /* guest continues — never block public catalogue on auth blips */
    }

    return true;
  }
}
