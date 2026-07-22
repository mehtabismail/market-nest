-- MarketNest demo catalogue
--
-- Populates the exact eight products, eight categories, and eight brands the
-- mobile design was drawn against, so every screen renders with real rows
-- instead of placeholders. Re-runnable: every statement is ON CONFLICT guarded.
--
-- Run AFTER `seed.sql` and after `20260722000000_mobile_design_entities.sql`.
--
-- Deliberately separate from `seed.sql`: that file is the minimum a fresh
-- environment needs to boot (system seller, base categories). This one is
-- demo content, and you do not want it in a production database.

-- ── Categories ───────────────────────────────────────────────────────────────
-- `hue` and `emoji` drive the generated artwork on mobile, which ships no
-- photography.

INSERT INTO categories (id, name, slug, emoji, hue, sort_order, is_active, created_at) VALUES
  ('00000000-0000-4000-8000-000000000101', 'Electronics', 'electronics', '🎧', 220, 1, true, NOW()),
  ('00000000-0000-4000-8000-000000000102', 'Fashion',     'fashion',     '👜', 300, 2, true, NOW()),
  ('00000000-0000-4000-8000-000000000104', 'Beauty',      'beauty',      '✨', 340, 3, true, NOW()),
  ('00000000-0000-4000-8000-000000000105', 'Home',        'home',        '🏡',  90, 4, true, NOW()),
  ('00000000-0000-4000-8000-000000000106', 'Sports',      'sports',      '⚽', 145, 5, true, NOW()),
  ('00000000-0000-4000-8000-000000000107', 'Books',       'books',       '📚',  45, 6, true, NOW()),
  ('00000000-0000-4000-8000-000000000108', 'Toys',        'toys',        '🧸',  30, 7, true, NOW()),
  ('00000000-0000-4000-8000-000000000109', 'Gaming',      'gaming',      '🎮', 260, 8, true, NOW())
ON CONFLICT (slug) DO UPDATE
  SET emoji = EXCLUDED.emoji, hue = EXCLUDED.hue, sort_order = EXCLUDED.sort_order;

-- ── Brands ───────────────────────────────────────────────────────────────────

INSERT INTO brands (id, name, slug, sort_order, is_active, created_at) VALUES
  ('00000000-0000-4000-8000-000000000201', 'Sony',    'sony',    1, true, NOW()),
  ('00000000-0000-4000-8000-000000000202', 'Nothing', 'nothing', 2, true, NOW()),
  ('00000000-0000-4000-8000-000000000203', 'Apple',   'apple',   3, true, NOW()),
  ('00000000-0000-4000-8000-000000000204', 'Dyson',   'dyson',   4, true, NOW()),
  ('00000000-0000-4000-8000-000000000205', 'Aesop',   'aesop',   5, true, NOW()),
  ('00000000-0000-4000-8000-000000000206', 'Muji',    'muji',    6, true, NOW()),
  ('00000000-0000-4000-8000-000000000207', 'Le Labo', 'le-labo', 7, true, NOW()),
  ('00000000-0000-4000-8000-000000000208', 'Bellroy', 'bellroy', 8, true, NOW())
ON CONFLICT (slug) DO NOTHING;

-- ── Demo seller ──────────────────────────────────────────────────────────────
-- `user_id` stays NULL: this seller exists to own catalogue rows, and wiring it
-- to a real auth user is an environment-specific step.

INSERT INTO sellers (
  id, user_id, store_name, store_slug, description,
  is_active, is_system, commission_rate, status,
  rating_avg, sales_count, is_verified, created_at, updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000301',
  NULL,
  'TechMart',
  'techmart',
  'Demo seller account for the sample catalogue',
  true, false, 10, 'active',
  4.90, 12400, true, NOW(), NOW()
)
ON CONFLICT (store_slug) DO UPDATE
  SET rating_avg = EXCLUDED.rating_avg,
      sales_count = EXCLUDED.sales_count,
      is_verified = EXCLUDED.is_verified;

-- ── Products ─────────────────────────────────────────────────────────────────
-- The eight products from the design, with the hues that key their artwork.
-- Two carry a live flash-deal window so the countdown on the buyer home has
-- something to count down to.

