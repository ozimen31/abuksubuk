-- Create storage policies for listings bucket

-- Allow public access to view images
CREATE POLICY "Public Access for Listings Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listings');

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);