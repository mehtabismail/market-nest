# MarketNest — Phasing

> One of six context files. Read order: **[PRD](PRD.md) → [Architecture](Architecture.md) → [Rules](Rules.md) → [Phases](Phases.md) → [Design](Design.md) → [Memory](Memory.md)**.

_Last updated: 2026-07-24._ Full historical detail: [`docs/PHASES.md`](docs/PHASES.md). Mobile detail: [MOBILE_IMPLEMENTATION_LOG.md](MOBILE_IMPLEMENTATION_LOG.md) · open work: [MOBILE_REMAINING_FEATURES.md](MOBILE_REMAINING_FEATURES.md).

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

- **P1–P7** — Scaffold through feature-complete web/API (see [docs/PHASES.md](docs/PHASES.md)).
- **Mobile design (2026-07-22)** — Green Expo app; wishlist/brands/coupons/KYC/notification feed APIs; admin brands/coupons/KYC.
- **Seller lifecycle + listings + images (2026-07-23)** — Self-serve onboarding, live KYC, add/list products, hybrid images.
- **Mobile remaining-features pass (2026-07-23)** — Filters, semantic search, COD loop, addresses, profile/settings, rewards, reviews, assistant, seller dashboard/orders/payouts/edit+variants.
- **Cross-portal polish (2026-07-23/24)** — Refresh-token auth (API+mobile+web), buyer web logout, seller web KYC sync, listing gate, notification deep links, own-listing exclusion, order status sync, session-pooler DB URLs.

## Current phase — Close remaining dependency-gated items

Most product surface area for mobile + seller web is **live**. Open work is tracked in [MOBILE_REMAINING_FEATURES.md](MOBILE_REMAINING_FEATURES.md):

1. Mobile Stripe card checkout (`@stripe/stripe-react-native` — approval).
2. Mobile Google/Apple OAuth (`expo-auth-session` — approval).
3. Device push (`expo-notifications` + token storage — approval).
4. Stored payment methods; universal links; empty/error polish.

**Do not** treat “wire Seller Central / KYC / listings” as open — those shipped.

## Previous — Seller onboarding + KYC/listings + images (2026-07-23)

- Self-serve `POST /seller/onboarding` (PRD invite-only exception); sellers still shop; live KYC; Add Product + Listings; hybrid images; `expo-image-picker`.
- Follow-ons (now done): live seller dashboard/orders/payouts/edit; seller web KYC; refresh auth; catalogue own-listing rules.

## Backlog / not started

- Payment methods storage (presentational card row removed / unwired).
- Device push (in-app feed exists).
- Mobile native Stripe + social OAuth (web has Stripe Elements + Google OAuth).
