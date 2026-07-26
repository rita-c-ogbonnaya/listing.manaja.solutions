DROP POLICY IF EXISTS "Anyone can upload popup images" ON storage.objects;
CREATE POLICY "Anyone can upload popup images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'popup-images');