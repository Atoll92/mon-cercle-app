-- Add image support to the network_news table

-- Add image_url column for storing the URL to the uploaded image
ALTER TABLE public.network_news 
ADD COLUMN IF NOT EXISTS image_url text;

-- Add image_caption column for optional caption text
ALTER TABLE public.network_news 
ADD COLUMN IF NOT EXISTS image_caption text;

-- Add index on network_id for performance
CREATE INDEX IF NOT EXISTS network_news_network_id_idx ON public.network_news(network_id);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS network_news_created_at_idx ON public.network_news(created_at);

-- Announce completion
DO $$
BEGIN
  RAISE NOTICE 'Network news table updated with image support successfully!';
END $$;