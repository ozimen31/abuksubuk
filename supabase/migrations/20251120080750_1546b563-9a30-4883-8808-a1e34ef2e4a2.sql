-- Add username change tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the field
COMMENT ON COLUMN public.profiles.username_changed_at IS 'Tracks when username was last changed. Users can only change username once.';

-- Update existing profiles with null username to use email prefix
UPDATE public.profiles 
SET username = split_part(
  (SELECT email FROM auth.users WHERE id = profiles.user_id), 
  '@', 
  1
)
WHERE username IS NULL OR username = user_id::text;

-- Make username required and unique
ALTER TABLE public.profiles 
ALTER COLUMN username SET NOT NULL;

-- Add unique constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;