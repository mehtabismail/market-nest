# MarketNest — Remaining Features

> Audit of what is **still open** after the 2026-07-23/24 implementation passes. Companion: [MOBILE_IMPLEMENTATION_LOG.md](MOBILE_IMPLEMENTATION_LOG.md) (done) and [Memory.md](Memory.md) (running state).
>
> Most of the original mobile remaining list is **done**. This file keeps only unfinished work across **mobile, web, and API**, plus dependency-gated items.

_Last updated: 2026-07-24._

**Status legend:** ✅ Live · ⚠️ Partial · ❌ Not built / blocked on approval.

---

## Status at a glance

| Area | Feature | Status | Notes |
|---|---|---|---|
| Buyer mobile | Home, search, filters, semantic, PDP, cart, COD checkout, wishlist, notifications, orders, addresses, profile, settings, rewards, assistant | ✅ | See implementation log |
| Buyer mobile | Card / Apple Pay checkout | ❌ | Needs `@stripe/stripe-react-native` (approval) |
| Buyer mobile | Stored payment methods UI | ❌ | No backend for saved cards |
| Buyer mobile | Google / Apple sign-in | ❌ | Needs `expo-auth-session` (+ Apple auth) — approval |
| Buyer mobile | Device push notifications | ❌ | In-app feed ✅; needs `expo-notifications` + token column |
| Buyer mobile | Real courier GPS “Track Live” | ❌ | Polling by status ✅; GPS out of scope |
| Seller mobile | Onboarding, KYC hub, listings, add/edit/variants, orders, payouts, dashboard | ✅ | |
| Seller web | Signup + KYC wizard, listing gate, invite → KYC | ✅ | |
| Auth (all) | Access + refresh tokens, logout (incl. buyer web) | ✅ | |
| Platform | Empty/error/retry polish on every screen | ⚠️ | Improved on main lists; not universal |
| Platform | Universal / App Links for share URLs | ⚠️ | `marketnest://` scheme works; HTTPS universal links not fully verified |
| Infra | Closer Supabase region / lower pooler RTT | ⚠️ | Session pooler fixed; cold latency to ap-south-1 still noticeable from PK |

---

## Still to do

### 1. Mobile card / Apple Pay checkout ❌

**Now:** Checkout is **COD-only**; card/Apple affordances are disabled or “coming soon”.
**Backend:** `POST /orders/:id/payment-intent` (Stripe) exists; web already uses Stripe Elements.
**Implement:** After dep approval for `@stripe/stripe-react-native` (or a hosted WebView checkout): create intent → collect card → confirm → poll order status. Keep COD as fallback.

### 2. Stored payment methods ❌

**Now:** Account “Visa •4242” was presentational and was removed / not wired.
**Implement:** Stripe Customer + PaymentMethods APIs, secure storage UX, or leave omitted until card checkout ships.

### 3. Google / Apple sign-in on mobile ❌

**Now:** Buttons show “coming soon”.
**Backend:** `POST /auth/oauth/callback` (+ refresh token) exists; **buyer web** Google OAuth works.
**Implement:** `expo-auth-session` / `expo-apple-authentication` (approval), Supabase provider config, `marketnest://` redirect, persist access + refresh via `setSession`.

### 4. Device push notifications ❌

**Now:** In-app feed + deep links work on mobile / admin / seller web.
**Implement:** `expo-notifications` (approval); store Expo push token on profile (**migration + endpoint**); enqueue pushes from `NotificationFeedService` (BullMQ); tap → `resolveNotificationHref`.

### 5. Universal / App Links ⚠️

**Now:** Custom scheme + in-app notification routing work.
**Implement:** Verify cold-start deep links; add Associated Domains / Android App Links for shared product URLs if marketing needs HTTPS links.

### 6. UX polish (empty / error / retry) ⚠️

**Now:** Main commerce lists have refresh/error paths; some detail screens still thin-load.
**Implement:** Consistent skeletons, retry, keep last-good data on background failures ([Rules.md](Rules.md) §4).

### 7. Optional product / ops follow-ups

- Trending search terms: still static on Explore (optional API later).
- Seller Android shipping prompts: prefer custom modals over iOS-only `Alert.prompt` if not already replaced.
- Web buyer: optional parity for any mobile-only account screens (rewards list is mobile-first via `GET /coupons`).

---

## Explicitly out of scope (unless requested)

- Real courier GPS tracking
- Automated payout bank transfers (ledger-only by design)
- Migrating **web** portals to the green mobile brand (web stays coral unless asked)
- Hosted DB migrate/seed without explicit approval

---

## Suggested order

1. **Dep-gated commerce:** mobile Stripe checkout (if launching paid online on phone).
2. **Auth:** Google/Apple on mobile (web already has Google).
3. **Engagement:** device push.
4. **Polish:** empty/error states + universal links.

Each item: match existing patterns, no new dependency without approval, gate with `typecheck` + `lint` + `test`, update [Memory.md](Memory.md) + this file when done.
