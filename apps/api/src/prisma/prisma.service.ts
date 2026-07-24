import { Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Append Prisma-friendly pool params without clobbering an already-tuned URL.
 *
 * Nest is a long-lived process — prefer Supabase *Session* pooler (:5432).
 * Transaction pooler (:6543 + pgbouncer=true) is for serverless and is much
 * slower / flakier for a persistent PrismaClient. Timeouts turn hangs into retries.
 */
export function hardenDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    // Only force pgbouncer when the URL is clearly transaction-mode.
    if (url.port === '6543' && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true');
    }
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', isDev ? '5' : '10');
    }
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '15');
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '20');
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function isTransientDbError(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) && !(err instanceof Error)) {
    return false;
  }
  const code = err instanceof Prisma.PrismaClientKnownRequestError ? err.code : '';
  const message = err.message ?? '';
  return (
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1017' ||
    /Can't reach database server/i.test(message) ||
    /Server has closed the connection/i.test(message) ||
    /Connection reset/i.test(message) ||
    /Timed out fetching a new connection/i.test(message)
  );
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const logConfig: Prisma.LogLevel[] = isDev ? ['query', 'error', 'warn'] : ['error'];

    super({
      log: logConfig.map((level) => ({
        emit: 'event' as const,
        level,
      })),
      datasources: {
        db: {
          url: hardenDatabaseUrl(process.env.DATABASE_URL),
        },
      },
    });

    if (isDev) {
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        if (e.duration > 100) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query.slice(0, 200)}`);
        }
      });
    }
  }

  async onModuleInit() {
    // One reconnect attempt on boot — Supabase pooler often flaps on first connect.
    await this.connectWithRetry(2);
    this.logger.log('Database connection established');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  private async connectWithRetry(attempts: number) {
    let lastError: unknown;
    for (let i = 1; i <= attempts; i++) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        lastError = err;
        this.logger.warn(`Database connect attempt ${i}/${attempts} failed`);
        if (i < attempts) {
          await new Promise((r) => setTimeout(r, 400 * i));
        }
      }
    }
    throw lastError;
  }

  /**
   * Run a Prisma operation with one retry on transient pooler blips (P1001 etc.).
   * Prefer this for auth/bootstrap paths that otherwise surface as opaque 500s.
   */
  async withRetry<T>(operation: () => Promise<T>, label = 'query'): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      if (!isTransientDbError(err)) throw err;
      this.logger.warn(`Transient DB error on ${label}; retrying once`);
      try {
        await this.$connect();
      } catch {
        /* reconnect best-effort — the retry below still runs */
      }
      try {
        return await operation();
      } catch (retryErr) {
        if (isTransientDbError(retryErr)) {
          throw new ServiceUnavailableException(
            'Database temporarily unreachable. Please try again in a moment.',
          );
        }
        throw retryErr;
      }
    }
  }
}
