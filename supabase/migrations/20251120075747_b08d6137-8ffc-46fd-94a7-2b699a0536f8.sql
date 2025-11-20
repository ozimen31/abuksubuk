-- Create banned_ips table for IP banning
CREATE TABLE IF NOT EXISTS public.banned_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  banned_by UUID REFERENCES auth.users(id),
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banned_users table for user banning
CREATE TABLE IF NOT EXISTS public.banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  reason TEXT,
  banned_by UUID REFERENCES auth.users(id),
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for banned_ips
CREATE POLICY "Admins can manage banned IPs"
ON public.banned_ips
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can check if IP is banned"
ON public.banned_ips
FOR SELECT
USING (true);

-- RLS policies for banned_users  
CREATE POLICY "Admins can manage banned users"
ON public.banned_users
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can check if they are banned"
ON public.banned_users
FOR SELECT
USING (true);

-- Add banned field to profiles for quick access
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.banned_users
    WHERE user_id = user_uuid
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = user_uuid
      AND is_banned = TRUE
  )
$$;

-- Create function to check if IP is banned
CREATE OR REPLACE FUNCTION public.is_ip_banned(ip TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.banned_ips
    WHERE ip_address = ip
      AND (expires_at IS NULL OR expires_at > NOW())
  )
$$;