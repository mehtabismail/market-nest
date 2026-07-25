# MarketNest — Full Feature Inventory (Mobile ∪ Web)

> A single **deduplicated union** of every user-facing feature across the **mobile app** (`apps/mobile`) and the **web buyer + seller portals** (`apps/web`). Each feature is listed **once**. Use this as the checklist when rebuilding the web buyer/seller sides so nothing from mobile is missed.
>
> **Where** column: 📱 = in mobile only · 🖥️ = in web only · ✅ = in both · 🔒 = platform/backend rule (applies everywhere).
>
> _Admin console is intentionally excluded (out of scope — buyer + seller only)._
>
> _Generated 2026-07-24 from a code review of every screen + API endpoint on both platforms._

---

## Legend of the "gap" you're closing

Anything marked **📱 (mobile only)** is a feature the mobile app has that the **web does not yet have** — these are the priority items to build on web. Items marked 🖥️ already exist on web. ✅ exist on both (rebuild to parity).

---

## 1. Authentication & Session

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 1.1 | Email + password sign in | ✅ | Buyer/seller log in with email + password; portal-scoped. |
| 1.2 | Register / sign up | ✅ | Create an account with full name, email, password, and optional phone (phone is persisted to the profile). |
| 1.3 | Email-confirmation UX after signup | ✅ | "Check your inbox" state prompting the user to confirm before signing in. |
| 1.4 | Forgot password (request reset) | ✅ | Sends a password-reset email; shows a "check your email" confirmation. |
| 1.5 | Reset password (from email link) | 🖥️ | Dedicated page to set a new password from the emailed link. |
| 1.6 | Google OAuth sign-in | 🖥️ | "Continue with Google" via Supabase OAuth + callback. (Mobile shows "coming soon".) |
| 1.7 | Apple sign-in | — | Not built on either (shown as "coming soon" on mobile). Listed for completeness. |
| 1.8 | Guest browsing | ✅ | Browse catalogue with no account; sign-in only required at checkout. |
| 1.9 | Guest cart persistence + merge on login | ✅ | Guest cart survives sign-in and merges into the account cart. |
| 1.10 | Continue as guest | 📱 | Explicit "Continue as guest" action on the sign-in screen. |
| 1.11 | Sign out / logout | ✅ | Clears session (access + refresh) and revokes server-side. |
| 1.12 | Access + refresh token session w/ auto-refresh on 401 | 🔒 | Silent single-flight refresh, retries once, then logs out. |
| 1.13 | Seller admin-invite → password setup | 🖥️ | Invited sellers set their password via a dedicated link before KYC. |

---

## 2. Buyer — Home & Discovery

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 2.1 | Personalized greeting + wordmark header | 📱 | Time-of-day greeting ("Good morning") above the MarketNest wordmark. |
| 2.2 | Keyword product search | ✅ | Search products by title/description. |
| 2.3 | AI semantic search toggle | 🖥️ | Toggle to search by meaning (pgvector) vs. keyword. (Mobile search is keyword + trending only.) |
| 2.4 | Product filters (category, min/max price, sort) | ✅ | Filter sheet/controls; sort by newest / price asc / price desc. |
| 2.5 | Featured hero product | ✅ | A spotlighted product/banner at the top of home. |
| 2.6 | Category chips / browse by category | ✅ | Horizontal category selector that filters the grid. |
| 2.7 | Flash deals rail with **live countdown timer** | 📱 | Products with `dealEndsAt`, showing a real ticking countdown to the soonest deal expiry. |
| 2.8 | Trending Now rail/grid | 📱 | A curated "trending" selection. |
| 2.9 | Top Brands rail | 📱 | Horizontal brand chips; tapping searches that brand. |
| 2.10 | Curated For You rail | 📱 | Personalized recommendation rail. |
| 2.11 | Featured / All products grid | 🖥️ | "Featured this week" + "All products" grids on web home. |
| 2.12 | Promotional banner carousel | 🖥️ | Auto-playing "Latest deals" banner carousel (admin-managed banners). |
| 2.13 | Pull-to-refresh | 📱 | Swipe down to reload home data. |
| 2.14 | Product card with wishlist toggle | ✅ | Card showing image/art, price, discount, and a heart to save. |
| 2.15 | Trending searches / recent queries | 📱 | Suggested/trending search terms on the search screen. |
| 2.16 | Product artwork fallback (gradient + emoji) | 📱 | Generated gradient art with category emoji when a product has no photo. |

