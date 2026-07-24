# MarketNest

Multi-vendor e-commerce platform. Three web portals (buyer, seller, super admin), a
NestJS API, and an Expo mobile app — all in one Turborepo monorepo.

> **New here? Read [First-time setup](#first-time-setup) top to bottom.** It takes
> about 20 minutes, most of which is waiting on installs and creating a Supabase
> project.

---

## Contents

- [What's in the repo](#whats-in-the-repo)
- [Prerequisites](#prerequisites)
- [First-time setup](#first-time-setup)
- [Running the apps](#running-the-apps)
- [Everyday commands](#everyday-commands)
- [Environment and secrets](#environment-and-secrets)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Conventions](#conventions)

---

## What's in the repo

| Workspace | Stack | What it is |
|---|---|---|
| `apps/api` | NestJS 10, Prisma 6, Postgres | The only backend. REST at `/api/v1`, Swagger at `/api/docs` |
| `apps/web` | Next.js 14 App Router, Tailwind | **All three web portals** — see the note below |
| `apps/mobile` | Expo SDK 57, Expo Router | Buyer app for iOS and Android |
| `packages/shared-types` | TypeScript | DTOs shared by API, web and mobile |
| `packages/api-client` | TypeScript | Platform-agnostic API client (fetch, errors, cart session) |
| `packages/tokens` | TypeScript | Design tokens — colours, spacing, type, motion |
| `packages/utils` | TypeScript | Shared helpers |
| `supabase/` | SQL | Migrations and seed data |

> ### The three portals are one Next.js app
>
> This trips up everyone on day one. Buyer, seller and admin are **not** separate
> applications — they are route groups inside `apps/web`:
>
> ```
> apps/web/src/app/(buyer)/shop/…     → localhost:3000/shop
> apps/web/src/app/(seller)/seller/…  → localhost:3000/seller
> apps/web/src/app/(admin)/admin/…    → localhost:3000/admin
> ```
>
> One `npm run dev`, one port, one build. There is no separate seller server.

**Supporting services:** Supabase (auth, Postgres, file storage), Redis (cart, rate
limiting, catalogue cache, BullMQ jobs), Stripe (card payments — Cash on Delivery
works without it).

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | **>= 20** | Enforced by `engines` |
| npm | **>= 10** | Pinned to `npm@10.9.0`. Workspaces are npm — not pnpm or yarn |
| Redis | any recent | Local install, see below |
| Supabase account | — | Free tier is fine |

**Mobile development only:**

| Tool | Notes |
|---|---|
| Xcode | iOS builds and simulators (macOS only) |
| Android Studio | Android builds and emulators |
| CocoaPods | Comes with the Xcode toolchain; needs a UTF-8 locale |
| Expo Go | On a physical device, for the quickest start |

### Install Redis locally

```bash
# macOS
brew install redis && brew services start redis

# Linux
sudo apt install redis-server && sudo systemctl start redis

# Verify
redis-cli ping   # → PONG
```

Development uses a **local** Redis (`redis://127.0.0.1:6379`), not a hosted one.
Everything stored there is ephemeral — cart contents, rate-limit counters, the 60s
catalogue cache, job queues — and Postgres is the source of truth. A free-tier
hosted instance can be deleted for inactivity and take the whole API down with it;
a local one cannot. Production uses managed Redis over TLS (`rediss://`).

---

## First-time setup

### 1. Install dependencies

```bash
git clone https://github.com/mehtabismail/market-nest.git
cd market-nest
npm install
```

Installs every workspace. Expect a few minutes — the mobile app pulls React Native.

### 2. Create your environment file

```bash
npm run env:setup
```

Copies `.env.example` to `.env` at the repo root, and symlinks `apps/api/.env` to it
so Prisma works from inside `apps/api`.

**There is one `.env`, at the repo root** — not one per app. See
[docs/ENV.md](docs/ENV.md) for how each tool loads it.

### 3. Create a Supabase project and fill in `.env`

At <https://supabase.com/dashboard>, create a project, then fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` — **secret, server only** |
| `DATABASE_URL` | Settings → Database → connection pooling, port **6543** |
| `DIRECT_URL` | Settings → Database → direct connection, port **5432** |
| `REDIS_URL` | `redis://127.0.0.1:6379` for local dev |

Everything else is optional and degrades gracefully — Stripe, SendGrid, Twilio,
OpenAI. Without Stripe keys, Cash on Delivery still works end to end.

> **`SUPABASE_SERVICE_ROLE_KEY` bypasses all row-level security.** It belongs only
> in the API's environment. Never expose it to a browser or mobile bundle, and
> never prefix it with `NEXT_PUBLIC_`.

### 4. Set up the database

```bash
cd apps/api
npx prisma db push     # applies the schema
npm run db:seed        # seeds categories and a superadmin
cd ../..
```

Alternatively, run the SQL files in `supabase/migrations/` in filename order via the
Supabase SQL Editor, then `supabase/seed.sql`. Use this route if you need the
row-level security policies exactly as written — `prisma db push` creates tables but
not RLS.

### 5. Create your admin login

Seeding uses `SEED_SUPERADMIN_EMAIL` and `SEED_SUPERADMIN_PASSWORD` from `.env`. If
you skipped those, create a user in Supabase → Authentication → Users, then:

```sql
INSERT INTO profiles (id, role, full_name)
VALUES ('<the-auth-user-uuid>', 'superadmin', 'Your Name');
```

### 6. Start everything

```bash
npm run dev
```

Turbo starts the API and web together. Verify:

```bash
curl http://localhost:3001/api/v1/health
```

---

## Running the apps

### Everything at once

```bash
npm run dev      # API + web, via Turbo
```

### Individually

```bash
npm run dev -w @marketnest/api      # API only, port 3001
npm run dev -w @marketnest/web      # web only, port 3000
```

### Where each portal lives

| Portal | URL | Sign in as |
|---|---|---|
| **Buyer / shop** | <http://localhost:3000/shop> | a `buyer` account — self-register at `/shop/signup` |
| **Seller** | <http://localhost:3000/seller> | a `seller` account — self-serve at `/seller/signup` **or** admin invite |
| **Super admin** | <http://localhost:3000/admin> | your `superadmin` account |
| **API** | <http://localhost:3001/api/v1> | — |
| **Swagger** | <http://localhost:3001/api/docs> | — |

Roles are enforced by the API, not just the UI. A buyer calling an admin endpoint
directly gets a 403 regardless of what the frontend shows.

**Sellers:** self-serve signup + KYC (`/seller/signup`) or admin invite → set
password → KYC. Listing products requires `isVerified`. Invitees who complete KYC
are auto-approved; self-serve KYC waits in `/admin/kyc`. Mobile uses the same
rules via Seller Central / Plus tab.

### Mobile app

The mobile app talks to the **same API**, so start that first. Status of what is
live vs still open: [MOBILE_IMPLEMENTATION_LOG.md](MOBILE_IMPLEMENTATION_LOG.md)
and [MOBILE_REMAINING_FEATURES.md](MOBILE_REMAINING_FEATURES.md).

```bash
# Terminal 1 — API
npm run dev -w @marketnest/api

# Terminal 2 — Expo
npm run start -w @marketnest/mobile
```

Then scan the QR code with **Expo Go**, or press `i` / `a` for a simulator.

The dev API host is derived from the Expo dev server's address, so a physical phone
reaches your machine automatically — no hardcoded LAN IP needed.

#### Native development build

Needed once you add native modules Expo Go does not bundle (Stripe, for example):

```bash
cd apps/mobile
npx expo prebuild --platform ios     # generates ios/ — a gitignored build artifact
npx expo run:ios                     # build, install, launch, and start Metro
```

To drive it from Xcode instead:

```bash
cd apps/mobile
npx expo start --dev-client          # terminal 1 — the --dev-client flag matters
xed ios                              # terminal 2 — opens the .xcworkspace
```

Pick a simulator in Xcode and press ⌘R. The first build takes 5–15 minutes.

> **`apps/mobile/ios/` and `android/` are build artifacts, not source.** They are
> gitignored and regenerated by `expo prebuild`. Native changes made by hand in
> Xcode are destroyed on the next prebuild — put them in Expo config plugins in
> `app.json` instead.

---

## Everyday commands

Run from the repo root unless noted.

### Development

```bash
npm run dev                      # API + web
npm run build                    # build all workspaces
npm run format                   # Prettier across the repo
```

### Quality gates

These are exactly what CI runs. Run them before pushing.

```bash
npm run lint                     # ESLint, all workspaces
npm run typecheck                # tsc --noEmit, all workspaces
npm run test                     # Jest (API)
```

Single workspace:

```bash
npm run test -w @marketnest/api
npm run typecheck -w @marketnest/mobile
```

### Database

```bash
npm run db:generate              # regenerate the Prisma client after schema edits
npm run db:migrate               # apply migrations (deploy)
npm run db:push                  # push schema without a migration (dev only)

cd apps/api && npm run db:studio # browse data in Prisma Studio
cd apps/api && npm run db:seed   # reseed
```

### Diagnostics

```bash
npm run bench:health              # benchmark the health endpoint
curl localhost:3001/api/v1/health # cache, rate-limit and embedding status
```

---

## Environment and secrets

**`.env` is gitignored and must never be committed.** So are `.env.bak.*` backups.

Local development uses the root `.env`. Everywhere else — CI, deployments, mobile
builds — secrets are injected by the platform. **See
[docs/SECRETS.md](docs/SECRETS.md)** for where each secret belongs, how to set it,
and what to do when one leaks.

Full variable reference: [docs/ENV.md](docs/ENV.md) and
[.env.example](.env.example).

---

## Project structure

```
apps/
  api/                     NestJS — the only backend
    src/
      auth/                Supabase token verification, guards, RBAC
      products/ orders/    domain modules, one folder each
      cart/ payments/
      common/              decorators, guards, middleware
    prisma/schema.prisma   database schema
  web/                     Next.js — all three portals
    src/app/(buyer)/       /shop
    src/app/(seller)/      /seller
    src/app/(admin)/       /admin
    src/lib/api.ts         web binding of @marketnest/api-client
  mobile/                  Expo — buyer app
    app/                   file-based routes (Expo Router)
    src/                   components, contexts, hooks, theme
packages/
  shared-types/            DTOs shared across all three apps
  api-client/              fetch client, error mapping, cart session
  tokens/                  design tokens
  utils/                   shared helpers
supabase/migrations/       SQL migrations, applied in filename order
docs/                      setup and architecture docs
scripts/env/               env bootstrapping helpers
```

### Where to make a change

| Task | Start here |
|---|---|
| New API endpoint | `apps/api/src/<domain>/` — controller, service, module, dto |
| Change a shared shape | `packages/shared-types/` — typecheck then shows every consumer |
| Buyer web page | `apps/web/src/app/(buyer)/shop/` |
| Admin screen | `apps/web/src/app/(admin)/admin/` |
| Mobile screen | `apps/mobile/app/` |
| Colour or spacing | `packages/tokens/src/index.ts` — never hardcode a hex |
| Database schema | `apps/api/prisma/schema.prisma`, then `npm run db:generate` |

---

## Troubleshooting

**`Cart storage unavailable — configure REDIS_URL`**
Redis is not running. `brew services start redis`, then `redis-cli ping`.

**API will not start, database connection errors**
Check `DATABASE_URL` uses the pooler port **6543** and `DIRECT_URL` uses **5432**.
Swapping them causes connection-pool exhaustion under load.

**`Supabase URL and SUPABASE_SERVICE_ROLE_KEY must be set`**
`.env` is missing or incomplete. Run `npm run env:setup` and fill it in.

**Prisma cannot find the schema, or a client type is missing**
Run from `apps/api`, or use the root scripts, which load the env first. After any
schema edit run `npm run db:generate`.

**Mobile: "Network request failed"**
The API is not running, or is unreachable from the device. Confirm
`curl localhost:3001/api/v1/health` works and that phone and computer share a
network. `localhost` on a phone means the phone itself.

**Mobile: Xcode build fails with missing modules**
You opened `MarketNest.xcodeproj`. Open `MarketNest.xcworkspace` instead — or run
`xed ios`, which picks the right one. If the native folder is in a bad state:
`npx expo prebuild --clean -p ios`.

**Web build fails after changing a shared package**
Shared packages compile to `dist/`. Rebuild them:
`npm run build -w @marketnest/shared-types` (and `tokens`, `api-client`).

---

## Conventions

- **TypeScript everywhere.** `strict` is on. Avoid `any` — the codebase has about one.
- **Never hardcode design values.** Import from `@marketnest/tokens`.
- **Never share React components between web and mobile.** They run different React
  major versions on purpose. Share types, the API client and tokens instead.
- **Enforce authorisation on the API.** Hiding a UI element is not access control —
  every route carries `@UseGuards` and `@Roles`.
- **Buyer responses must never leak seller identity.** Use `BuyerProductDTO` and its
  mapper; seller anonymity is a product requirement.
- **The API is versioned at `/api/v1`.** Mobile users run old builds for months and
  cannot be force-updated, so changes must be additive. Never remove or repurpose a
  field without a version bump.
- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat(mobile):`, `fix(auth):`, `chore(api):`.
- **CI must be green before merge** — lint, typecheck, test and build across every
  workspace.

## Further reading

| Doc | Contents |
|---|---|
| [docs/SECRETS.md](docs/SECRETS.md) | Where secrets live and how to rotate them |
| [docs/ENV.md](docs/ENV.md) | Every environment variable |
| [docs/ARCHITECTURE_PRINCIPLES.md](docs/ARCHITECTURE_PRINCIPLES.md) | Design decisions |
| [docs/SETUP_SUPABASE.md](docs/SETUP_SUPABASE.md) | Supabase project setup |
| [docs/PHASES.md](docs/PHASES.md) | Delivery history by phase |
| [docs/BETA_CHECKLIST.md](docs/BETA_CHECKLIST.md) | Pre-launch checklist |
