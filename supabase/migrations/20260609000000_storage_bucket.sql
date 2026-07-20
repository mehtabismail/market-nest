-- Storage bucket for marketplace image uploads.
-- NOTE: The "marketnest" bucket must exist for /upload/image in the API.

INSERT INTO storage.buckets (id, name, public)
VALUES ('marketnest', 'marketnest', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS marketnest_public_read ON storage.objects;

CREATE POLICY marketnest_public_read ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'marketnest');

-- Backend uploads use SUPABASE_SERVICE_ROLE_KEY
DROP POLICY IF EXISTS marketnest_service_role_all ON storage.objects;
CREATE POLICY marketnest_service_role_all ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'marketnest')
  WITH CHECK (bucket_id = 'marketnest');
