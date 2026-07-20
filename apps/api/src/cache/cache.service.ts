import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

const DEFAULT_CATALOGUE_TTL = 60;

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const client = this.redis.getClient();
    if (!client) return null;
    try {
      const raw = await client.get(`cache:${key}`);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSec = DEFAULT_CATALOGUE_TTL): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;
    try {
      await client.set(`cache:${key}`, JSON.stringify(value), 'EX', ttlSec);
    } catch {
      /* cache miss on failure */
    }
  }

  async del(...keys: string[]): Promise<void> {
    const client = this.redis.getClient();
    if (!client || !keys.length) return;
    try {
      await client.del(...keys.map((k) => `cache:${k}`));
    } catch {
      /* ignore */
    }
  }

  async wrap<T>(key: string, ttlSec: number, factory: () => Promise<T>): Promise<T> {
    const hit = await this.get<T>(key);
    if (hit !== null) return hit;
    const value = await factory();
    await this.set(key, value, ttlSec);
    return value;
  }
}
