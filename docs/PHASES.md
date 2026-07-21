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

## Post-Phase 7 — Hardening and mobile

Tracked in git history rather than as a numbered phase.

- Test harness (Jest) and CI quality gates — lint, typecheck and test now block
  merge
- Auth fixes: `JwtAuthGuard` bypass on `POST /cart/merge`, buyer-only order routes,
  role-scoped shop surfaces, typed API errors so raw 4xx no longer reach users
- Order correctness: atomic stock claims (oversell race), idempotent payment
  confirmation, cancellation claimed before restock
- Cart fix: the web client omitted the auth token on cart requests, so items landed
  in the guest cart while checkout read the user cart
- Shared packages extracted: `@marketnest/api-client`, `@marketnest/tokens`
  (replacing the unused `@marketnest/ui`)
- Expo buyer app added at `apps/mobile`
