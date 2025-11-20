-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;