# MarketNest — Codebase map

> Pattern guide for AI and humans. **Do not vibe code** — match the nearest neighbour.
>
> Authority lives in the six root docs (do not duplicate them here):
> [PRD](../PRD.md) → [Architecture](../Architecture.md) → [Rules](../Rules.md) →
> [Phases](../Phases.md) → [Design](../Design.md) → [Memory](../Memory.md).
> Also: [ARCHITECTURE_PRINCIPLES](ARCHITECTURE_PRINCIPLES.md), [AGENTS](../AGENTS.md),
> [CLAUDE](../CLAUDE.md), [README](../README.md).

_Last updated: 2026-07-22._

---

## 1. API module shape

**Pattern.** One folder per domain under `apps/api/src/<domain>/`:
`*.module.ts` (controllers + providers + exports), thin `*.controller.ts`, logic in
`*.service.ts`. DTOs often live as `class-validator` classes **in the controller file**
for small modules (brands/coupons); larger domains use `dto/`. Controllers declare
`@Roles(...)` / `@Public()` per route; Swagger via `@ApiTags` / `@ApiBearerAuth`.
Register the module in `apps/api/src/app.module.ts`.

**Exemplar to copy.**
- Buyer-scoped CRUD + idempotency: `apps/api/src/wishlist/`
- Admin + buyer routes in one controller: `apps/api/src/coupons/`, `apps/api/src/brands/`

**Concrete habits observed.**
- Controllers pass `user.id` / DTO fields into the service; no business logic in the controller.
- Errors: Nest subtypes with **specific** messages (`BadRequestException('That promo code has expired.')`, not "invalid").
- Idempotency: `upsert` + empty `update` for add; `deleteMany` for remove (absent row = success).
- Concurrency: conditional `updateMany` (coupon redeem with `usedCount < usageLimit`); never check-then-write for limited resources.
- Soft-hide vs hard-delete: brands `deactivate` (`isActive: false`) so product FKs survive.
- Money: Prisma `Decimal` in DB → `Number()` at the DTO / quote boundary; snapshot discounts onto orders.
- Comments explain *why* (invariants, rejected alternatives), not *what*.

**Gotcha.** Coupons validate via `POST /coupons/validate` (body, not query) so codes never land in URLs/logs. Quote must not redeem; redeem only after order commit.

---

## 2. Anonymity boundary (buyer / guest)

**Pattern.** Two layers, both required:
1. Prisma **select** never includes the seller relation — `buildBuyerListSelect` /
   `buildBuyerDetailSelect` in `apps/api/src/products/products.service.ts`.
2. Mapper `toBuyerProductDTO` / `toBuyerProductListItemDTO` in
   `apps/api/src/products/buyer-product.mapper.ts` emits only buyer-safe fields.

**Allowed on buyer responses.** Product fields, variants, `ownerType` →
`isMarketNestOfficial` (true only when `platform_owned`), aggregate reviews,
`hue`, `categoryName`, `brandName` (manufacturer — **not** seller), `dealEndsAt`.

**Forbidden.** `seller_id`, store name/slug, seller contact, seller relation of any kind.
Admin/seller list paths **may** `include: { seller: … }`; buyer paths must not.

**Exemplar.** `buyer-product.mapper.ts` + the two `buildBuyer*Select` helpers.

**Gotcha.** Docs sometimes mention `ProductSerializerInterceptor` — it is **not** in
the tree today. The live boundary is select + mapper. Do not widen those selects.
Wishlist list builds its own narrow product select (still no seller) and filters to
`status === 'published'`. Buyer apps import `@marketnest/shared-types/buyer`, never
seller types from the full barrel.

---

## 3. Prisma schema & Supabase migrations

**Pattern.**
- Prisma models use camelCase fields with `@map("snake_case")` and `@@map("table")`.
- Money / rates: `@db.Decimal(12, 2)` (or similar) — never float columns for currency.
- Schema changes ship as `supabase/migrations/<timestamp>_<name>.sql` **with RLS** in
  the same file, then `npm run db:generate`. Newest example:
  `supabase/migrations/20260722000000_mobile_design_entities.sql`.
- Prisma schema source of truth for the API: `apps/api/prisma/schema.prisma`.

**Exemplar.** Latest mobile-design migration (brands, wishlist, coupons, notifications,
seller_kyc + ALTER columns + ENABLE RLS + policies).

**Gotcha.** `DATABASE_URL` is a **hosted** Supabase project. Never migrate/seed it
without explicit user approval. RLS is primary isolation; API service role bypasses
RLS for privileged transitions (e.g. KYC approval) — those must stay in the API, not
the client. Coupons deliberately have **no** public SELECT policy.

