# MarketNest — Phasing

> One of six context files. Read order: **[PRD](PRD.md) → [Architecture](Architecture.md) → [Rules](Rules.md) → [Phases](Phases.md) → [Design](Design.md) → [Memory](Memory.md)**.

_Last updated: 2026-07-22._ Full historical detail: [`docs/PHASES.md`](docs/PHASES.md).

---

## How to phase work (mandatory for large features)

Never build a large module or feature in one undifferentiated pass. Break it down:

1. **Slice by layer, deliver end-to-end.** A phase should be shippable and verifiable on its own — e.g. "schema + migration + one read endpoint", then "write endpoints", then "UI". Avoid half-built layers that don't typecheck.
2. **Schema & contracts first.** Migration + RLS + Prisma + shared-types DTOs before services; services before controllers; API before UI. Downstream layers depend on the shape being settled.
3. **One phase = one coherent, reviewable change.** If a phase touches >~15 files or crosses buyer/seller/admin/mobile all at once, split it.
4. **Gate every phase** with typecheck + lint + test before moving on. A green phase is the checkpoint you can safely build the next one on.
5. **Record the boundary** in [Memory.md](Memory.md): what this phase delivered, what the next one picks up, what was deliberately deferred ("wire later").
6. **Respect priority.** Do P1 before P2/P3 unless the user says otherwise.

When a task is ambiguous or spans many areas, propose the phase breakdown and confirm before writing code.

---

## Delivered (high level)

- **P1 Scaffold** — Turborepo, Supabase schema + RLS + seed, Prisma, NestJS auth/RBAC/health, `BuyerProductDTO` anonymity mapper, Next.js portal shells, design tokens, CI.
- **P2 Core commerce** — products, categories, Redis cart, orders, Stripe/COD, seller invite; web `/shop`, cart, checkout, seller portal, admin sellers.
- **P3 Admin/notifications/reviews/payouts** — audit logs, BullMQ email queue, reviews, seller earnings/payouts, analytics CSV, banners/featured.
- **P4 AI search & assistant** — pgvector semantic search, OpenAI embeddings queue, buyer assistant chat.
- **P5 Performance & beta** — Redis rate limits, catalogue cache, beta checklist, health bench.
- **P6 Portal completion** — buyer orders/account, seller order detail/inventory/analytics, admin orders/fulfilment/products/categories/banners/payouts/seller CRUD.
- **P7 Feature complete** — image upload (Supabase Storage), product variants, Google OAuth, checkout success, order polling, admin users/revenue/featured, async analytics export, RLS + storage migrations.
- **Mobile hardening** — Expo app, secure token storage, native glass chrome (earlier iteration).

## Current phase — Mobile design implementation (2026-07-22)

Implemented the Claude Design `MarketNest.dc.html` (green editorial) end-to-end. See [Memory.md](Memory.md) for the file-level detail. Summary:

- **Done:** forked green mobile token scale; all 13 mobile screens rebuilt; new backend (wishlist, brands, coupons, KYC, in-app notification feed) + product/order/seller/category columns; migration + demo seed applied to the hosted DB; admin web pages for brands, coupons, KYC review. All packages typecheck; 30 API tests pass; lint clean.
- **Deferred ("wire later"), the next phase:**
  1. **Mobile Seller Central + KYC → live data.** Both screens are pixel-faithful UI on representative data today. The API exists (`/seller/kyc`, `/seller/orders`, `/seller/earnings`). Blocker to design first: a signed-in buyer does not yet hold the `seller` role, so becoming a seller needs an onboarding/role-transition step before the wizard can submit for real.
  2. **Seller portal (web) surfacing of KYC status** for the seller's own application.
  3. Optional: migrate the **web** portals to the green brand (currently coral) — only if the user asks; it repaints all web pages.

## Backlog / not started

- Real seller onboarding flow (buyer → seller role transition).
- Payment methods storage (the "Visa •4242" in the design is presentational).
- Push notifications (the in-app feed exists; device push does not).
