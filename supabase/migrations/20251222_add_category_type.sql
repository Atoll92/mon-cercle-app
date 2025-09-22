-- Add type column to network_categories to distinguish between event, news, and portfolio categories
ALTER TABLE public.network_categories 
ADD COLUMN IF NOT EXISTS type varchar(20) DEFAULT 'general' NOT NULL,
ADD CONSTRAINT network_categories_type_check CHECK (type IN ('event', 'news', 'portfolio', 'general'));

-- Create index for efficient filtering by type
CREATE INDEX IF NOT EXISTS idx_network_categories_type ON public.network_categories(network_id, type);

-- Comment on the new column
COMMENT ON COLUMN public.network_categories.type IS 'Type of content this category is for: event, news, portfolio, or general (applies to all)';

-- Update existing categories to 'general' type (already set by default)
-- This ensures backward compatibility - existing categories will work for all content types