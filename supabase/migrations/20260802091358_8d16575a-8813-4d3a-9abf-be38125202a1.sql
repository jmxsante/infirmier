CREATE POLICY "dossiers_lecture_cabinet" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dossiers'
     AND (storage.foldername(name))[1] = public.current_cabinet_id()::text);

CREATE POLICY "dossiers_depot_cabinet" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dossiers'
     AND (storage.foldername(name))[1] = public.current_cabinet_id()::text);

CREATE POLICY "dossiers_maj_cabinet" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'dossiers'
     AND (storage.foldername(name))[1] = public.current_cabinet_id()::text)
  WITH CHECK (bucket_id = 'dossiers'
     AND (storage.foldername(name))[1] = public.current_cabinet_id()::text);

CREATE POLICY "dossiers_suppression_cabinet" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dossiers'
     AND (storage.foldername(name))[1] = public.current_cabinet_id()::text);