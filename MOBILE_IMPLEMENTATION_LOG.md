# MarketNest — Implementation Log (Mobile + supporting API/Web)

> Running record of what was built for the Expo app **and** the API / web work that unblocked or completed those features. Complements [Memory.md](Memory.md) (short running state). Companion: [MOBILE_REMAINING_FEATURES.md](MOBILE_REMAINING_FEATURES.md) — what is still open.
>
> Scope note: this file started as mobile-only. Later sessions shipped shared auth, seller web KYC, admin notifications, and catalogue rules — those are logged here too so the monorepo status stays honest.

_Last updated: 2026-07-24._

---

## 2026-07-23 → 07-24 — Auth refresh tokens, seller/buyer polish, DB pooler (full stack)

Cross-cutting work that closed most of [MOBILE_REMAINING_FEATURES.md](MOBILE_REMAINING_FEATURES.md) **plus** items never listed there.

### Access + refresh token auth (API + mobile + web)

- **API:** `POST /auth/refresh` (Supabase `refreshSession`), `POST /auth/logout` (best-effort global revoke). Login/register/setup-password/OAuth already returned both tokens.
- **`@marketnest/api-client`:** stores refresh; on 401 single-flight refresh → retry once; `setSession` / `clearSession`; `onUnauthorized` only after refresh fails.
- **Mobile:** `mn_refresh` in SecureStore; sign-in/up persist both; logout clears both after API call.
- **Web (buyer/seller/admin):** `mn_refresh` in localStorage; all login/register/OAuth/set-password paths persist both; buyer **Sign out** on Account + shop nav (was missing).

### Seller store hub + own-listing rules

- Verified hub (`/kyc`): “You’re verified” card **only when zero listings**; listing tap → buyer PDP (published) or edit (draft); edit icon → edit mode.
- Catalogue: signed-in sellers **do not see their own products** on home/explore (`listForBuyer` + optional JWT).
- PDP: `isOwnListing` boolean (no seller id leak); hide cart/wishlist/buy; “Your listing” + Edit.
- Cart / wishlist reject own products server-side.

### Variants, reviews, orders, rewards

- Optional variants on **Add Product** (+ helper copy); edit screen variants retained.
- Reviews: `GET /reviews/eligibility/:productId` is source of truth; Write Review CTA only when delivered + not yet reviewed.
- Buyer order status **synced** with seller item advances (rollup + derive on read); cancelled/refunded badges solid red/orange.
- Rewards crash fixed: public `GET /coupons` returns `id` / `discountType` / `discountValue`; mobile coerces decimals safely.

### Seller web ↔ mobile KYC sync

- Invite claim → `onboarding` + unverified; KYC submit **auto-approves** when `Seller.createdBy` set.
- Self-serve KYC → admin queue + in-app notify all superadmins.
- Listing gated until `isVerified`. Seller web: `/seller/signup`, `/seller/kyc`, products locked until verified.
- Admin: KYC queue + notification bell.

### Notifications deep links

- Shared `resolveNotificationHref` in `@marketnest/utils`; API sets `link` on feeds; mobile / admin / seller bells mark-read then navigate.

### Form validation + date pickers

- Shared PK phone / email validators in `@marketnest/utils`; mobile + web form fields; `@react-native-community/datetimepicker` (native rebuild for calendar).

### DB connectivity (API)

- Session pooler `:5432` for Nest `DATABASE_URL` / `DIRECT_URL` (not `db.*.supabase.co`, not transaction `:6543` for the long-lived API).
- `PrismaService.withRetry` on transient P1001; `OptionalJwtGuard` uses profile cache.

### KYC / product photo upload (mobile)

- Base64 JSON upload `POST /upload/image-base64`; Nest body limit 8mb (RN multipart was unreliable).

---

## 2026-07-23 — Remaining-features pass (buyer + seller mobile)

Closed nearly everything in the original remaining doc that did **not** need a new dependency.

### API

- Buyer addresses `PATCH` / `DELETE`
- Cart `shippingFee` (shared `SHIPPING_FEE=9.99` with checkout)
- Products `minPrice` / `maxPrice` / `sort`
- Public `GET /coupons`
- Sellers allowed on checkout / buyer commerce roles (already widened)

### Buyer mobile

- New: `addresses`, `profile-edit`, `settings`, `forgot-password`, `rewards`, `review/write`, `assistant`, `product-filters`
- Wired: account live stats; cart/checkout server shipping; **COD-only** (card/Apple disabled); order cancel / reorder / poll; product share + real variants; home/search filters + semantic + pull-to-refresh; sign-in forgot + social “coming soon”; sign-up email-confirm UX

### Seller mobile

- Live dashboard (`/seller/earnings` + orders)
- `seller/orders`, `seller/payouts`, `seller/edit-product` (incl. variants)
- Listings → edit / view

**Still deferred (need dep approval or out of scope):** Stripe native card (`@stripe/stripe-react-native`), Google/Apple OAuth (`expo-auth-session`), device push (`expo-notifications`), stored payment methods, real courier GPS.

---

## 2026-07-23 — Seller lifecycle, live KYC, product listings, real images

Turned seller/KYC shells into working flows, added buyer→seller path, reversed “no photography”. **No DB migration**; used existing `SellerKyc` / `Product.images`.

### 1. Self-serve seller onboarding

- `POST /seller/onboarding` — creates `Seller`, flips `Profile.role` → `seller`, opens blank KYC. Idempotent.
- `@Roles('buyer', 'seller')` — the bridge route. Listing still requires `isVerified`.
- **Deliberate exception to PRD §5.3** (“sellers created by admins only”) — admin invite path still exists; both paths require KYC.

### 2. Sellers keep shopping

- `@Roles('buyer','seller')` on orders, wishlist, reviews, buyer addresses, coupon validate.
- Mobile auth: `isSeller`, `becomeSeller()`, `isBuyer` true for sellers too.

### 3. Live KYC wizard (mobile)

- [`apps/mobile/app/kyc.tsx`](apps/mobile/app/kyc.tsx) — live steps, resume, submit, terminal states, document upload.

### 4. Add Product + My Listings

- `seller/new-product`, `seller/listings`; Seller Central only when `isSeller`.

### 5. Hybrid product images

- `ProductArt` + `imageUrl`; wishlist thumbnail; `expo-image-picker` (native rebuild).

### 6. Signup phone persisted

- Optional `phone` on register → profile.

### Verification (typical gates for these sessions)

`npm run typecheck` · `npm run lint` · `npm run test` (30 API tests) — green after each major pass.

---

## Earlier — Mobile design implementation (2026-07-22)

Green editorial Expo app from Claude Design; wishlist / brands / coupons / KYC / notification feed APIs; admin brands/coupons/KYC pages; migration `20260722000000_mobile_design_entities.sql` + demo seed. Detail: [Phases.md](Phases.md), [Memory.md](Memory.md).
