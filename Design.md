# MarketNest — Design system

> One of six context files. Read order: **[PRD](PRD.md) → [Architecture](Architecture.md) → [Rules](Rules.md) → [Phases](Phases.md) → [Design](Design.md) → [Memory](Memory.md)**.

_Last updated: 2026-07-22._ Tokens are the source of truth: [`packages/tokens/src/index.ts`](packages/tokens/src/index.ts) (web) and [`packages/tokens/src/mobile.ts`](packages/tokens/src/mobile.ts) (mobile).

---

## There are TWO design systems. Do not mix them.

| | **Web** (buyer/seller/admin) | **Mobile** (Expo app) |
|---|---|---|
| Identity | Warm editorial — ink on paper | Green editorial — glow on green-black |
| Primary accent | Coral `#e8472a` | Green `#3dcf7a` (dark) / `#1b9456` (light) |
| Canvas | Paper `#f5f3ee` | Near-black green `#060d09` (dark) / `#f1f7f3` (light) |
| Tokens | `colors`, `dark`, `radii`, … | `mobileDark`, `mobileLight`, `mobileRadii`, … |
| Photography | Real product images | Real image when present, generated gradient+emoji fallback |

The mobile scale is **forked**, not shared — changing it must not repaint web, and vice versa. This was a deliberate decision (`mobile-design-decisions` memory). Import the right scale for the surface you're on.

---

## Web palette (coral / paper)

- Ink `#0e0f11` · Paper `#f5f3ee` · Cream `#ede9e1`
- Accent coral `#e8472a` (`accentSoft #fde8e4`) · Gold `#c8973a` · Teal `#1a6b5a` (success/trust)
- Muted text `#6b6860` · Border `#d5d0c7`
- Utility classes in `apps/web/src/app/globals.css`: `.btn` `.btn-purple` (primary, ink→coral) `.btn-outline` (secondary) `.btn-sm` `.card` `.input` `.badge`. Muted text `text-gray`, error `text-coral`, headings `font-outfit`.

## Mobile palette (green)

**Dark (default):** bg `#060d09` · surface `#0b1610` · card `#0f1c13` · cardAlt `#152118` · accent `#3dcf7a` · text `#e8f5ec` · muted `rgba(232,245,236,.56)`.
**Light:** bg `#f1f7f3` · surface/card `#fff` · accent `#1b9456` · text `#0c1a10`.

Both themes ship because the app has a user-facing light/dark toggle (persisted). Read colours from `useTheme()` — never hardcode; the same component renders in both themes.

Fixed accents (both themes): star gold `#f59e0b` · sale red `#ef4444` · like `#f43f5e` · positive green `#22c55e`. CTA gradient = `accent → darker accent` (`ctaGradient()`); avatars use `avatarGradient()`; CTAs get a green glow (`glow()`).

### Product artwork (mobile) — hybrid since 2026-07-23

Originally the app shipped **no** photography (generated art only). That was reversed by user request: `ProductArt` (`apps/mobile/src/components/product-tile.tsx`) now renders the real uploaded image via `expo-image` when the product has one (`imageUrl` prop, fed from `thumbnail`/`images[0]`), and falls back to the generated artwork otherwise. Each product/category still carries a `hue` (0–359); the fallback renders an oklch-derived gradient with the category emoji floated at ~18% opacity over it (`oklchToHex` / `productTileStops` in `packages/tokens/src/mobile.ts`). Keep the gradient fallback — it is what keeps imageless and older listings coherent. Categories (no photos) always use the gradient art.

## Typography

| | Display / headings | Body | Prices/mono |
|---|---|---|---|
| Web | `Outfit` (`font-outfit`) | DM Sans | tabular-nums |
| Mobile | `Cormorant Garamond` (serif, `font.display`) | DM Sans (`font.body` / medium / semibold / bold) | tabular-nums |

Mobile fonts load via `@expo-google-fonts/*` + `useFonts`, held behind the splash screen until ready (a flash of system serif is the most visible way to get the look wrong).

## Scale & shape

- **Spacing**: 4pt rhythm — `spacing` token (`xs 4 … 3xl 48`).
- **Radii (mobile)**: `chip 10 · control 12 · input 14 · card 16 · tile 20 · hero 24 · pill 46 · full`.
- **Type sizes (mobile)**: `mobileFontSize` (`micro 9 … 4xl 30`).
- **Motion**: springs from tokens (`spring.press/entrance/surface`); press = scale not opacity; honour Reduce Motion (drop the animation, keep the interaction).

## Rules of thumb

- Import every colour, radius, spacing, and font from `@marketnest/tokens`. A raw hex in a component is a bug.
- Chrome (tab bar, sticky CTA bars) may use translucency/glass; content cards stay opaque.
- Decorative glyphs are hidden from screen readers; interactive elements carry `accessibilityRole`/`accessibilityLabel`.
- Match the mobile design source `MarketNest.dc.html` and the web reference in `MarketNest_UI_Designs.html`.
