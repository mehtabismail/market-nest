import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SkipRateLimit } from '../rate-limit/rate-limit.decorator';
import { isRateLimitEnabled } from '../rate-limit/rate-limit.constants';
import { isAuthEmailBypassEnabled } from '../auth/auth-env';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('health')
@Public()
@SkipRateLimit()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    let database = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch {
      database = false;
    }

    const redis = await this.redis.ping();

    return {
      status: database ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
        cache: redis,
        rateLimit: redis && isRateLimitEnabled(),
        rateLimitEnabled: isRateLimitEnabled(),
        authEmailBypass: isAuthEmailBypassEnabled(),
        embeddings: Boolean(process.env.OPENAI_API_KEY),
      },
    };
  }
}
