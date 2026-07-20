# MarketNest ? Agent guide

Multi-vendor marketplace: **Buyer** (`marketnest.com`), **Seller** (`sell.`), **Admin** (`admin.`).

## Documents

| File | Purpose |
|------|---------|
| `MarketNest_Architecture_v2.pdf` | Stack, schema, phases, folder structure |
| `MarketNest_UserStories_v2.pdf` | Features + acceptance criteria |
| `MarketNest_UI_Designs.html` | Visual design reference |
| `docs/ARCHITECTURE_PRINCIPLES.md` | Extended principles |

## Repo layout

```
apps/web     ? Next.js 14 (buyer)/(seller)/(admin) route groups
apps/api     ? NestJS gateway
packages/*   ? shared-types, ui, utils
supabase/    ? SQL migrations + seed
```

## Phase 2 status ? core commerce

- Products, categories, Redis cart, orders, Stripe/COD, seller invite
- Web: `/shop`, cart, checkout, seller portal, admin sellers

## Phase 7 status — feature complete

- Image upload (Supabase Storage), product variants, Google OAuth, checkout success, order polling
- Admin: `/admin/users`, `/admin/revenue`, `/admin/featured`, async analytics export
- Seller dashboard live stats; remaining RLS + storage bucket migrations
- Migrations: `20260609000000_storage_bucket.sql`, `20260609000001_rls_remaining.sql`

## Phase 6 status — portal completion

- Buyer: `/shop/orders`, `/shop/account`, banner carousel, Stripe checkout, order cancel
- Seller: `/seller/orders/[id]`, `/seller/inventory`, `/seller/analytics`
- Admin: orders, fulfilment, products, categories, banners, payouts, seller CRUD actions
- API: suspend enforcement, buyer cancel, admin product PATCH/preview, resend invite, semantic fallback
- Migrations: `20260607000000_rls_banners.sql`, `20260608000000_profile_addresses.sql`

## Phase 5 status - performance hardening & beta prep

- Redis rate limits (global guard), catalogue cache 60s, beta checklist, health bench script

## Phase 4 status - AI search & assistant

- pgvector semantic search, OpenAI embeddings queue, buyer assistant chat
- Web: semantic search toggle, AI Shop widget on buyer layout
- Requires `OPENAI_API_KEY`; embeddings queue needs `REDIS_URL`

## Phase 3 status - admin, notifications, reviews, payouts

- API: audit logs, BullMQ email queue, reviews, seller earnings/payouts, analytics CSV, banners/featured
- Web: product reviews, seller earnings, admin analytics + audit log, shop featured section
- Migration: `supabase/migrations/20260605000000_phase3_banners_payouts.sql`

## Phase 1 status ? complete (scaffold)

- [x] Turborepo + npm workspaces
- [x] Supabase migration + seed (MarketNest Official)
- [x] Prisma schema aligned with SQL
- [x] NestJS: auth, JWT/RBAC guards, health, admin dashboard API
- [x] `BuyerProductDTO` mapper (anonymity-ready)
- [x] Next.js portal shells: `/shop`, `/seller`, `/admin`
- [x] Design tokens (Tailwind + `@marketnest/ui`)
- [x] CI workflow
- [x] Cursor rule `.cursor/rules/marketnest.mdc` (always apply)

Setup: `docs/SETUP_SUPABASE.md`

## Commands

```bash
npm install
npm run dev          # web + api via turbo
npm run build
npm run lint
cd apps/api && npx prisma migrate deploy
```

## Env

Copy `.env.example` ? `.env` (root and per-app as noted). User provides Supabase, Redis, Stripe keys.
