
-- Add activated_ip column to track which IP activated the license
ALTER TABLE public.license_keys 
ADD COLUMN IF NOT EXISTS activated_ip TEXT;
