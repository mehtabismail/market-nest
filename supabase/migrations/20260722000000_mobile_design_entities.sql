-- Entities the mobile design depends on: brands, wishlist, coupons, in-app
-- notifications, seller KYC, plus the product/order/category columns that back
-- generated artwork, flash deals, and delivery estimates.

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('order_update', 'payout', 'kyc', 'promotion', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Brands ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS brands (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  logo_url   TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Category artwork ─────────────────────────────────────────────────────────

ALTER TABLE categories ADD COLUMN IF NOT EXISTS emoji TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS hue INTEGER NOT NULL DEFAULT 160;

-- ── Product artwork, brand, flash deals, views ───────────────────────────────

ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS hue INTEGER NOT NULL DEFAULT 160;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deal_starts_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deal_ends_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS products_brand_id_idx ON products (brand_id);
-- Partial: only products actually on a deal are ever scanned by this index, so
-- the vast majority of rows cost nothing to maintain.
CREATE INDEX IF NOT EXISTS products_deal_ends_at_idx
  ON products (deal_ends_at) WHERE deal_ends_at IS NOT NULL;

-- ── Order discounts and delivery estimates ───────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_from TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_to TIMESTAMPTZ;

-- ── Seller trust aggregates ──────────────────────────────────────────────────

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS sales_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Seller KYC ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seller_kyc (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        UUID NOT NULL UNIQUE REFERENCES sellers(id) ON DELETE CASCADE,
  status           kyc_status NOT NULL DEFAULT 'draft',
  completed_step   INTEGER NOT NULL DEFAULT 0,
  personal         JSONB NOT NULL DEFAULT '{}'::jsonb,
  business         JSONB NOT NULL DEFAULT '{}'::jsonb,
  documents        JSONB NOT NULL DEFAULT '{}'::jsonb,
  bank             JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at     TIMESTAMPTZ,
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_kyc_status_idx ON seller_kyc (status);

-- ── Wishlist ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wishlist_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlist_items_user_id_idx ON wishlist_items (user_id);

-- ── Coupons ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coupons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL UNIQUE,
  description  TEXT,
  type         coupon_type NOT NULL DEFAULT 'percentage',
  value        NUMERIC(12, 2) NOT NULL,
  min_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(12, 2),
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  usage_limit  INTEGER,
  used_count   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (code);

-- ── Notifications ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  type       notification_type NOT NULL DEFAULT 'system',
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite on (user_id, read_at): the unread badge count filters on both, and
-- the feed itself is always scoped to one user.
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications (user_id, read_at);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_kyc ENABLE ROW LEVEL SECURITY;

-- Brands are catalogue metadata: readable by anyone browsing the shop.
DROP POLICY IF EXISTS brands_public_read ON brands;
CREATE POLICY brands_public_read ON brands
  FOR SELECT TO anon, authenticated
  USING (is_active = TRUE);

-- Coupons are deliberately NOT publicly readable. Listing every active code
-- would let anyone enumerate and apply unpublished promotions; redemption goes
-- through the API, which validates a single code with the service role.
DROP POLICY IF EXISTS coupons_no_client_read ON coupons;

DROP POLICY IF EXISTS wishlist_own ON wishlist_items;
CREATE POLICY wishlist_own ON wishlist_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Recipients may mark their own notifications read, but never author one —
-- inserting is the API's job, so no INSERT policy exists here.
DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- A seller reads and drafts their own KYC. Approval transitions are made by the
-- API with the service role, which bypasses RLS, so no admin policy is needed
-- and `status` cannot be self-approved through the client.
DROP POLICY IF EXISTS seller_kyc_own ON seller_kyc;
CREATE POLICY seller_kyc_own ON seller_kyc
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_kyc.seller_id
        AND sellers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_kyc.seller_id
        AND sellers.user_id = auth.uid()
    )
  );
