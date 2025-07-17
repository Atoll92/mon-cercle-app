-- Add category_id to network_events table
ALTER TABLE network_events
ADD COLUMN category_id UUID REFERENCES network_categories(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_network_events_category_id ON network_events(category_id);

-- Add comment
COMMENT ON COLUMN network_events.category_id IS 'Optional category for organizing events';

-- Update RLS policies to include category_id in event queries
-- No changes needed to existing policies as they already allow viewing all columns