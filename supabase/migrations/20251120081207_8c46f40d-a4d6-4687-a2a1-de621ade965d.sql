-- Update storage policies to allow avatar uploads in avatars folder

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Allow authenticated users to upload images to their own folder OR avatars folder
CREATE POLICY "Users can upload listings and avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR name LIKE 'avatars/%'
  )
);

-- Allow users to update their own images or their avatar
CREATE POLICY "Users can update listings and avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listings' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR name LIKE 'avatars/%'
  )
);

-- Allow users to delete their own images or their avatar
CREATE POLICY "Users can delete listings and avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listings' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR name LIKE 'avatars/%'
  )
);