INSERT INTO products (
  id, seller_id, owner_type, category_id, brand_id,
  title, description, price, compare_price, stock_qty, sku,
  images, status, hue, deal_starts_at, deal_ends_at, view_count,
  created_at, updated_at
) VALUES
  ('00000000-0000-4000-8000-000000000401',
   '00000000-0000-4000-8000-000000000301', 'seller_owned',
   '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201',
   'Sony WH-1000XM6',
   'Industry-leading noise cancellation with 30-hour battery life, Touch Sensor controls, and Speak-to-Chat technology.',
   349.00, 449.00, 42, 'SNY-WH1000XM6', '[]'::jsonb, 'published', 220,
   NOW(), NOW() + INTERVAL '4 hours', 1284, NOW(), NOW()),

  ('00000000-0000-4000-8000-000000000402',
   '00000000-0000-4000-8000-000000000301', 'seller_owned',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000208',
   'Arc Cognac Wallet',
   'Handcrafted from premium full-grain leather with RFID blocking. Slim profile holds 8+ cards.',
   89.00, NULL, 130, 'BLR-ARC-COG', '[]'::jsonb, 'published', 30,
   NULL, NULL, 402, NOW(), NOW()),

  ('00000000-0000-4000-8000-000000000403',
   '00000000-0000-4000-8000-000000000301', 'seller_owned',
   '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000204',
   'Dyson Zone Air',
   'The world''s first wearable air purifier with active noise cancellation. Filters 99.95% of particles.',
   549.00, 649.00, 18, 'DYS-ZONE-AIR', '[]'::jsonb, 'published', 200,
   NOW(), NOW() + INTERVAL '4 hours', 861, NOW(), NOW()),

  ('00000000-0000-4000-8000-000000000404',
   '00000000-0000-4000-8000-000000000301', 'seller_owned',
   '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000205',
   'Aesop Rosehip Oil',
   'Rich in omega fatty acids and antioxidants. Clinically tested for radiant, youthful skin.',
   65.00, NULL, 210, 'AES-ROSE-25', '[]'::jsonb, 'published', 340,
   NULL, NULL, 655, NOW(), NOW()),

  ('00000000-0000-4000-8000-000000000405',
   '00000000-0000-4000-8000-000000000301', 'seller_owned',
   '00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000206',
   'Muji Linen Throw',
   'Naturally soft Belgian linen with breathable open weave. Pre-washed for instant softness.',
   79.00, 95.00, 64, 'MUJ-LIN-THR', '[]'::jsonb, 'published', 90,
   NULL, NULL, 238, NOW(), NOW()),

  ('00000000-0000-4000-8000-000000000406',
   '00000000-0000-4000-8000-000000000301', 'seller_owned',
   '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000202',
   'Nothing Phone (3)',
   'The groundbreaking Nothing Phone 3 with the new Glyph Matrix interface and Snapdragon 8 Gen 3.',
   699.00, NULL, 27, 'NTH-PH3-8GB', '[]'::jsonb, 'published', 160,
   NULL, NULL, 1567, NOW(), NOW()),

  ('00000000-0000-4000-8000-000000000407',
   '00000000-0000-4000-8000-000000000301', 'seller_owned',
   '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000207',
   'Le Labo Santal 33',
   'The cult fragrance blending sandalwood, cedarwood, cardamom and iris absolute into an iconic scent.',
   210.00, NULL, 55, 'LLB-SAN33-100', '[]'::jsonb, 'published', 45,
   NULL, NULL, 934, NOW(), NOW()),

  ('00000000-0000-4000-8000-000000000408',
   '00000000-0000-4000-8000-000000000301', 'seller_owned',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000208',
   'Bellroy Slim Sleeve',
   'Minimalist card sleeve from premium recycled materials. Holds 4–8 cards plus folded notes.',
   49.00, NULL, 175, 'BLR-SLM-SLV', '[]'::jsonb, 'published', 160,
   NULL, NULL, 511, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET hue = EXCLUDED.hue,
      price = EXCLUDED.price,
      compare_price = EXCLUDED.compare_price,
      brand_id = EXCLUDED.brand_id,
      deal_starts_at = EXCLUDED.deal_starts_at,
      deal_ends_at = EXCLUDED.deal_ends_at,
      view_count = EXCLUDED.view_count,
      status = EXCLUDED.status;

-- ── Product variants ─────────────────────────────────────────────────────────
-- The design's colour swatch row on the product page.

INSERT INTO product_variants (id, product_id, name, options, price_delta, stock_qty, is_default, created_at) VALUES
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000401', 'Midnight Black', '{"color":"#1a1a1a"}'::jsonb, 0,  20, true,  NOW()),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000401', 'Platinum Silver', '{"color":"#e2e2e2"}'::jsonb, 0, 12, false, NOW()),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000401', 'Midnight Blue',  '{"color":"#1e3a5f"}'::jsonb, 10, 10, false, NOW()),
  ('00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000402', 'Tan',            '{"color":"#b0783c"}'::jsonb, 0,  80, true,  NOW()),
  ('00000000-0000-4000-8000-000000000505', '00000000-0000-4000-8000-000000000402', 'Forest',         '{"color":"#2d5a2d"}'::jsonb, 0,  50, false, NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Coupons ──────────────────────────────────────────────────────────────────
-- SAVE20 is the code the design shows applied in the cart.

INSERT INTO coupons (id, code, description, type, value, min_subtotal, max_discount, ends_at, usage_limit, is_active, created_at) VALUES
  ('00000000-0000-4000-8000-000000000601', 'SAVE20',    '20% off your order',      'percentage', 20, 100, 40,   NOW() + INTERVAL '30 days', 1000, true, NOW()),
  ('00000000-0000-4000-8000-000000000602', 'WELCOME10', '$10 off your first order','fixed',      10,  50, NULL, NOW() + INTERVAL '90 days', NULL, true, NOW()),
  ('00000000-0000-4000-8000-000000000603', 'FREESHIP',  'Free standard shipping',  'fixed',      10,  75, NULL, NOW() + INTERVAL '14 days',  500, true, NOW())
ON CONFLICT (code) DO NOTHING;

-- ── Banners ──────────────────────────────────────────────────────────────────

INSERT INTO banners (id, title, image_url, link_url, sort_order, is_active, created_at)
SELECT '00000000-0000-4000-8000-000000000701', 'Flash Deals — up to 25% off', '', '/shop?deals=1', 1, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM banners WHERE id = '00000000-0000-4000-8000-000000000701');

