
CREATE POLICY "Anyone can upload module images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'module-images');
CREATE POLICY "Anyone can update module images" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'module-images') WITH CHECK (bucket_id = 'module-images');
CREATE POLICY "Anyone can delete module images" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'module-images');

CREATE POLICY "Anyone can upload team images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'team-images');
CREATE POLICY "Anyone can update team images" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'team-images') WITH CHECK (bucket_id = 'team-images');
CREATE POLICY "Anyone can delete team images" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'team-images');

CREATE POLICY "Anyone can upload blog images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'blog-images');
CREATE POLICY "Anyone can update blog images" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'blog-images') WITH CHECK (bucket_id = 'blog-images');
CREATE POLICY "Anyone can delete blog images" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'blog-images');
