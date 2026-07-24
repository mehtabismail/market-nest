# MarketNest — Working memory

> One of six context files. Read order: **[PRD](PRD.md) → [Architecture](Architecture.md) → [Rules](Rules.md) → [Phases](Phases.md) → [Design](Design.md) → [Memory](Memory.md)**.
>
> **This is the running state of the project.** Update it at the end of every work session: what you finished, what's mid-flight, what's deferred. Keep it short and current — stale memory is worse than none.

_Last updated: 2026-07-24._

---

## Currently being worked on

- Nothing in-flight.

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
