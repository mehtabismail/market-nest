# Delivery history

What shipped in each phase. Moved out of the README so that file can stay focused
on getting a new developer running. Newest first.

---

## Phase 7 — Feature complete (current)

- **Image upload:** Supabase Storage `POST /upload/image`, wired into seller/admin
  product, banner and category forms
- **Product variants:** seller CRUD, buyer PDP selector, cart `variantId`
- **Buyer UX:** Google OAuth flow, checkout success page, order status polling
- **Admin:** users, revenue, featured listings, async analytics export
- **Seller:** live dashboard stats (replaces the stub)
- Migrations: through `20260609000001_rls_remaining.sql` (storage bucket +
  remaining RLS)

## Phase 6 — Portal completion

- **Buyer:** orders list, order cancel, banner carousel, account + saved addresses,
  Stripe Elements checkout
- **Seller:** order detail, inventory (low stock), analytics dashboard
- **Admin:** orders, fulfilment, products, categories, banners, payouts, seller
  actions (suspend / reactivate / resend invite / delete)
- **API:** suspended seller enforcement, buyer cancel, admin product PATCH, buyer
  preview, semantic fallback, resend invite
- Migrations: `20260607000000_rls_banners.sql`,
  `20260608000000_profile_addresses.sql`

## Phase 5 — Performance hardening and beta prep

- Redis rate limits: 100/min general, 10/min auth, 5/min checkout, 30/min assistant
- Catalogue cache (60s): categories, banners, featured
- Health endpoint reports cache, rate-limit and embedding status
- Beta checklist: [BETA_CHECKLIST.md](BETA_CHECKLIST.md)
- Benchmark: `npm run bench:health`

## Phase 4 — AI search and assistant

- pgvector semantic search (`GET /search/products`,
  `GET /products?search=&semantic=true`)
- BullMQ embedding jobs on product publish and update (needs `OPENAI_API_KEY` and
  `REDIS_URL`)
- Buyer AI assistant (`POST /assistant/chat`, floating widget on `/shop`)
- Admin reindex: `POST /admin/search/reindex`
- Migration: `20260606000000_phase4_vector_index.sql`

## Phase 3 — Admin, notifications, reviews, payouts

- **API:** audit log, notifications (BullMQ), reviews, payouts, analytics, banners
  and featured listings
- **Web:** reviews on the product page, `/seller/earnings`, `/admin/analytics`,
  `/admin/audit`, featured products on the shop home
- Migration: `20260605000000_phase3_banners_payouts.sql`

## Phase 2 — Core commerce

- API: products, cart, checkout, payments, admin seller management
- Migration: `20260604000000_seller_invite_email.sql`
- Requires `REDIS_URL` for the cart

## Phase 1 — Foundation

- Turborepo monorepo on npm workspaces
- Supabase schema and RLS (`supabase/migrations/`)
- NestJS API: auth, RBAC, health, admin dashboard
- Next.js 14 portal shells and design tokens
- `BuyerProductDTO` and mapper (seller anonymity)

---

## Post-Phase 7 — Hardening, mobile, seller lifecycle

Tracked in git history and [MOBILE_IMPLEMENTATION_LOG.md](../MOBILE_IMPLEMENTATION_LOG.md).
Open items: [MOBILE_REMAINING_FEATURES.md](../MOBILE_REMAINING_FEATURES.md).

- Test harness (Jest) and CI quality gates — lint, typecheck and test now block
  merge
- Auth: access + refresh tokens (`POST /auth/refresh`, `/auth/logout`); shared
  `@marketnest/api-client` refresh-on-401; buyer web logout
- Order correctness: atomic stock claims, idempotent payment confirmation,
  cancellation claimed before restock; buyer order status rollup from seller items
- Cart / catalogue: guest-merge auth fix; sellers excluded from browsing own
  listings; cart/wishlist reject own products
- Shared packages: `@marketnest/api-client`, `@marketnest/tokens`, `@marketnest/utils`
- Expo app (`apps/mobile`): buyer + seller surfaces, green design system
- Seller lifecycle: self-serve onboarding + KYC (mobile + `/seller` web), listing
  gate on `isVerified`, invite auto-verify on KYC submit, admin KYC notifications
- In-app notification deep links across mobile / admin / seller web
- DB: Nest uses Supabase Session pooler (`:5432`); avoid `db.*.supabase.co` for
  Prisma from local/dev networks

Deferred (dependency approval): mobile Stripe native, Google/Apple on mobile,
device push.
