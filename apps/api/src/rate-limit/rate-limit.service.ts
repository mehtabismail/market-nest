import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { RATE_LIMITS, isRateLimitEnabled, type RateLimitTier } from './rate-limit.constants';

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  async consume(tier: RateLimitTier, identity: string): Promise<{ allowed: boolean; remaining: number }> {
    const { max, windowSec } = RATE_LIMITS[tier];
    if (!isRateLimitEnabled()) {
      return { allowed: true, remaining: max };
    }

    const client = this.redis.getClient();
    if (!client) {
      return { allowed: true, remaining: max };
    }

    const window = Math.floor(Date.now() / (windowSec * 1000));
    const key = `rl:${tier}:${identity}:${window}`;

    try {
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, windowSec);
      }
      const remaining = Math.max(0, max - count);
      return { allowed: count <= max, remaining };
    } catch {
      return { allowed: true, remaining: max };
    }
  }
}