---

## 4. Shared types

**Pattern.** Cross-app DTOs in `packages/shared-types/src/`.
- Full barrel: `src/index.ts` (includes seller) → package export `"."`.
- Buyer barrel: `src/buyer.ts` — enums, auth, buyer-product, cart, order — **excludes
  seller**. Export path: `@marketnest/shared-types/buyer`.

**Exemplar.** `buyer-product.ts`, `order.ts`, `buyer.ts`.

**Gotcha.** Web buyer pages and `api-server.ts` use `/buyer`. Mobile currently imports
`@marketnest/shared-types` for buyer DTOs (same types) — still must never pull seller
shapes into buyer UI. After changing types, rebuild the package (`npm run build -w
@marketnest/shared-types`) so `dist/` consumers see them.

---

## 5. Design tokens (two scales)

**Pattern.** `@marketnest/tokens`
- **Web (coral / paper):** `packages/tokens/src/index.ts` → `colors`, `dark`, `radii`,
  `spacing`, `fontFamily` (Outfit / DM Sans), etc.
- **Mobile (green):** `packages/tokens/src/mobile.ts` → `mobileDark` / `mobileLight`,
  `mobileRadii`, `mobileFontSize`, `mobileFontFamily` (Cormorant + DM Sans),
  `oklchToHex` / `productTileStops`, `categoryEmoji`. Re-exported from `index.ts`.
- Mobile app façade: `apps/mobile/src/theme.ts` re-exports mobile tokens + helpers
  (`ctaGradient`, `glow`, `formatPrice`, `orderProgress`). Screens use `useTheme()`
  for colours.

**Gotcha.** Forked on purpose — never paint web with green mobile tokens or mobile
with coral. Never hardcode a hex/spacing a token already covers. Mobile: **no
product photography** — `ProductArt` only (hue gradient + emoji).

---

## 6. Mobile screen pattern

**Pattern.**
- Screens under `apps/mobile/app/` (expo-router). Shared UI under `apps/mobile/src/`.
- Colours from `useTheme().theme` / `isDark`; type/radii from `../theme`.
- `StyleSheet.create` for static layout; dynamic colours inline.
- Interaction: `PressableScale` (scale + haptic; respects Reduce Motion).
- Icons: local SVG `Icon` (`src/components/icon.tsx`) — no icon font.
- Headers/sections: `ScreenHeader`, `SectionHeading`.
- Data: `useApi` for reads; `CartProvider` / `WishlistProvider` / `AuthProvider` for
  shared mutable state. Wishlist toggles optimistic; cart mutations re-fetch server.
- A11y: `accessibilityRole` / `accessibilityLabel`; decorative glyphs
  `accessibilityElementsHidden`.
- Navigation: `router.push` / `back` / `replace`; paddingBottom ~140 for tab pill.

**Exemplar screens.** `(tabs)/index.tsx`, `product/[id].tsx`, `(tabs)/cart.tsx`.
**Exemplar components.** `product-card.tsx`, `product-tile.tsx` (`ProductArt`),
`icon.tsx`, `screen-header.tsx`, `section-heading.tsx`, `pressable-scale.tsx`.
**Contexts / hooks.** `theme-context.tsx`, `cart-context.tsx`, `hooks/use-wishlist.ts`.

**Gotcha.** Expo **SDK 57** — read `docs.expo.dev/versions/v57.0.0/` before mobile work.
Nested `apps/mobile/AGENTS.md` reinforces this.

---

## 7. Mobile navigation

**Pattern.**
- Root `apps/mobile/app/_layout.tsx`: splash held until fonts load; providers
  `SafeAreaProvider` → `ThemeProvider` → `AuthProvider` → `CartProvider` →
  `WishlistProvider`; Stack with modals for sign-in/up, kyc, checkout.
- Tabs `apps/mobile/app/(tabs)/_layout.tsx`: headless `expo-router/ui`
  (`Tabs` / `TabList` / `TabTrigger` / `TabSlot`) — floating pill + centre Sell FAB.
  `TabList` must stay a direct child of `Tabs` (wrapping View breaks route discovery).

**Gotcha.** Do not add `@react-navigation/bottom-tabs` as a direct dependency for a
custom bar. FAB routes to `/kyc` if signed in else `/sign-in`.

---

## 8. Web admin page pattern

