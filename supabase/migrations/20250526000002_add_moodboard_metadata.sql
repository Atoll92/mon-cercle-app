-- Add metadata column to moodboard_items table
-- Migration file: 20250526000002_add_moodboard_metadata.sql

-- Add metadata column to store additional information about media items
ALTER TABLE public.moodboard_items ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN public.moodboard_items.metadata IS 'Additional metadata for media items (fileName, fileSize, mimeType, duration, etc.)';