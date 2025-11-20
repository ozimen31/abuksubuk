-- Function to update seller score based on reviews
CREATE OR REPLACE FUNCTION public.update_seller_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Calculate average rating for the reviewed user
  UPDATE public.profiles
  SET seller_score = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.reviews
    WHERE reviewed_user_id = NEW.reviewed_user_id
  )
  WHERE user_id = NEW.reviewed_user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update seller score after insert
CREATE TRIGGER update_seller_score_after_review
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_seller_score();