---

## 3. Buyer — Product Detail & Reviews

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 3.1 | Product detail page | ✅ | Full product view. |
| 3.2 | Image gallery (multi-image, thumbnails, zoom) | 🖥️ | Web PDP has a gallery with thumbnails + zoom; mobile shows a single hero image / generated art. |
| 3.3 | Variant selection (swatches / option chips) | ✅ | Color swatches or option chips with price delta and out-of-stock disabling. |
| 3.4 | Quantity stepper | ✅ | Increase/decrease quantity before adding to cart. |
| 3.5 | Price, compare-at price, discount % badge | ✅ | Shows sale price, struck-through original, and computed discount. |
| 3.6 | Average rating + review count | ✅ | Aggregate rating chip. |
| 3.7 | Reviews list | ✅ | Recent reviews with author, stars, relative date, body. |
| 3.8 | Write a review (eligibility-gated) | ✅ | CTA appears only when the buyer received the product (delivered + not yet reviewed). |
| 3.9 | Seller trust card (platform identity only) | ✅ | Shows "MarketNest Official / Marketplace" — never the real seller (anonymity). |
| 3.10 | Share product | 📱 | Native share sheet with a `marketnest://product/:id` deep link. |
| 3.11 | Add to cart / Buy now | ✅ | Add to cart, or add-and-go-straight-to-checkout. |
| 3.12 | Save to wishlist from PDP | ✅ | Heart toggle on the detail page. |
| 3.13 | Own-listing detection → Edit CTA | ✅ | If a signed-in seller views their own product, buy actions are replaced with "Your listing" + Edit. |
| 3.14 | Sticky purchase CTA bar | 📱 | Bottom action bar (wishlist + add + buy) pinned while scrolling. |

---

## 4. Buyer — Cart & Checkout

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 4.1 | Cart with line items | ✅ | List of items with image, title, price. |
| 4.2 | Edit quantity / remove item | ✅ | Steppers to change quantity; remove line. |
| 4.3 | Promo/coupon code apply + server validation | ✅ | Enter a code, validated server-side, discount reflected in totals. |
| 4.4 | Order summary (subtotal, shipping fee, discount, total) | ✅ | Itemized totals including the shared shipping fee. |
| 4.5 | Empty cart state | ✅ | "Your cart is empty" + Start Shopping CTA. |
| 4.6 | Multi-step checkout (Address → Payment → Done) | ✅ | Stepped flow with a progress indicator. |
| 4.7 | Saved address selection at checkout | ✅ | Pick from saved addresses. |
| 4.8 | Add new address during checkout | ✅ | Inline new-address entry. |
| 4.9 | Payment — Cash on Delivery | ✅ | COD option. |
| 4.10 | Payment — Card (Stripe) | 🖥️ | Real card payment via Stripe Elements + payment-intent. (Mobile: "coming soon".) |
| 4.11 | Payment — Apple Pay | — | Not built (coming soon). |
| 4.12 | Order confirmation / success screen | ✅ | Success state with "Track Order" + "Continue Shopping". |

---

## 5. Buyer — Orders & Tracking

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 5.1 | Order history list | ✅ | All past orders with status + total. |
| 5.2 | Order detail | ✅ | Line items, delivery address, payment, totals. |
| 5.3 | Status timeline / progress | ✅ | Visual progression (placed → confirmed → shipped → delivered). |
| 5.4 | Cancel order (pending states only) | ✅ | Cancel while `pending_cod` / `pending_payment`. |
| 5.5 | Reorder | 📱 | One-tap re-add a past order's items to the cart. |
| 5.6 | "Track Live" polling for shipped orders | 📱 | Auto-refreshes a shipped order's status; "Tracking active" indicator. |
| 5.7 | Cancelled / refunded badges | ✅ | Solid red/orange status badges. |

