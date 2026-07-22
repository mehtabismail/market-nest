# MarketNest — start here

**Before doing anything in this repo, read these six files in order. They are the source of truth and override your defaults. Do not "vibe code."**

1. [PRD.md](PRD.md) — what we're building, who for, the non-negotiable business rules
2. [Architecture.md](Architecture.md) — stack, folder structure, patterns, request lifecycle
3. [Rules.md](Rules.md) — do / avoid / libraries / error handling / boundaries for AI ← **the contract**
4. [Phases.md](Phases.md) — how to break work into phases + current status
5. [Design.md](Design.md) — the two design systems (web coral / mobile green), fonts, tokens
6. [Memory.md](Memory.md) — what's done, what's in progress, what's deferred ← **update this when you finish**

## The five things that most often go wrong here

1. **Seller anonymity** — buyer/guest routes never expose seller identity. See [Rules](Rules.md) §2 and [Architecture](Architecture.md) §3.
2. **Two design systems** — import the right token scale; web is coral, mobile is green. See [Design](Design.md).
3. **Hosted database** — never migrate or seed it without explicit approval. See [Rules](Rules.md) §2.
4. **Expo SDK 57** — read `docs.expo.dev/versions/v57.0.0/` before mobile work; the APIs differ from older SDKs.
5. **Gates** — `npm run typecheck && npm run lint && npm run test` must pass before anything is "done". Never claim done on red.

Nested `CLAUDE.md` / `AGENTS.md` files (e.g. `apps/mobile/AGENTS.md`) add area-specific rules — obey them too.
