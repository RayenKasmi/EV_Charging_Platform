import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly defaultTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') ?? 'localhost';
    const port = Number(this.configService.get<string>('REDIS_PORT') ?? 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD') ?? undefined;
    const ttl = Number(
      this.configService.get<string>('STATION_SEARCH_CACHE_TTL_SECONDS') ?? 60,
    );

    this.defaultTtlSeconds = Number.isFinite(ttl) ? ttl : 60;
    this.client = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnected();
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      await this.ensureConnected();
      const ttl = ttlSeconds ?? this.defaultTtlSeconds;
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch {
      return;
    }
  }

  // delete all keys with given prefix. this is used for cache invalidation(when data changes)
  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      await this.ensureConnected();
      let cursor = '0';

      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          100,  // batch size
        );

        if (keys.length > 0) {
          await this.client.del(...keys);
        }

        cursor = nextCursor;
      } while (cursor !== '0');
    } catch {
      return;
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      return;
    }
  }

  private async ensureConnected() {
    if (this.client.status === 'ready' || this.client.status === 'connecting') {
      return;
    }

    await this.client.connect();
  }
}
