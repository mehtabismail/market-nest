# MarketNest architecture principles

Permanent reference for humans and AI. Align all work with **Architecture v2** and **User Stories v2**.

## 1. Performance at scale

| Principle | Implementation |
|-----------|----------------|
| Edge/CDN first | Next.js ISR, static assets on Vercel CDN |
| Cache hot reads | Redis: sessions 24h, guest cart 7d, catalogue 60s |
| Thin origin | API handles auth, mutations, personalised reads only |
| Async side effects | BullMQ for email, SMS, embeddings, exports |
| Efficient DB | Prisma + indexes; connection pooling; avoid SELECT * |

Target: sub-100ms cached pages globally; API p95 &lt; 200ms normal load.

## 2. Security & isolation

- Supabase RLS on every table
- NestJS RBAC guards on all protected routes
- Service role key **only** in API, never in browser
- Rate limits: 100/min general, 10/min auth, 5/min checkout (Redis)
- `BuyerProductDTO` strips seller fields before any buyer response

## 3. Domain model (v2)

**Product ownership**

| Type | `seller_id` | Buyer sees | Fulfilment | Payout |
|------|-------------|------------|------------|--------|
| seller_owned | seller | product only | seller | yes |
| platform_owned | NULL | Official badge | admin queue | no |
| seller_assigned | seller | product only | seller | yes |

**MarketNest Official**: seeded `sellers` row with `is_system = true`.

## 4. Monorepo conventions

- `packages/shared-types`: Zod/types; **buyer index must not export seller types**
- `packages/ui`: design tokens + shared components
- `packages/utils`: pure helpers (formatting, slugs)
- Import via `@marketnest/shared-types`, `@marketnest/ui`, `@marketnest/utils`

## 5. API design

- REST under `/api/v1`
- Swagger at `/api/docs`
- Consistent errors: `{ statusCode, message, error }`
- Idempotent webhooks (Stripe)
- Audit log for admin mutations (service role insert)

## 6. Frontend design

- Fonts: Syne (headings), DM Sans (body) — from UI HTML
- Portal accent: buyer=blue, seller=teal, admin=purple
- Server Components by default; client only for interactivity
- Buyer routes: zero seller UI components

## 7. Development phases

| Phase | Weeks | Focus |
|-------|-------|--------|
| 1 | 1–4 | Foundation (current) |
| 2 | 5–9 | Core commerce |
| 3 | 10–13 | Admin, notifications, payouts |
| 4 | 14–18 | AI search, hardening, beta |

## 8. Definition of done (feature)

- [ ] User story acceptance criteria met
- [ ] RLS/policy updated if schema touched
- [ ] Buyer anonymity preserved if buyer-facing
- [ ] `.env.example` updated
- [ ] Types exported from shared-types where applicable
- [ ] No secrets in code
