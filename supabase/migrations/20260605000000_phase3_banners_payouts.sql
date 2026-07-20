-- Phase 3: banners, featured listings, payout breakdown

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active_from TIMESTAMPTZ,
  active_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE featured_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id)
);

ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS net_amount DECIMAL(12, 2);
