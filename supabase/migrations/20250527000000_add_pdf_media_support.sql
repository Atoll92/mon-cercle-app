-- Add media support with PDF to messages, news, portfolio items, and direct messages
-- Migration file: 20250527000000_add_pdf_media_support.sql

-- Add media fields to messages table if they don't exist
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_metadata jsonb DEFAULT '{}';

-- Add media fields to network_news table if they don't exist
ALTER TABLE public.network_news ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.network_news ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.network_news ADD COLUMN IF NOT EXISTS media_metadata jsonb DEFAULT '{}';

-- Add media fields to portfolio_items table if they don't exist
ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS media_metadata jsonb DEFAULT '{}';

-- Add media fields to direct_messages table if they don't exist
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS media_metadata jsonb DEFAULT '{}';

-- Drop existing constraints if they exist
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_valid_media_type;
ALTER TABLE public.network_news DROP CONSTRAINT IF EXISTS network_news_valid_media_type;
ALTER TABLE public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_valid_media_type;
ALTER TABLE public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_valid_media_type;

-- Add constraints with PDF support
ALTER TABLE public.messages ADD CONSTRAINT messages_valid_media_type 
  CHECK (media_type IN ('image', 'video', 'audio', 'pdf') OR media_type IS NULL);

ALTER TABLE public.network_news ADD CONSTRAINT network_news_valid_media_type 
  CHECK (media_type IN ('image', 'video', 'audio', 'pdf') OR media_type IS NULL);

ALTER TABLE public.portfolio_items ADD CONSTRAINT portfolio_items_valid_media_type 
  CHECK (media_type IN ('image', 'video', 'audio', 'pdf') OR media_type IS NULL);

ALTER TABLE public.direct_messages ADD CONSTRAINT direct_messages_valid_media_type 
  CHECK (media_type IN ('image', 'video', 'audio', 'pdf') OR media_type IS NULL);

-- Add comments to document the columns
COMMENT ON COLUMN public.network_news.media_type IS 'Type of media attached: image, video, audio, or pdf';
COMMENT ON COLUMN public.messages.media_type IS 'Type of media attached: image, video, audio, or pdf';
COMMENT ON COLUMN public.portfolio_items.media_type IS 'Type of media attached: image, video, audio, or pdf';
COMMENT ON COLUMN public.direct_messages.media_type IS 'Type of media attached: image, video, audio, or pdf';

-- Create media_uploads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.media_uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  network_id uuid REFERENCES public.networks(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'pdf')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for media_uploads if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'media_uploads' AND policyname = 'Users can view their own uploads'
  ) THEN
    CREATE POLICY "Users can view their own uploads" ON public.media_uploads
      FOR SELECT USING (auth.uid() = uploaded_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'media_uploads' AND policyname = 'Users can upload media'
  ) THEN
    CREATE POLICY "Users can upload media" ON public.media_uploads
      FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'media_uploads' AND policyname = 'Users can delete their own uploads'
  ) THEN
    CREATE POLICY "Users can delete their own uploads" ON public.media_uploads
      FOR DELETE USING (auth.uid() = uploaded_by);
  END IF;
END$$;

-- Enable RLS on media_uploads
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;