-- Add media support to messages, news, and portfolio items
-- Migration file: 20250526000000_add_media_support.sql

-- Add media fields to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_metadata jsonb DEFAULT '{}';

-- Add constraint for media type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_valid_media_type' 
    AND conrelid = 'public.messages'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.messages ADD CONSTRAINT messages_valid_media_type 
      CHECK (media_type IN (''image'', ''video'', ''audio'') OR media_type IS NULL)';
  END IF;
END$$;

-- Add media fields to network_news table (in addition to existing image_url)
ALTER TABLE public.network_news ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.network_news ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.network_news ADD COLUMN IF NOT EXISTS media_metadata jsonb DEFAULT '{}';

-- Add constraint for media type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'network_news_valid_media_type' 
    AND conrelid = 'public.network_news'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.network_news ADD CONSTRAINT network_news_valid_media_type 
      CHECK (media_type IN (''image'', ''video'', ''audio'') OR media_type IS NULL)';
  END IF;
END$$;

-- Add media fields to portfolio_items table
ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS media_metadata jsonb DEFAULT '{}';

-- Add constraint for media type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'portfolio_items_valid_media_type' 
    AND conrelid = 'public.portfolio_items'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.portfolio_items ADD CONSTRAINT portfolio_items_valid_media_type 
      CHECK (media_type IN (''image'', ''video'', ''audio'') OR media_type IS NULL)';
  END IF;
END$$;

-- Create media_uploads table for general media storage
CREATE TABLE IF NOT EXISTS public.media_uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  network_id uuid REFERENCES public.networks(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  url text NOT NULL,
  media_type text NOT NULL,
  file_name text,
  file_size bigint,
  mime_type text,
  duration float,
  dimensions jsonb, -- {width, height} for images/videos
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT valid_media_type CHECK (media_type IN ('image', 'video', 'audio'))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_messages_media_type ON public.messages(media_type) WHERE media_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_network_news_media_type ON public.network_news(media_type) WHERE media_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portfolio_items_media_type ON public.portfolio_items(media_type) WHERE media_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_uploads_network_id ON public.media_uploads(network_id);
CREATE INDEX IF NOT EXISTS idx_media_uploads_uploaded_by ON public.media_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_uploads_media_type ON public.media_uploads(media_type);

-- Add RLS policies for media_uploads
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view media in their network
CREATE POLICY "media_uploads_viewable_by_network_members" ON public.media_uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = media_uploads.network_id
    )
  );

-- Policy: Users can upload media to their network
CREATE POLICY "media_uploads_insertable_by_network_members" ON public.media_uploads
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = media_uploads.network_id
    )
  );

-- Policy: Users can delete their own uploads
CREATE POLICY "media_uploads_deletable_by_owner" ON public.media_uploads
  FOR DELETE USING (uploaded_by = auth.uid());

-- Add comments
COMMENT ON COLUMN public.messages.media_url IS 'URL of attached media (image, video, or audio)';
COMMENT ON COLUMN public.messages.media_type IS 'Type of media: image, video, or audio';
COMMENT ON COLUMN public.messages.media_metadata IS 'Additional metadata about the media (dimensions, duration, etc)';
COMMENT ON COLUMN public.network_news.media_url IS 'URL of attached media (in addition to image_url for backward compatibility)';
COMMENT ON COLUMN public.portfolio_items.media_url IS 'URL of attached media for portfolio showcase';
COMMENT ON TABLE public.media_uploads IS 'General media storage for network uploads';