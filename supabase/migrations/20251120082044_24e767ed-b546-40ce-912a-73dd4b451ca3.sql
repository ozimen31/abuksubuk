-- Add IP address tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS registration_ip inet,
ADD COLUMN IF NOT EXISTS last_login_ip inet,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Add index for IP lookups
CREATE INDEX IF NOT EXISTS idx_profiles_registration_ip ON public.profiles(registration_ip);

-- Create function to update last login info
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This will be called by the application when user logs in
  RETURN NEW;
END;
$$;

COMMENT ON COLUMN public.profiles.registration_ip IS 'IP address used during registration';
COMMENT ON COLUMN public.profiles.last_login_ip IS 'IP address of last login';
COMMENT ON COLUMN public.profiles.last_login_at IS 'Timestamp of last login';