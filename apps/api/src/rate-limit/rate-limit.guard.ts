import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RATE_LIMIT_KEY,
  RATE_LIMITS,
  SKIP_RATE_LIMIT_KEY,
  isRateLimitEnabled,
  type RateLimitTier,
} from './rate-limit.constants';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimit: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!isRateLimitEnabled()) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const tier =
      this.reflector.getAllAndOverride<RateLimitTier>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'general';

    const request = context.switchToHttp().getRequest<{
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();

    const forwarded = request.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
      request.ip ||
      'unknown';

    const { allowed, remaining } = await this.rateLimit.consume(tier, ip);

    const response = context.switchToHttp().getResponse<{
      setHeader: (k: string, v: string | number) => void;
    }>();
    const { max } = RATE_LIMITS[tier];
    response.setHeader('X-RateLimit-Limit', max);
    response.setHeader('X-RateLimit-Remaining', remaining);

    if (!allowed) {
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: 'Too many requests', error: 'Too Many Requests' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
