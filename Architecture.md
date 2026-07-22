# MarketNest — Architecture

> One of six context files. Read order: **[PRD](PRD.md) → [Architecture](Architecture.md) → [Rules](Rules.md) → [Phases](Phases.md) → [Design](Design.md) → [Memory](Memory.md)**.

_Last updated: 2026-07-22._ Deeper background: [`docs/ARCHITECTURE_PRINCIPLES.md`](docs/ARCHITECTURE_PRINCIPLES.md), [`README.md`](README.md).

---

## 1. Tech stack (do not substitute without explicit approval)

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + **npm workspaces** (not pnpm/yarn) |
| Web | Next.js 14 App Router, React 19, Tailwind, shadcn/ui |
| Mobile | Expo SDK **57**, expo-router, React Native 0.86, Reanimated 4 |
| API | NestJS 10 — a single gateway, REST at `/api/v1`, Swagger at `/api/docs` |
| ORM | Prisma 6 |
| Database | Supabase PostgreSQL + RLS + Auth + Storage + pgvector |
| Cache / queue | Redis (local in dev, managed in prod) + BullMQ |
| Payments | Stripe (card) + Cash on Delivery |
| AI | OpenAI embeddings for semantic search (pgvector), assistant chat |

> Redis: local Docker in dev, managed instance in prod. The old Upstash instance was dropped — see the `redis-local-for-dev` memory. Do not reintroduce Upstash.

## 2. Repo layout

```
apps/
  api/          NestJS gateway — the ONLY backend
    src/<domain>/   one module per domain: auth, products, orders, cart,
                    categories, brands, coupons, wishlist, kyc, reviews,
                    payouts, payments, notifications, admin, search, …
    prisma/schema.prisma
  web/          Next.js — three portals via route groups
    src/app/(buyer)/  (seller)/  (admin)/
  mobile/       Expo app (buyer + seller onboarding)
    app/          expo-router file routes: (tabs)/, product/[id], checkout,
                  orders/, kyc, seller, wishlist, notifications, sign-in/up
    src/          components, contexts, hooks, lib, theme
packages/
  shared-types/ DTOs shared across apps. Buyer barrel EXCLUDES seller types.
  tokens/       design tokens — web (coral) + mobile (green) scales
  api-client/   typed fetch client used by web + mobile
  utils/
supabase/
  migrations/   timestamped SQL, each with its RLS policies
  seed.sql      boot-minimum (system seller, base categories)
  seed_demo.sql demo catalogue (8 products/brands/categories) — NOT for prod
docs/           extended reference (principles, phases history, env, secrets)
```

## 3. Request lifecycle (buyer product read — the anonymity-critical path)

```
Client → GET /api/v1/products/:id
      → ProductsController (thin)
      → ProductsService.getForBuyer()
          → Prisma select: buildBuyerDetailSelect()  ← NEVER selects seller relation
          → toBuyerProductDTO()                       ← the anonymity boundary
      → BuyerProductDTO (no seller_id / store name / slug)
```

The select and the mapper are the two places seller identity could leak. Both are deliberately narrow. Do not widen them to include the seller relation on any buyer/guest route.

## 4. Key patterns

- **Thin controllers, logic in services.** One NestJS module per domain.
- **DTO + validation on every input** (`class-validator`), typed responses, no `any`.
- **RLS is the primary isolation**; API `@Roles()` guards are the secondary layer. Every table with user data has an RLS policy. The service role (used by the API) bypasses RLS for privileged writes (e.g. KYC approval), so those transitions live in the API, never the client.
- **Async anything >200ms** (email, embeddings, analytics export) via BullMQ, not in the request.
- **Cart/session/rate-limits in Redis only.** The API is stateless. Guest cart has a 7-day TTL and merges into the user cart at sign-in.
- **Caching**: catalogue reads cached ~60s; web uses ISR for product/category/home.
- **Shared types**: put cross-app types in `packages/shared-types`. The buyer barrel must not export seller DTOs, and the buyer app must not import seller types.
- **Money**: stored as Prisma `Decimal`; convert with `Number()` at the DTO boundary. Amounts that a later edit must not retroactively change (order discount) are snapshotted onto the order, not referenced.

## 5. Data model (core tables)

`Profile` (auth user + role) · `Seller` (+ `SellerKyc`) · `Category` · `Brand` · `Product` (+ `ProductVariant`) · `Cart`/`CartItem` · `Order`/`OrderItem` · `Payment` · `Payout` · `Review` · `WishlistItem` · `Coupon` · `Notification` · `Banner` · `FeaturedListing` · `AuditLog`.

Mobile-specific presentation columns: `Product.hue` / `Category.hue` + `emoji` (drive generated artwork — the mobile app ships **no photography**, see [Design](Design.md)); `Product.dealStartsAt/dealEndsAt` (flash deals); `Order.discount/couponCode/estimatedFrom/estimatedTo`; `Seller.ratingAvg/salesCount/isVerified`.

## 6. Environments

- API runs on **:3001**. Web on :3000. Mobile derives the API host from the Expo dev server.
- The database is a **hosted Supabase project** (see `.env` `DATABASE_URL`/`DIRECT_URL`). Migrations run against it are hard to reverse — treat every migration/seed as a production-adjacent action.
- Secrets live in `.env` only (git-ignored). Update `.env.example` when adding vars. See [`docs/SECRETS.md`](docs/SECRETS.md).
