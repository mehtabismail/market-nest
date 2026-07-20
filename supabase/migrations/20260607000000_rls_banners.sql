-- Enable RLS and add policies for banners + featured listings
-- Bootstrap helper if initial_schema RLS section was skipped (e.g. Prisma db push)

-- Must match initial_schema (RETURNS user_role) — cannot change return type via CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS banners_public_read ON banners;
DROP POLICY IF EXISTS banners_service_role_write ON banners;
DROP POLICY IF EXISTS banners_admin_read ON banners;
DROP POLICY IF EXISTS banners_admin_write ON banners;

CREATE POLICY banners_public_read ON banners
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND (active_from IS NULL OR active_from <= NOW())
    AND (active_until IS NULL OR active_until >= NOW())
  );

CREATE POLICY banners_service_role_write ON banners
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY banners_admin_read ON banners
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'superadmin');

CREATE POLICY banners_admin_write ON banners
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'superadmin')
  WITH CHECK (public.current_user_role() = 'superadmin');

DROP POLICY IF EXISTS featured_listings_public_read ON featured_listings;
DROP POLICY IF EXISTS featured_listings_service_role_write ON featured_listings;
DROP POLICY IF EXISTS featured_listings_admin_read ON featured_listings;
DROP POLICY IF EXISTS featured_listings_admin_write ON featured_listings;

CREATE POLICY featured_listings_public_read ON featured_listings
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY featured_listings_service_role_write ON featured_listings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY featured_listings_admin_read ON featured_listings
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'superadmin');

CREATE POLICY featured_listings_admin_write ON featured_listings
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'superadmin')
  WITH CHECK (public.current_user_role() = 'superadmin');
