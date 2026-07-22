# MarketNest — Working memory

> One of six context files. Read order: **[PRD](PRD.md) → [Architecture](Architecture.md) → [Rules](Rules.md) → [Phases](Phases.md) → [Design](Design.md) → [Memory](Memory.md)**.
>
> **This is the running state of the project.** Update it at the end of every work session: what you finished, what's mid-flight, what's deferred. Keep it short and current — stale memory is worse than none.

_Last updated: 2026-07-22._

---

## Currently being worked on

- Nothing in-flight. The mobile design implementation phase is complete and green (typecheck + lint + 30 API tests pass). Changes are in the working tree, **not committed**.

## Just completed — Mobile design (`MarketNest.dc.html`)

**Tokens** — forked green mobile scale in `packages/tokens/src/mobile.ts` (both themes, oklch→hex converter, category glyphs). Web coral tokens untouched.

**Mobile screens rebuilt** (`apps/mobile/app/`): Home, Search, Product, Cart, Checkout (3-step + success), Orders list, Order detail (`orders/[id]`), Profile (`(tabs)/account`), Seller Central (`seller`), KYC (`kyc`), Sign-in, Sign-up, Notifications, Wishlist. Plus tab bar with pulsing FAB (`(tabs)/_layout`), `ProductArt`, `ProductCard`, `SectionHeading`, `ScreenHeader`, `Icon` set, theme context (persisted light/dark), cart + wishlist contexts. Removed dead `glass.tsx`/`states.tsx`/`fade-in.tsx`.

**Backend** (`apps/api/src/`): new modules `wishlist`, `brands`, `coupons`, `kyc`, and `notifications/notification-feed.*` (in-app feed alongside the email queue). New Prisma models `Brand`, `WishlistItem`, `Coupon`, `Notification`, `SellerKyc`; new columns on `Product` (hue, brandId, deal window, viewCount), `Order` (discount, couponCode, estimates), `Seller` (ratingAvg, salesCount, isVerified), `Category` (emoji, hue). Checkout re-validates coupons server-side and writes an in-app confirmation.

**Shared types** — `BuyerProduct*DTO` gained `hue`, `categoryName`, `brandName`, `dealEndsAt`; `Order*DTO` gained `discount`, `couponCode`, `estimatedFrom/To`.

**Migration + seed** — `supabase/migrations/20260722000000_mobile_design_entities.sql` and `supabase/seed_demo.sql`. **Both applied to the hosted Supabase project** (additive only). Verified live: 11 products, 8 brands, 10 categories, 3 coupons, 2 active flash deals.

**Admin web** — new pages `apps/web/src/app/(admin)/admin/{brands,coupons,kyc}/page.tsx`, wired into the admin nav.

## Deferred — pick up next (see [Phases](Phases.md))

1. **Mobile Seller Central + KYC are UI-only** (pixel-faithful, representative data). Wire to the live API next. Blocker: buyer→seller role transition doesn't exist yet, so KYC can't submit for real.
2. Seller **web** portal: show the seller their own KYC status.
3. Payment-method storage (design's "Visa •4242" is presentational).
4. Device push notifications (in-app feed exists; push does not).

## Standing decisions (do not re-litigate)

- **Mobile palette is forked** (green), web stays coral. Mobile-only by choice.
- **Mobile shows no product photography** — generated gradient+emoji from `hue`.
- **Seller anonymity holds** — product page shows platform identity + aggregates only; `brandName` (manufacturer) is allowed.
- **Currency is USD** as designed (market is Pakistan/PKR — future config change).
- **Payouts are a manual ledger**, not Stripe Connect transfers.
- **Redis** is local in dev / managed in prod (Upstash dropped).
- Private per-machine notes also live in Claude Code memory at `~/.claude/projects/<project>/memory/` (`mobile-design-decisions`, `payouts-ledger-only`, `redis-local-for-dev`, `no-claude-cli-installed`).

## Gotchas learned

- `apps/mobile` is Expo **SDK 57**: custom tab bars use headless `expo-router/ui` (`TabList`/`TabTrigger`/`TabSlot`); `@react-navigation/bottom-tabs` is not a direct dep. Read `docs.expo.dev/versions/v57.0.0/` before mobile work.
- Filesystem is **case-insensitive** (macOS) — `Foo.md` and `foo.md` are the same file. Watch for collisions.
- `DATABASE_URL` is a hosted project; the pooler host resolves reliably, the `DIRECT_URL` host was intermittently unresolvable. Never migrate/seed it without user approval.
