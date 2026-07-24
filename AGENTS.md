# MarketNest — Agent guide

Multi-vendor marketplace: **Buyer** (`marketnest.com`), **Seller** (`sell.`), **Admin** (`admin.`).

## ⚠️ Read these first — every session, before any task

The six context files below are the source of truth and override your defaults. **Do not vibe code.** Read them in order:

1. [PRD.md](PRD.md) — what to build, users, business rules
2. [Architecture.md](Architecture.md) — stack, structure, patterns
3. [Rules.md](Rules.md) — do / avoid / boundaries ← the contract
4. [Phases.md](Phases.md) — phasing + current status
5. [Design.md](Design.md) — web (coral) vs mobile (green) design systems
6. [Memory.md](Memory.md) — done / in-progress / deferred ← update when you finish

## Other reference

| File | Purpose |
|------|---------|
| `MarketNest.dc.html` (Claude Design project) | Mobile design source |
| `MarketNest_UI_Designs.html` | Web visual design reference |
| `MOBILE_IMPLEMENTATION_LOG.md` | What shipped for mobile + supporting API/web |
| `MOBILE_REMAINING_FEATURES.md` | What is still open (dep-gated + polish) |
| `docs/ARCHITECTURE_PRINCIPLES.md` | Extended principles |
| `README.md` | Setup + everyday commands |
| `docs/PHASES.md`, `docs/ENV.md`, `docs/SECRETS.md` | Historical phase log, env, secrets |

## Repo layout

```
apps/web     — Next.js 14 (buyer)/(seller)/(admin) route groups
apps/api     — NestJS gateway
apps/mobile  — Expo SDK 57 buyer + seller surfaces
packages/*   — shared-types, api-client, utils, tokens, ui
supabase/    — SQL migrations + seed
```

## Post–Phase 7 — Mobile + seller lifecycle (2026-07-22 → 07-24)

Feature-complete web/API (P7) plus a large mobile and seller-web pass. **Detail:** [MOBILE_IMPLEMENTATION_LOG.md](MOBILE_IMPLEMENTATION_LOG.md). **Still open:** [MOBILE_REMAINING_FEATURES.md](MOBILE_REMAINING_FEATURES.md).

Shipped highlights:

- Expo green design system; wishlist, brands, coupons, KYC, in-app notifications
- Self-serve seller onboarding + live KYC (mobile + seller web); listing gated on `isVerified`; invite path auto-verifies on KYC submit
- Buyer mobile commerce loop (filters, semantic search, COD checkout, addresses, orders cancel/reorder, rewards, reviews eligibility, assistant)
- Seller mobile: dashboard, orders, payouts, add/edit product + variants
- Access + refresh token auth across API, mobile, web; buyer web logout
- Own listings excluded from catalogue for the owning seller; order status rollup buyer↔seller
- Session pooler DB URLs for Nest (avoid `db.*.supabase.co` / transaction `:6543` for the API process)

Deferred (need dependency approval): mobile Stripe native, Google/Apple on mobile, device push.

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

## Phase 2 status — core commerce

- Products, categories, Redis cart, orders, Stripe/COD, seller invite
- Web: `/shop`, cart, checkout, seller portal, admin sellers

## Phase 1 status — complete (scaffold)

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
