import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/** Upstash (and most cloud Redis) require TLS — use rediss:// */
function normalizeRedisUrl(url: string): string {
  if (url.includes('upstash.io') && url.startsWith('redis://')) {
    return url.replace('redis://', 'rediss://');
  }
  return url;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  getClient(): Redis | null {
    if (this.client) return this.client;

    const raw = process.env.REDIS_URL;
    if (!raw) {
      this.logger.warn('REDIS_URL not set — cart/session cache disabled until configured');
      return null;
    }

    const url = normalizeRedisUrl(raw);
    if (url !== raw) {
      this.logger.log('Using TLS (rediss://) for Upstash Redis');
    }

    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      ...(url.startsWith('rediss://') ? { tls: {} } : {}),
    });
    return this.client;
  }

  async ping(): Promise<boolean> {
    const redis = this.getClient();
    if (!redis) return false;
    try {
      if (redis.status !== 'ready') await redis.connect();
      const result = await redis.ping();
      return result === 'PONG';
    } catch (err) {
      this.logger.warn(`Redis ping failed: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
