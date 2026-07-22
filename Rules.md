# MarketNest — Rules for AI & contributors

> One of six context files. Read order: **[PRD](PRD.md) → [Architecture](Architecture.md) → [Rules](Rules.md) → [Phases](Phases.md) → [Design](Design.md) → [Memory](Memory.md)**.
>
> **This file is the anti-vibe-code contract. Follow it over your defaults.**

_Last updated: 2026-07-22._

---

## 0. Before you write any code

1. Read all six context files (order above). They override your assumptions.
2. Find the existing pattern before inventing one. This repo has established conventions for modules, DTOs, screens, and admin pages — match the nearest neighbour file.
3. State a short plan for anything non-trivial. Confirm scope on ambiguous or irreversible work.
4. In `apps/mobile`, **read the versioned Expo docs first** (`https://docs.expo.dev/versions/v57.0.0/`). SDK 57 differs from older ones — e.g. custom tab bars use the headless `expo-router/ui` API, and `@react-navigation/bottom-tabs` is not a direct dependency.

## 1. Do

- **Match the surrounding code**: naming, comment density, file structure, error handling. New code should be indistinguishable from what's there.
- **Type everything.** DTOs + `class-validator` on every API input; typed responses; typed component props.
- **Ship schema changes as a Supabase migration + RLS policy** in the same change. Regenerate Prisma client (`npm run db:generate`).
- **Run the gates before calling anything done**: `npm run typecheck`, `npm run lint`, `npm run test`. All must pass. Report failures honestly — never claim done on red.
- **Put async work (>200ms) on BullMQ** — email, embeddings, exports.
- **Keep money as `Decimal`** in the DB; convert at the DTO boundary; snapshot amounts that must not change retroactively (e.g. order discount).
- **Update `.env.example`** when adding an env var.
- **Write comments that explain *why*, not *what*** — the non-obvious decision, the invariant, the reason a simpler approach was rejected.

## 2. Avoid

- **Do not break seller anonymity.** Buyer/guest routes must never return `seller_id`, store name, slug, or contact. Never widen `buildBuyerListSelect`/`buildBuyerDetailSelect` to include the seller relation. Never import seller types into the buyer app. (See [PRD](PRD.md) §5.1.)
- **Do not add a dependency** (npm package, service, framework) without explicit approval. Prefer what's already installed.
- **Do not substitute the stack** — no swapping npm→pnpm, NestJS→Express, Supabase→other, Redis→Upstash, etc.
- **Do not touch the hosted database** (migrate, seed, alter, drop) without explicit user approval. `DATABASE_URL` points at a real Supabase project. When in doubt, print the SQL/commands and let the user run them.
- **Do not `git commit`, `push`, or open PRs** unless asked. Leave changes in the working tree.
- **Do not run destructive or outward-facing actions** (delete data, send email, publish) without confirmation.
- **No `any`, no `@ts-ignore`, no disabled lint rules** to make something compile. Fix the type.
- **No secrets in code or logs.** Never paste `.env` values, tokens, or connection strings into output.
- **Do not add photography to the mobile app.** It renders generated gradient+emoji artwork by design (see [Design](Design.md)).

## 3. Libraries & tools (use these, not alternatives)

- HTTP from apps: the `@marketnest/api-client` typed client (`apiFetch` / `api.request`), not raw `fetch` scattered around.
- Validation: `class-validator` + `class-transformer` (API). Forms on web/mobile validate before submit.
- Icons: web uses `lucide-react`; mobile uses the project's own SVG `Icon` set (`apps/mobile/src/components/icon.tsx`) — do not add an icon font.
- Design values: import from `@marketnest/tokens`. Never hardcode a hex or spacing value that a token already covers.
- State on mobile: React context for shared cross-screen state (auth, cart, wishlist, theme). Add a data-fetching library only when caching/invalidation genuinely warrants it — not preemptively.
- Dates/money: format at the edge; keep raw values (ISO strings, Decimals/numbers) in transit.

## 4. Error handling

- API: throw Nest `HttpException` subtypes (`BadRequestException`, `NotFoundException`, `ForbiddenException`) with **specific, actionable** messages. "That promo code has expired" beats "invalid code".
- Idempotency: make add/remove/toggle operations safe to repeat (upsert, `deleteMany`, conditional updates). A double-tap must not 500.
- Concurrency: guard limited resources with conditional writes (e.g. stock claim `where stockQty >= qty`; coupon redemption `where usedCount < usageLimit`), not check-then-write.
- Clients: surface API error messages (they're already end-user-safe); never blank the UI on a failed background read — keep last-good state and let the next action retry.
- Scope by owner: mutations use `where { id, userId }` / `updateMany`, so a guessed id can't touch someone else's row and a mismatch is a no-op, not a leak.

## 5. Boundaries for AI specifically

- **Stay in scope.** Fix what was asked. Flag adjacent issues; don't silently refactor them into the change.
- **Don't fabricate.** If a background task, test, or command hasn't finished, say so — never predict its result.
- **Verify before recommending.** If a memory or doc names a file/flag, confirm it still exists before acting on it.
- **Escalate genuine forks to the user** (a business rule vs the design conflicting, an irreversible action, a missing decision) — don't guess and bury it.
- **Keep [Memory.md](Memory.md) current** at the end of a work session: what you finished, what's mid-flight, what's deferred.