---

## 6. Buyer — Engagement (Wishlist, Rewards, Notifications, Assistant)

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 6.1 | Wishlist page (persisted) | 📱 | Dedicated saved-items screen backed by the wishlist API. **Web only has a non-persisted heart on cards — needs building.** |
| 6.2 | In-app notifications feed | ✅ | List of notifications; mark-one-read, mark-all-read. |
| 6.3 | Notification deep links | ✅ | Tapping a notification routes to the relevant order/product/KYC screen. |
| 6.4 | Rewards & Coupons list | 📱 | Screen listing available public coupons the buyer can use. **Not on web — needs building.** |
| 6.5 | AI shopping assistant chat | ✅ | Conversational assistant (`/assistant/chat`) with message history to find/compare products. |

---

## 7. Buyer — Profile, Addresses & Settings

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 7.1 | Profile edit (name, phone) | ✅ | Update display name and phone. |
| 7.2 | Address book CRUD | ✅ | Add / edit / delete addresses with label (Home/Office), default flag, full fields. |
| 7.3 | Account stats (orders / reviews / wishlist counts) | 📱 | Summary tiles on the account screen. |
| 7.4 | Light/Dark theme toggle (persisted) | 📱 | User-facing appearance switch, remembered across sessions. **Web is fixed-theme — a toggle would need adding if wanted.** |
| 7.5 | Settings — Legal (Terms, Privacy) | 📱 | Links to legal pages. |
| 7.6 | Settings — Delete account | 📱 | Account deletion entry point. |
| 7.7 | Settings — Contact support | 📱 | Support contact action. |
| 7.8 | "Start Selling" / become-a-seller CTA | ✅ | Prompt to upgrade a buyer into a seller (goes to KYC). |

---

## 8. Seller — Onboarding & KYC

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 8.1 | Self-serve seller onboarding | ✅ | A buyer becomes a seller (`POST /seller/onboarding`); role flips, blank KYC opens. |
| 8.2 | Admin-invite seller path | 🖥️ | Invited sellers auto-verify on KYC submit (`createdBy` set). |
| 8.3 | KYC wizard — 5 steps | ✅ | **Personal Info → Business Details → ID Verification → Bank Details → Review & Submit.** |
| 8.4 | KYC document upload | ✅ | ID front, ID back, and selfie-holding-ID uploads (mobile via base64; web via upload endpoint). |
| 8.5 | KYC resume (saved progress) | ✅ | Returns to the last saved step; per-step save. |
| 8.6 | KYC status states | ✅ | "Submitted for review" / "You are verified / store is live" / "Verification needs attention". |
| 8.7 | Listing gate until verified | 🔒 | Product listing is blocked until KYC `isVerified`. |

---

## 9. Seller — Dashboard & Analytics

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 9.1 | Seller dashboard stat cards | ✅ | Orders today, revenue (7d net), product count, active orders, low-stock count. |
| 9.2 | Revenue chart (last 7 days) | ✅ | Bar chart of daily net earnings. |
| 9.3 | Recent orders preview | ✅ | Latest orders with status + amount. |
| 9.4 | Quick actions grid | 📱 | Add product / My listings / Payouts / Support shortcuts. |
| 9.5 | Tabbed dashboard (Overview/Products/Orders/Payouts) | 📱 | In-dashboard tab switcher. |
| 9.6 | Analytics page (delivered-order metrics) | 🖥️ | Dedicated analytics view. |
| 9.7 | Commission rate display | ✅ | Shows the platform commission %. |

---

