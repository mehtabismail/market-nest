# Supabase setup (Phase 1)

## 1. Run migration

In Supabase **SQL Editor**, run in order:

1. `supabase/migrations/20260603000000_initial_schema.sql`
2. `supabase/seed.sql`

Or from `apps/api` after setting `DATABASE_URL` and `DIRECT_URL`:

```bash
npx prisma db push
npm run db:seed -w @marketnest/api
```

## 2. Create super admin

1. Supabase Dashboard ? **Authentication** ? **Users** ? **Add user**
   - Email: your admin email
   - Password: strong password
   - Copy the user UUID

2. SQL Editor:

```sql
INSERT INTO profiles (id, role, full_name)
VALUES ('YOUR-AUTH-USER-UUID', 'superadmin', 'Super Admin')
ON CONFLICT (id) DO UPDATE SET role = 'superadmin';
```

## 3. Environment (single root `.env`)

```bash
npm run env:setup
```

Edit the repo root `.env` (see `.env.example`). API and web load it automatically.

Minimum keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres
# Use Session pooler (5432), not db.[ref].supabase.co (often IPv6-only → Prisma P1001)
REDIS_URL=redis://...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Details: [ENV.md](./ENV.md)

## 4. Verify

```bash
npm run dev
curl http://localhost:3001/api/v1/health
```

Admin login: http://localhost:3000/admin/login
