
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Service role can manage license keys" ON public.license_keys;

-- Allow anyone to insert license keys (page is password protected)
CREATE POLICY "Anyone can insert license keys"
ON public.license_keys
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update license keys (for activation)
CREATE POLICY "Anyone can update license keys"
ON public.license_keys
FOR UPDATE
USING (true);
