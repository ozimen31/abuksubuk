-- Add boosting fields to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS boosted_at timestamp with time zone;

-- Add boost tracking to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_boost_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS boost_count_today integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS boost_date date DEFAULT CURRENT_DATE;

-- Create function to reset daily boost count
CREATE OR REPLACE FUNCTION reset_daily_boost_count()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET boost_count_today = 0
  WHERE boost_date < CURRENT_DATE;
  
  UPDATE public.profiles
  SET boost_date = CURRENT_DATE
  WHERE boost_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;