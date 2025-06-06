-- Fix moodboard_items table to support PDF type
-- Migration: 20250606120000_fix_moodboard_items_pdf_support.sql

BEGIN;

-- Drop existing constraint if it exists
ALTER TABLE public.moodboard_items DROP CONSTRAINT IF EXISTS valid_type;
ALTER TABLE public.moodboard_items DROP CONSTRAINT IF EXISTS moodboard_items_valid_type;

-- Add or recreate the constraint with PDF support
ALTER TABLE public.moodboard_items ADD CONSTRAINT moodboard_items_valid_type 
  CHECK (type IN ('image', 'text', 'video', 'audio', 'pdf', 'link') OR type IS NULL);

-- Add thumbnail column for PDF previews if it doesn't exist
ALTER TABLE public.moodboard_items ADD COLUMN IF NOT EXISTS thumbnail text;

-- Add comment
COMMENT ON COLUMN public.moodboard_items.type IS 'Type of content: image, text, video, audio, pdf, or link';
COMMENT ON COLUMN public.moodboard_items.thumbnail IS 'Thumbnail URL for PDF and other media types';

COMMIT;