-- ── Featured listings ────────────────────────────────────────────────────────
-- Drives the "Curated For You" rail.

INSERT INTO featured_listings (id, product_id, sort_order, created_at)
SELECT '00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000406', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM featured_listings WHERE product_id = '00000000-0000-4000-8000-000000000406');

INSERT INTO featured_listings (id, product_id, sort_order, created_at)
SELECT '00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000407', 2, NOW()
WHERE NOT EXISTS (SELECT 1 FROM featured_listings WHERE product_id = '00000000-0000-4000-8000-000000000407');

-- ── Seller KYC ───────────────────────────────────────────────────────────────
-- An approved application, so the seller dashboard shows a verified state.

INSERT INTO seller_kyc (
  id, seller_id, status, completed_step, personal, business, documents, bank,
  submitted_at, reviewed_at, created_at, updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000901',
  '00000000-0000-4000-8000-000000000301',
  'approved', 5,
  '{"fullName":"Demo Seller","phone":"+1 555-0123","nationality":"US"}'::jsonb,
  '{"businessName":"TechMart LLC","businessType":"LLC","taxId":"12-3456789"}'::jsonb,
  '{"idFront":"kyc/demo/id-front.jpg","idBack":"kyc/demo/id-back.jpg","selfie":"kyc/demo/selfie.jpg"}'::jsonb,
  -- Masked on purpose: the seed must not model storing a real account number.
  '{"bankName":"Chase","accountHolder":"TechMart LLC","accountNumber":"••••4242"}'::jsonb,
  NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW(), NOW()
)
ON CONFLICT (seller_id) DO NOTHING;
