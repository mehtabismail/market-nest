-- MarketNest seed data
-- Run AFTER creating super admin user in Supabase Auth (or use service role from API seed script)

-- MarketNest Official system seller (no auth user required until fulfilment UI needs it)
INSERT INTO sellers (
  id, user_id, store_name, store_slug, description,
  is_active, is_system, commission_rate, status,
  created_at, updated_at
)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  NULL,
  'MarketNest Official',
  'marketnest-official',
  'Platform-owned inventory',
  true,
  true,
  0,
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (store_slug) DO NOTHING;

-- Default categories (explicit ids — Prisma-created tables may lack uuid defaults)
INSERT INTO categories (id, name, slug, sort_order, is_active, created_at) VALUES
  ('00000000-0000-4000-8000-000000000101', 'Electronics', 'electronics', 1, true, NOW()),
  ('00000000-0000-4000-8000-000000000102', 'Fashion', 'fashion', 2, true, NOW()),
  ('00000000-0000-4000-8000-000000000103', 'Home & Garden', 'home-garden', 3, true, NOW())
ON CONFLICT (slug) DO NOTHING;
