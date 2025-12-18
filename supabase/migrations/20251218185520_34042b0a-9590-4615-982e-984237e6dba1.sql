
-- Create license_keys table
CREATE TABLE public.license_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_at TIMESTAMP WITH TIME ZONE,
  activated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check license keys (for validation)
CREATE POLICY "Anyone can check license keys"
ON public.license_keys
FOR SELECT
USING (true);

-- Only allow inserts/updates from edge functions (service role)
CREATE POLICY "Service role can manage license keys"
ON public.license_keys
FOR ALL
USING (auth.jwt() IS NULL);
