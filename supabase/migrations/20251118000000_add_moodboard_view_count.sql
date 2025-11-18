-- Add view_count to moodboards table for tracking Micro Conclav page views
-- Date: 2025-11-18

-- Step 1: Add view_count column with default value 0
ALTER TABLE moodboards
ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Step 2: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_moodboards_view_count
ON moodboards(view_count DESC);

-- Step 3: Create function to increment view count
CREATE OR REPLACE FUNCTION increment_moodboard_view_count(moodboard_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE moodboards
  SET view_count = view_count + 1
  WHERE id = moodboard_uuid;
END;
$$;

-- Step 4: Add comment to document the column
COMMENT ON COLUMN moodboards.view_count IS 'Number of times the Micro Conclav page has been viewed';