## 10. Seller — Products & Inventory

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 10.1 | My listings / products list | ✅ | All the seller's products with status/stock/price. |
| 10.2 | Add product | ✅ | Title, description, category, price, compare-at price, stock, SKU, photos. |
| 10.3 | Product photo upload (multiple) | ✅ | Upload one or more product images. |
| 10.4 | Product variants CRUD | ✅ | Add/edit/delete variants: name (e.g. Size), price delta, stock, SKU. |
| 10.5 | Save as draft / publish status | ✅ | Draft vs. published state. |
| 10.6 | Edit product | ✅ | Update any product field + variants. |
| 10.7 | Delete product | ✅ | Remove a listing (with confirmation). |
| 10.8 | Inventory / low-stock view | 🖥️ | Dedicated low-stock inventory page. (Mobile surfaces low-stock as a dashboard count.) |
| 10.9 | Own products excluded from buyer browse | 🔒 | A signed-in seller doesn't see their own listings as a buyer. |

---

## 11. Seller — Orders & Fulfilment

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 11.1 | Seller order queue | ✅ | All orders containing the seller's items, with buyer name. |
| 11.2 | Advance item status | ✅ | Move items through confirmed → processing → shipped → delivered. |
| 11.3 | Ship with courier + tracking number | ✅ | Mark shipped with courier/tracking → fires an "Order shipped" notification to the buyer. |
| 11.4 | Parent order status rollup | 🔒 | Buyer-facing order status is derived from the seller's item statuses. |
| 11.5 | Seller order detail | 🖥️ | Dedicated per-order detail page. |

---

## 12. Seller — Earnings & Payouts

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 12.1 | Earnings summary (gross / commission / net) | ✅ | Broken down by This Week / This Month / All-Time. |
| 12.2 | Daily earnings chart | ✅ | Chart of net earnings over time. |
| 12.3 | Payout history | ✅ | List of past payouts. |
| 12.4 | Manual payout ledger | 🔒 | Payouts are a recorded ledger (no automated transfers), currency USD. |

---

## 13. Cross-cutting / Platform rules

| # | Feature | Where | What it does |
|---|---------|-------|--------------|
| 13.1 | Seller anonymity | 🔒 | Buyers/guests never receive seller id, store name/slug, or contact — enforced by the buyer DTO. |
| 13.2 | Sellers retain buyer abilities | 🔒 | Sellers can still shop, cart, wishlist, review, and manage addresses. |
| 13.3 | Product ownership types | 🔒 | `seller_owned` / `platform_owned` / `seller_assigned`; only platform-owned shows "MarketNest Official". |
| 13.4 | Currency = USD | 🔒 | Prices display in USD across the build. |
| 13.5 | Skeleton loading states | ✅ | Shimmer/skeleton placeholders while data loads. |
| 13.6 | Empty / error / retry states | ✅ | Friendly empty states and retry on failed loads. |
| 13.7 | In-app notification bell (seller/admin web) | 🖥️ | Header bell with unread count on web portals. |
| 13.8 | Reduced-motion support | ✅ | Animations respect the OS reduce-motion setting. |

---

## Quick "build for web" gap list (📱 mobile-only → add to web)

These are the features the **mobile app has that the web currently lacks** — the concrete backlog for the web rebuild:

1. **Persisted Wishlist page** (6.1) — web only has a non-saving heart.
2. **Rewards & Coupons list** (6.4).
3. **Live flash-deal countdown timer** (2.7).
4. **Trending / Top Brands / Curated rails** (2.8–2.10) and **trending searches** (2.15).
5. **Reorder** (5.5) and **Track-Live polling** (5.6) on orders.
6. **Share product** deep link (3.10).
7. **Account stats tiles** (7.3), **Settings screen** — theme toggle, legal, delete account, support (7.4–7.7).
8. **Continue as guest** on sign-in (1.10).
9. **Seller quick-actions** (9.4) and **in-dashboard tabs** (9.5).
10. **Personalized greeting header** (2.1) and **pull-to-refresh** (2.13) — nice-to-haves.

_(And the reverse — features web has that mobile lacks — are card checkout (4.10), Google OAuth (1.6), semantic search (2.3), image gallery/zoom (3.2), and dedicated analytics/inventory/seller-order-detail pages (9.6, 10.8, 11.5). Keep these when rebuilding.)_
