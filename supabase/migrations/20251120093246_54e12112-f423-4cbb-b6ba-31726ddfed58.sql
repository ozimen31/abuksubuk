-- Fix search path for reset_daily_boost_count function
CREATE OR REPLACE FUNCTION reset_daily_boost_count()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET boost_count_today = 0
  WHERE boost_date < CURRENT_DATE;
  
  UPDATE public.profiles
  SET boost_date = CURRENT_DATE
  WHERE boost_date < CURRENT_DATE;
END;
$$;