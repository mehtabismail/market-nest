# Environment variables

MarketNest uses **one file at the repo root**: `.env`

For where secrets belong outside local development — CI, deployments, mobile
builds — and how to rotate them, see [SECRETS.md](SECRETS.md).

## Quick setup

```bash
npm run env:setup    # copies .env.example → .env
# Edit .env with your Supabase, Redis, etc.
npm run dev
```

`apps/api/.env` is a **symlink** to the root `.env` (created by `npm run env:link`)
so `npx prisma` works from `apps/api`. You do not need `apps/web/.env.local`.

## How apps load env

| App / tool | Mechanism |
|------------|-----------|
| **Turbo** (`npm run dev`) | Loads root `.env`; `globalDependencies` in `turbo.json` |
| **API** (NestJS) | `ConfigModule` reads root `.env` via `apps/api/src/config/root-env.ts` |
| **Web** (Next.js) | `apps/web/next.config.mjs` loads root `.env` at startup |
| **Prisma** | `scripts/env/run-prisma.cjs` loads root `.env` before the CLI |
| **Mobile** (Expo) | Does **not** read this file — it reads `apps/mobile/app.json` and derives the dev API host from the Expo dev server |

## Variable reference

See [.env.example](../.env.example) for the full list with `[api]` / `[web]` tags.

### Required for local dev

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → `service_role` secret |
| `DATABASE_URL` | Supabase → Database → pooler URI, Session mode port **5432** (+ `connection_limit=5`) |
| `DIRECT_URL` | Same pooler host, Session mode port **5432** (not `db.<ref>.supabase.co`) |
| `REDIS_URL` | Local install — `redis://127.0.0.1:6379` |

#### A note on `REDIS_URL`

Development uses a **local** Redis, not a hosted one:

```bash
brew install redis && brew services start redis   # macOS
redis-cli ping                                    # → PONG
```

Everything MarketNest keeps in Redis is ephemeral — cart contents, rate-limit
counters, the 60s catalogue cache, BullMQ queues — and Postgres is the source of
truth, so losing it costs nothing. A hosted free tier can be deleted for inactivity
and take the whole API down with it, which is exactly what happened to the previous
Upstash instance.

Production uses **managed Redis over TLS** (`rediss://`). `redis.service.ts`
attaches TLS only for the `rediss://` scheme, so both work with no code change.

### Optional (features degrade gracefully)

- `STRIPE_*` — online card payments. Without these, Cash on Delivery still works
  end to end.
- `SENDGRID_*`, `TWILIO_*` — email and SMS notifications
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` — semantic search and the buyer assistant
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google sign-in
- `JWT_SECRET` — reserved; auth uses Supabase JWTs today
- `RATE_LIMIT_ENABLED` — set `false` to disable rate limiting locally
- `CORS_ORIGIN` — comma-separated allowed origins. **Must be set in production**;
  it falls back to localhost origins otherwise.

## Legacy per-app files

If you still have `apps/api/.env` or `apps/web/.env.local`, delete them and use the
root `.env` only. The per-app `.env.example` files just document which keys each app
consumes.