**Pattern.**
- `'use client'` pages under `apps/web/src/app/(admin)/admin/<area>/page.tsx`.
- `useAuth().token` + `apiFetch` from `@/lib/api` (typed `@marketnest/api-client` binding).
- State shape: `loading` / `error` / data; `load` via `useCallback` + `useEffect`.
- Loading UI: `TableSkeleton`; errors: `<p className="text-sm text-coral">`.
- Vocabulary from `globals.css`: `.btn` `.btn-purple` `.btn-outline` `.btn-sm` `.card`
  `.input` `.badge`; headings `font-outfit`.
- Shell / nav: `admin-shell.tsx` (`AuthGuard` + `PortalShell` + lucide icons). New admin
  areas need a nav entry there.

**Exemplar.** `categories/page.tsx` (older), `brands/page.tsx`, `coupons/page.tsx`,
`kyc/page.tsx` (newer — same shape).

**Gotcha.** Prefer `/admin/...` endpoints for management lists (e.g. brands with
counts); public catalogue endpoints filter differently.

---

## 9. Web buyer / seller data flow

**Buyer (catalogue).**
- Server Components by default. ISR: `export const revalidate = 60`.
- Reads via `apps/web/src/lib/api-server.ts` — `fetch` with `next: { revalidate: 60 }`,
  typed against `@marketnest/shared-types/buyer`, soft-fallback on failure.
- Exemplar: `apps/web/src/app/(buyer)/shop/page.tsx`.

**Client mutations / auth.**
- Browser: `apps/web/src/lib/api.ts` → `apiFetch` / guest cart helpers; token in
  localStorage; `UNAUTHORIZED_EVENT` for session clear.

**Seller / admin.**
- Mostly client pages with `apiFetch` + token (same admin pattern). Auth enforced on
  API with `@Roles`; UI `AuthGuard` is secondary.

**Gotcha.** Never share React components between web and mobile (different React
majors). Share types, api-client, tokens only. API is `/api/v1` — keep changes additive
for long-lived mobile clients.

---

## Conventions (must follow when editing)

| Area | Rule |
|---|---|
| **Match neighbour** | Open the nearest existing module/screen/page; copy structure, naming, comment density, error style. |
| **Naming** | Domain folders kebab/flat Nest modules; Prisma camelCase + `@map` snake; SQL snake_case tables. |
| **Errors** | Nest `HttpException` subtypes; specific actionable messages; clients surface API messages; keep last-good UI state on background read failure. |
| **DTO / validation** | Every API input: `class-validator` (+ `ParseUUIDPipe` on id params). No `any`, no `@ts-ignore`. |
| **Anonymity** | Never widen buyer selects / mapper; never import seller types into buyer UI; use `/buyer` barrel on web. |
| **Tokens** | Import the correct scale (web coral vs mobile green); no raw hex/spacing that tokens cover. |
| **Migrations** | Schema change ⇒ Supabase SQL + RLS + `db:generate` in the same change. Hosted DB: user approval only. |
| **Money** | `Decimal` in DB; `Number()` at boundary; snapshot mutable promo amounts onto orders. |
| **Idempotency** | Upsert / deleteMany / conditional updateMany for toggles and limited resources. |
| **Async** | Work >200ms → BullMQ (email, embeddings, exports). |
| **HTTP clients** | `@marketnest/api-client` / `apiFetch` / mobile `api` — not ad-hoc `fetch` in screens. |
| **Icons** | Web: `lucide-react`. Mobile: local `Icon` SVG set. |
| **Mobile SDK** | Expo 57 docs before coding; headless `expo-router/ui` for custom tabs. |
| **Testing / gates** | Before "done": `npm run typecheck && npm run lint && npm run test`. Never claim green on red. |
| **Git** | No commit/push unless asked. Leave working tree as-is. |
| **Scope** | Fix what was asked; flag adjacent issues separately. Update `Memory.md` when finishing a session. |
| **Deps / stack** | No new packages or stack swaps without explicit approval. |

---

## Quick “where do I start?”

| Task | Open first |
|---|---|
| New Nest domain | `wishlist/` or `brands/` + register in `app.module.ts` |
| Buyer-facing product field | `buildBuyer*Select` + `buyer-product.mapper.ts` + `shared-types` buyer DTOs |
| Schema change | `schema.prisma` + new `supabase/migrations/*.sql` (w/ RLS) |
| Mobile screen | nearest `app/*.tsx` + `theme` / `useTheme` / `PressableScale` |
| Admin CRUD page | `admin/brands/page.tsx` + `admin-shell.tsx` nav |
| Buyer web catalogue | `shop/page.tsx` + `lib/api-server.ts` |
| Colour / spacing | `packages/tokens` (right scale) — never hardcode |
