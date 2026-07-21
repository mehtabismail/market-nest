import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../auth/supabase.service';
import type { RequestUser } from '../../auth/auth.types';
import { PrismaService } from '../../prisma/prisma.service';

/** Sets request.user when Bearer token present; never throws. */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
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

      const profile = await this.prisma.profile.findUnique({
        where: { id: data.user.id },
        include: { seller: { select: { id: true } } },
      });

      if (profile) {
        request.user = {
          id: profile.id,
          email: data.user.email ?? '',
          role: profile.role as RequestUser['role'],
          sellerId: profile.seller?.id,
        };
      }
    } catch {
      /* guest continues */
    }

    return true;
  }
}
