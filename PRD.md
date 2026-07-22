# MarketNest — Product Requirements

> One of six context files. Read order: **[PRD](PRD.md) → [Architecture](Architecture.md) → [Rules](Rules.md) → [Phases](Phases.md) → [Design](Design.md) → [Memory](Memory.md)**. Do not start a task until you have read all six.

_Last updated: 2026-07-22._

---

## 1. What we are building

**MarketNest** is a multi-vendor e-commerce marketplace. Multiple independent sellers list products under one storefront, buyers shop across all of them in a single catalogue, and a super admin operates the platform.

It ships as **four surfaces from one monorepo**:

| Surface | Who it's for | Where |
|---|---|---|
| Buyer web | Shoppers | `marketnest.com` (`apps/web`, `(buyer)` route group) |
| Seller portal | Vendors | `sell.marketnest.com` (`apps/web`, `(seller)` route group) |
| Admin console | Platform operators | `admin.marketnest.com` (`apps/web`, `(admin)` route group) |
| Mobile app | Shoppers (+ seller onboarding) | iOS/Android (`apps/mobile`, Expo) |

All four talk to **one** backend: the NestJS API in `apps/api`, REST at `/api/v1`.

## 2. Target users

- **Buyer** — browses, searches, wishlists, carts, checks out (card or cash on delivery), tracks orders, reviews products. May shop as a guest; cart survives sign-in.
- **Seller** — invited by an admin, completes KYC, lists products and variants, manages inventory and orders, sees analytics, receives payouts. **Sellers are anonymous to buyers** (see §5).
- **Super admin** — creates/suspends sellers, reviews KYC, curates catalogue (categories, brands, banners, featured), manages coupons, fulfils platform-owned orders, runs payouts, reads analytics and audit logs.

## 3. Feature areas

**Catalogue & discovery** — product listing/detail, categories, brands, search (keyword + pgvector semantic), flash deals, featured/curated rails, banners.

**Cart & checkout** — guest + authenticated cart (Redis), promo codes (coupons), shipping, card (Stripe) and cash-on-delivery, delivery estimates, order confirmation.

**Orders & fulfilment** — buyer order history + live tracking, seller order queue with status transitions, admin fulfilment for platform-owned inventory.

**Seller lifecycle** — admin invite → password setup → KYC (5 steps: personal, business, ID docs, bank, review) → admin approval → live seller with dashboard, products, payouts.

**Engagement** — wishlist, product reviews & ratings, in-app notifications (feed) + transactional email (queue).

**Admin operations** — sellers, users, orders, fulfilment, products, categories, brands, coupons, KYC review, banners, featured, payouts, revenue, analytics (async CSV export), audit log.

## 4. Explicit non-goals (do not build unasked)

- Real-time chat / messaging between buyers and sellers.
- Buyer-visible seller storefronts or seller ratings (breaks anonymity — see §5).
- Stripe Connect / automated seller transfers (see §5 payouts).
- Multi-currency UI. Currency is a single value; see §5.

## 5. Non-negotiable business rules

1. **Seller anonymity.** Buyers and guests never receive `seller_id`, store name, store slug, or seller contact. Enforced by `BuyerProductDTO` and the buyer serializer. The product page shows *platform* identity ("MarketNest Official" / "MarketNest Marketplace") and aggregate trust signals only. `brandName` is the *manufacturer* and is allowed.
2. **Product ownership** is one of `seller_owned | platform_owned | seller_assigned`. Only `platform_owned` shows the "MarketNest Official" badge and is fulfilled by admin with no payout.
3. **Roles** are `superadmin | seller | buyer`. Sellers are created by admins only, never self-signup into a seller role.
4. **Payouts are a manual ledger, not transfers.** Stripe Connect is not viable for the target market (Pakistan). Payouts are recorded and settled out-of-band; the app tracks amounts and status only. See the `payouts-ledger-only` memory.
5. **Currency is USD in the current build** (matches the mobile design). The market reality is Pakistan/PKR; treat currency as a future config change, not a hardcoded assumption sprinkled through the code.

## 6. Definition of done (every feature)

- Maps to a user area above; buyer-facing routes respect anonymity (§5.1).
- Schema changes ship with a Supabase migration **and** an RLS policy.
- API inputs have DTOs + validation; responses are typed; no `any`.
- `npm run typecheck`, `npm run lint`, and `npm run test` all pass.
- New env vars are added to `.env.example`.
- The hosted database is never migrated or seeded without explicit user approval (see [Rules](Rules.md)).
