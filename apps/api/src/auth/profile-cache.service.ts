import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export const PROFILE_CACHE_TTL_SEC = 300;
const PROFILE_CACHE_PREFIX = 'profile:';

export interface CachedProfile {
  id: string;
  email: string;
  role: string;
  sellerId?: string;
  sellerActive?: boolean;
  sellerStatus?: string;
}

/**
 * Caches the profile lookup that runs on every authenticated request.
 *
 * Extracted from JwtAuthGuard so that mutations elsewhere can invalidate it.
 * Without invalidation a suspended seller kept trading for up to the full TTL,
 * because the guard's suspension check reads this cache — an admin suspending a
 * fraudulent seller had no idea the block would not bite for five minutes.
 *
 * Any write that changes a user's role, or a seller's active/suspended state,
 * must call `invalidate()`.
 */
@Injectable()
export class ProfileCacheService {
  private readonly logger = new Logger(ProfileCacheService.name);

  constructor(private readonly redis: RedisService) {}

  private key(userId: string) {
    return `${PROFILE_CACHE_PREFIX}${userId}`;
  }

  async get(userId: string): Promise<CachedProfile | null> {
    const client = this.redis.getClient();
    if (!client) return null;

    try {
      const cached = await client.get(this.key(userId));
      return cached ? (JSON.parse(cached) as CachedProfile) : null;
    } catch (err) {
      // A cache miss is always safe — the guard falls back to Postgres.
      this.logger.warn(`Profile cache read failed: ${err}`);
      return null;
    }
  }

  async set(userId: string, profile: CachedProfile): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;

    try {
      await client.setex(this.key(userId), PROFILE_CACHE_TTL_SEC, JSON.stringify(profile));
    } catch (err) {
      this.logger.warn(`Profile cache write failed: ${err}`);
    }
  }

  /**
   * Drops a cached profile so the next request re-reads from Postgres.
   *
   * `userId` is nullable at call sites because an invited seller may not have
   * claimed their account yet — there is nothing cached for them, so skipping is
   * correct rather than an error.
   */
  async invalidate(userId: string | null | undefined): Promise<void> {
    if (!userId) return;
    const client = this.redis.getClient();
    if (!client) return;

    try {
      await client.del(this.key(userId));
    } catch (err) {
      // Log loudly: a failed invalidation means a stale privilege check.
      this.logger.error(`Profile cache invalidation FAILED for ${userId}: ${err}`);
    }
  }
}
