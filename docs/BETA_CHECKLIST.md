# MarketNest beta launch checklist

Use before inviting real sellers/buyers.

## Your action items (required before testing)

These cannot be done by code alone — you must configure them in your dashboards:

1. **Apply all 8 SQL migrations** in Supabase SQL Editor (in order, `20260603000000` through `20260609000001`), then run `supabase/seed.sql`
2. **Fill root `.env`** — see `docs/ENV.md` and `.env.example`
3. **Create super admin** in Supabase Auth → Users, then SQL:
   ```sql
   INSERT INTO profiles (id, role, full_name) VALUES ('<auth-user-uuid>', 'superadmin', 'Admin');
   ```
4. **Redis (Upstash)** — set `REDIS_URL=rediss://...` (TLS required)
5. **Stripe (optional online payments)** — test keys + webhook pointing to `http://localhost:3001/api/v1/payments/webhook`
6. **Google OAuth (optional)** — configure **both** Google Cloud Console and Supabase:
   - **Google Cloud Console** → Credentials → your OAuth client:
     - Authorized JavaScript origins: `http://localhost:3000`
     - Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`  
       (for this project: `https://gmkqnkkbhdhhmyjtpaxg.supabase.co/auth/v1/callback`)
   - **Supabase** → Authentication → Providers → Google: enable, paste Client ID + Secret
   - **Supabase** → Authentication → URL Configuration:
     - Site URL: `http://localhost:3000`
     - Redirect URLs: `http://localhost:3000/shop/auth/callback`
   - `GOOGLE_CLIENT_*` in `.env` is optional; Supabase uses the values from its dashboard, not the API `.env`.
7. **OpenAI (optional AI search)** — set `OPENAI_API_KEY`, then `POST /admin/search/reindex` after products exist
8. **SendGrid (optional emails)** — set `SENDGRID_API_KEY` for order/suspension emails
9. **Storage bucket** — migration `20260609000000_storage_bucket.sql` creates `marketnest` bucket; verify in Supabase Storage dashboard

Then run:

```bash
npm run env:link
npm run dev
```

## Environment

- [ ] Root `.env` filled (Supabase, Redis `rediss://`, Stripe, optional OpenAI)
- [ ] All SQL migrations applied in Supabase (through `20260609000001_rls_remaining.sql`)
- [ ] `npm run db:push` and seed completed
- [ ] Super admin created in Supabase Auth + `profiles` row with `role = superadmin`

## Smoke tests

```bash
npm run dev
curl http://localhost:3001/api/v1/health
# Expect: database true, redis true
```

| Portal | URL | Test |
|--------|-----|------|
| Buyer | http://localhost:3000/shop | Browse, search, cart, checkout (COD + Stripe), orders, account |
| Seller | http://localhost:3000/seller/login | Products, orders, inventory, analytics, earnings |
| Admin | http://localhost:3000/admin/login | Users, revenue, featured, sellers, orders, fulfilment, products, banners, payouts, analytics, audit |

## Security

- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in API `.env` (never in web)
- [ ] RLS enabled on all tables (migrations)
- [ ] Rate limits active when Redis is up (100/min general, 10/min auth, 5/min checkout)
- [ ] Buyer API responses contain no seller fields (spot-check `/products`)

## AI search (optional)

- [ ] `OPENAI_API_KEY` set
- [ ] `POST /admin/search/reindex` run after products exist
- [ ] Semantic search: `/shop/search?q=...&semantic=true`
- [ ] AI Shop widget on `/shop`

## Payments

- [ ] Stripe test keys + webhook to `/api/v1/payments/webhook`
- [ ] COD checkout path tested end-to-end

## Performance

- [ ] Redis catalogue cache (categories, banners, featured — 60s TTL)
- [ ] ISR on shop home (`revalidate = 60`)
- [ ] Run `npm run bench:health` for baseline latency

## Deploy (when ready)

- [ ] Web ? Vercel (`apps/web`)
- [ ] API ? Railway/Render/Fly with `DATABASE_URL`, `REDIS_URL`, secrets
- [ ] Supabase production project + connection pooler URLs
- [ ] Custom domains: buyer / seller / admin subdomains
