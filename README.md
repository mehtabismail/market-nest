# MarketNest

Multi-vendor e-commerce platform (Buyer ? Seller ? Super Admin).

**Docs:** `MarketNest_Architecture_v2.pdf`, `MarketNest_UserStories_v2.pdf`, `docs/ARCHITECTURE_PRINCIPLES.md`

**AI rules:** `.cursor/rules/marketnest.mdc` (always applied in Cursor)

## Phase 2 ? Core commerce

- API: products, cart, checkout, payments, admin sellers
- Run migration: `supabase/migrations/20260604000000_seller_invite_email.sql`
- Requires `REDIS_URL` for cart

## Phase 3 - Admin, notifications, reviews, payouts

- API: audit, notifications (BullMQ), reviews, payouts, analytics, banners/featured
- Web: reviews on PDP, `/seller/earnings`, `/admin/analytics`, `/admin/audit`, featured on shop home
- Run migration: `supabase/migrations/20260605000000_phase3_banners_payouts.sql`
- Then: `cd apps/api && npx prisma db push`

## Phase 7 — Feature complete (current)

- **Image upload:** Supabase Storage `POST /upload/image`, wired into seller/admin product, banner, category forms
- **Product variants:** seller CRUD, buyer PDP selector, cart `variantId`
- **Buyer UX:** Google OAuth flow, checkout success page, order status polling
- **Admin:** users, revenue, featured listings, async analytics export
- **Seller:** live dashboard stats (replaces stub)
- Migrations: through `20260609000001_rls_remaining.sql` (storage bucket + remaining RLS)

## Phase 6 — Portal completion

- **Buyer:** orders list, order cancel, banner carousel, account + saved addresses, Stripe Elements checkout
- **Seller:** order detail, inventory (low stock), analytics dashboard
- **Admin:** orders, fulfilment, products, categories, banners, payouts, seller actions (suspend/reactivate/resend/delete)
- **API:** suspended seller enforcement, buyer cancel, admin product PATCH, buyer preview, semantic fallback, resend invite
- Migrations: `20260607000000_rls_banners.sql`, `20260608000000_profile_addresses.sql`

## Phase 1 — Foundation

- Turborepo monorepo (npm)
- Supabase schema + RLS (`supabase/migrations/`)
- NestJS API: auth, RBAC, health, admin dashboard
- Next.js 14 portal shells + design tokens
- `BuyerProductDTO` + mapper (seller anonymity ready)

## Quick start

```bash
# 1. Install
npm install

# 2. Environment (one file at repo root)
npm run env:setup
# Edit .env ? see docs/ENV.md

# 3. Database (choose one)
# Option A: Run SQL in Supabase SQL Editor
#   - supabase/migrations/20260603000000_initial_schema.sql
#   - supabase/migrations/20260604000000_seller_invite_email.sql
#   - supabase/migrations/20260605000000_phase3_banners_payouts.sql
#   - supabase/migrations/20260606000000_phase4_vector_index.sql
#   - supabase/migrations/20260607000000_rls_banners.sql
#   - supabase/migrations/20260608000000_profile_addresses.sql
#   - supabase/migrations/20260609000000_storage_bucket.sql
#   - supabase/migrations/20260609000001_rls_remaining.sql
#   - supabase/seed.sql
# Option B: Prisma
cd apps/api && npx prisma db push && npm run db:seed

# 4. Create super admin in Supabase Auth, then insert profile:
# INSERT INTO profiles (id, role, full_name) VALUES ('<auth-user-uuid>', 'superadmin', 'Admin');

# 5. Run
npm run dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |

## Project structure

```
apps/web          Next.js ? /shop, /seller, /admin
apps/api          NestJS gateway
packages/         shared-types, ui, utils
supabase/         migrations + seed
```

## Phase 4 ? AI search & assistant

- pgvector semantic search (`GET /search/products`, `GET /products?search=&semantic=true`)
- BullMQ embedding jobs on product publish/update (`OPENAI_API_KEY` + `REDIS_URL`)
- Buyer AI assistant (`POST /assistant/chat`, floating widget on `/shop`)
- Admin reindex: `POST /admin/search/reindex`
- Migration: `supabase/migrations/20260606000000_phase4_vector_index.sql`

## Phase 5 ? Performance hardening & beta prep

- Redis rate limits: 100/min general, 10/min auth, 5/min checkout, 30/min assistant
- Catalogue cache (60s): categories, banners, featured
- Health endpoint reports cache/rate-limit/embeddings status
- Beta checklist: [docs/BETA_CHECKLIST.md](docs/BETA_CHECKLIST.md)
- Benchmark: `npm run bench:health`
