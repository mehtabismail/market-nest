# MarketNest — Working memory

> One of six context files. Read order: **[PRD](PRD.md) → [Architecture](Architecture.md) → [Rules](Rules.md) → [Phases](Phases.md) → [Design](Design.md) → [Memory](Memory.md)**.
>
> **This is the running state of the project.** Update it at the end of every work session: what you finished, what's mid-flight, what's deferred. Keep it short and current — stale memory is worse than none.

_Last updated: 2026-07-24._

---

## Currently being worked on

- Web redesign complete. **Both buyer shop AND seller portal are now dark "Spatial Glass"** (`.shop-theme` + `.seller-theme` share the dark palette + aurora/spotlight/glass in marketnest-theme.css). Admin untouched (coral). Seller keeps its sidebar (now dark glass) rather than a dock — 7 nav items suit a sidebar; buyer uses the floating dock.

## Web redesign — "Spatial Glass" buyer rebuild (2026-07-24)

User rejected the first (light Lumen) pass as "still typical e-commerce" — wanted something unique/3D/glass, and called the nav/footer dated. Rebuilt the **buyer shop** as a dark immersive concept (chosen from 3 options: Spatial Glass / Editorial Gallery / Bento OS).

- **`.shop-theme` is now DARK** (`--mn-paper` #080710, `--mn-ink` light) — palette split so `.seller-theme` stays light Lumen. Same violet/fuchsia accents.
- **Chrome:** dropped the top nav bars (no more PortalShell for buyer). New floating **glass dock** (`shop-dock.tsx`: `ShopHud` top logo+cart+account, `ShopDock` bottom nav pill) + rich glass **footer** (`shop-footer.tsx`) + cursor **spotlight** (`shop-atmosphere.tsx`) + fixed aurora mesh. Layout rewired in `shop-layout-client.tsx`.
- **Hero:** kinetic type on open canvas + a **3D floating glass showcase** (mouse-tilt, depth-stacked panels). Product cards are dark frosted-glass panels with tilt.
- **⚠️ Critical learnings (do not regress):**
  1. **Content must never depend on an animation to become visible.** A backgrounded/headless tab freezes CSS animations at their `from` state. The `slide-up`/`fade-in`/`shop-reveal` keyframes are **transform-only (no opacity)** for this reason. Framer-motion `whileInView`/entrance `animate` opacity tweens also stall under GPU load — use CSS transform reveals for entrances; reserve framer-motion for interaction (tilt, hover, layout pill).
  2. **Perf:** `backdrop-filter` is used on chrome only (dock/HUD/hero-showcase/footer), NOT on every card — a full grid of blurs tanks fps. Cards fake glass via layered translucency. Spotlight moves via `translate3d` (compositor), aurora is static.
  3. Banner carousel now filters empty `imageUrl` (next/Image throws on empty src — was the mystery "gray bar").
- **Gates:** tsc + lint clean. Hero verified live; below-fold paints on a real browser (headless preview can't composite the heavy dark page off-screen).

## Web redesign — "Lumen" premium pass (2026-07-24)

New from-scratch web identity for **buyer shop + seller portal only** (admin deliberately untouched — still coral). User chose a new premium palette over porting the mobile green.

- **Palette (Lumen):** electric violet `#6D5EF6` + fuchsia `#C13FE0` gradient · gold `#E4A93C` (ratings/Official) · emerald `#10B981` (success/trust) · rose `#F43F5E` (deals) · ink `#17141F` on porcelain `#F3F1F6`.
- **Type:** Syne (display, repointed from `font-outfit`) · Plus Jakarta Sans (body) · Instrument Serif (hero accent) · DM Mono (prices/data). Via `next/font/google`.
- **Architecture:** Tailwind `mn-*` colours are now **CSS-variable channels** (`rgb(var(--mn-x) / <alpha>)`). Coral defaults in `globals.css :root` (admin/legacy); Lumen scoped to `.shop-theme, .seller-theme` in `marketnest-theme.css`. **Re-hue = edit ~14 channels in one place.**
- **Motion:** `framer-motion` (already a dep) primitives in `apps/web/src/components/ui/motion.tsx` — Reveal, StaggerGroup/Item, SplitText, TiltCard, MotionButton. All honour `prefers-reduced-motion`. **No new dependencies added.**
- **Bespoke redesigns:** hero, product card (tilt), categories, product grid, shop nav (glass + animated active pill), banner carousel, PDP, search, `AuthLayout` (aurora brand panel — covers all 8 auth pages), portal shell, seller dashboard (bento stats), seller shell.
- **Inherited (auto-themed via tokens + `.card/.btn/.input/.stat/brand-text` remaps):** cart, checkout, account, orders, seller orders/products/analytics/earnings/inventory/KYC.
- **Gates:** `tsc --noEmit` clean; `next lint` clean (only pre-existing `<img>` warnings). Verified live on `/shop` + `/shop/login`.
- **Deferred polish:** bespoke motion/charts on seller analytics/earnings + buyer cart/checkout empty/loading states (they inherit the palette but aren't hand-composed).

## Docs sync (2026-07-24)

Refreshed [MOBILE_IMPLEMENTATION_LOG.md](MOBILE_IMPLEMENTATION_LOG.md) (done) and [MOBILE_REMAINING_FEATURES.md](MOBILE_REMAINING_FEATURES.md) (only open / dep-gated). Also [Phases.md](Phases.md), [AGENTS.md](AGENTS.md), [docs/PHASES.md](docs/PHASES.md), [README.md](README.md) seller onboarding note.

## Just completed — DB pooler flakiness fix (2026-07-23)

Intermittent `Can't reach database server` / slow login 500s.

**Fixes:** Session pooler `:5432` for Nest `DATABASE_URL` + `DIRECT_URL` (not `db.*.supabase.co`, not transaction `:6543` for the API process); `PrismaService.withRetry`; OptionalJwt uses profile cache. Cold RTT to ap-south-1 can still be ~0.5–2s.

## Just completed — Cross-portal product pass (2026-07-23)

Summarised in the implementation log. Highlights: refresh-token auth (API+mobile+web) + buyer web logout; seller hub / own-listing exclusion; variants on add; review eligibility; order status sync + red cancelled badges; rewards coupon shape; seller web KYC sync; notification deep links; PK phone/email + date pickers; KYC base64 upload.

## Deferred — pick up next

See [MOBILE_REMAINING_FEATURES.md](MOBILE_REMAINING_FEATURES.md) and [Phases.md](Phases.md):

1. Mobile Stripe card checkout (`@stripe/stripe-react-native` — dep approval).
2. Mobile Google/Apple OAuth (`expo-auth-session` — dep approval).
3. Device push (`expo-notifications` + token column — dep approval).
4. Stored payment methods; universal links; empty/error polish.

## Standing decisions (do not reverse without asking)

- **Self-serve seller onboarding is intentional.** Listing requires `isVerified`. Admin-invited sellers auto-verify on KYC submit; self-serve wait in `/admin/kyc`.
- Payouts = manual ledger; currency USD.
- Hybrid product images on mobile; Redis local in dev.
- Same Supabase account works mobile ↔ `/seller` web.
- Nest DB URLs use **Session pooler** (`aws-*.pooler.supabase.com:5432`).
