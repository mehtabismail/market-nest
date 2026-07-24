# MarketNest — Product Requirements

> One of six context files. Read order: **[PRD](PRD.md) → [Architecture](Architecture.md) → [Rules](Rules.md) → [Phases](Phases.md) → [Design](Design.md) → [Memory](Memory.md)**. Do not start a task until you have read all six.

_Last updated: 2026-07-24._

---

## 1. What we are building

**MarketNest** is a multi-vendor e-commerce marketplace. Multiple independent sellers list products under one storefront, buyers shop across all of them in a single catalogue, and a super admin operates the platform.

It ships as **four surfaces from one monorepo**:

| Surface | Who it's for | Where |
|---|---|---|
| Buyer web | Shoppers | `marketnest.com` (`apps/web`, `(buyer)` route group) |
| Seller portal | Vendors | `sell.marketnest.com` (`apps/web`, `(seller)` route group) |
| Admin console | Platform operators | `admin.marketnest.com` (`apps/web`, `(admin)` route group) |
| Mobile app | Shoppers + sellers (KYC, listings, fulfilment) | iOS/Android (`apps/mobile`, Expo) |

All four talk to **one** backend: the NestJS API in `apps/api`, REST at `/api/v1`.

## 2. Target users

- **Buyer** — browses, searches, wishlists, carts, checks out (card or cash on delivery), tracks orders, reviews products. May shop as a guest; cart survives sign-in. A buyer may also become a seller (see lifecycle).
- **Seller** — completes KYC, lists products and variants, manages inventory and orders, sees analytics, receives payouts. May arrive via **admin invite** or **self-serve signup**. **Sellers are anonymous to buyers** (see §5). Sellers keep full shopping ability.
- **Super admin** — creates/suspends sellers, reviews KYC (self-serve queue), curates catalogue (categories, brands, banners, featured), manages coupons, fulfils platform-owned orders, runs payouts, reads analytics and audit logs.

## 3. Feature areas

**Catalogue & discovery** — product listing/detail, categories, brands, search (keyword + pgvector semantic), flash deals, featured/curated rails, banners. A signed-in seller does not browse their own listings as a buyer.

**Cart & checkout** — guest + authenticated cart (Redis), promo codes (coupons), shipping, card (Stripe on web; COD primary on mobile until native Stripe), cash-on-delivery, delivery estimates, order confirmation.

**Orders & fulfilment** — buyer order history + status tracking, seller order queue with status transitions (rollup to parent order), admin fulfilment for platform-owned inventory.

**Seller lifecycle** — two paths:
1. **Admin invite** → password setup → KYC → **auto-approve** on submit (because `createdBy` is set) → list products.
2. **Self-serve** (`POST /seller/onboarding` or `/seller/signup`) → KYC → **admin approval** in `/admin/kyc` → list products.
Listing always requires `isVerified`. KYC steps: personal, business, ID docs, bank, review.

**Engagement** — wishlist, product reviews (delivered orders only), in-app notifications (feed + deep links) + transactional email (queue).

**Admin operations** — sellers, users, orders, fulfilment, products, categories, brands, coupons, KYC review, banners, featured, payouts, revenue, analytics (async CSV export), audit log.

**Auth** — Supabase access + refresh tokens; clients refresh on 401; logout revokes sessions.

## 4. Explicit non-goals (do not build unasked)

- Real-time chat / messaging between buyers and sellers.
- Buyer-visible seller storefronts or seller ratings (breaks anonymity — see §5).
- Stripe Connect / automated seller transfers (see §5 payouts).
- Multi-currency UI. Currency is a single value; see §5.

## 5. Non-negotiable business rules

1. **Seller anonymity.** Buyers and guests never receive `seller_id`, store name, store slug, or seller contact. Enforced by `BuyerProductDTO` and the buyer serializer. The product page shows *platform* identity ("MarketNest Official" / "MarketNest Marketplace") and aggregate trust signals only. `brandName` is the *manufacturer* and is allowed.
2. **Product ownership** is one of `seller_owned | platform_owned | seller_assigned`. Only `platform_owned` shows the "MarketNest Official" badge and is fulfilled by admin with no payout.
3. **Roles** are `superadmin | seller | buyer`. Sellers may be **admin-invited** or **self-serve** (`POST /seller/onboarding` / `/seller/signup`). Listing products requires KYC `isVerified` either way. Sellers retain buyer shopping privileges.
4. **Payouts are a manual ledger, not transfers.** Stripe Connect is not viable for the target market (Pakistan). Payouts are recorded and settled out-of-band; the app tracks amounts and status only. See the `payouts-ledger-only` memory.
5. **Currency is USD in the current build** (matches the mobile design). The market reality is Pakistan/PKR; treat currency as a future config change, not a hardcoded assumption sprinkled through the code.

## 6. Definition of done (every feature)

- Maps to a user area above; buyer-facing routes respect anonymity (§5.1).
- Schema changes ship with a Supabase migration **and** an RLS policy.
- API inputs have DTOs + validation; responses are typed; no `any`.
- `npm run typecheck`, `npm run lint`, and `npm run test` all pass.
- New env vars are added to `.env.example`.
- The hosted database is never migrated or seeded without explicit user approval (see [Rules](Rules.md)).
