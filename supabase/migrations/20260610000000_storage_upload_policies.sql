-- Storage upload policies for marketnest bucket (fixes RLS on POST /upload/image)

DROP POLICY IF EXISTS marketnest_service_role_all ON storage.objects;
CREATE POLICY marketnest_service_role_all ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'marketnest')
  WITH CHECK (bucket_id = 'marketnest');

DROP POLICY IF EXISTS marketnest_authenticated_insert ON storage.objects;
CREATE POLICY marketnest_authenticated_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketnest');

DROP POLICY IF EXISTS marketnest_authenticated_update ON storage.objects;
CREATE POLICY marketnest_authenticated_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'marketnest')
  WITH CHECK (bucket_id = 'marketnest');

DROP POLICY IF EXISTS marketnest_authenticated_delete ON storage.objects;
CREATE POLICY marketnest_authenticated_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'marketnest');
