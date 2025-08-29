-- Add edited_at column to comments table for tracking comment edits
-- This column is NULL by default (unedited comments) and only gets a timestamp when edited
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Add index for edited comments (only indexes non-null values for efficiency)
CREATE INDEX IF NOT EXISTS idx_comments_edited 
ON comments(edited_at) 
WHERE edited_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN comments.edited_at IS 'Timestamp when the comment was last edited by the author. NULL if never edited.';