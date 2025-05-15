-- Add network configuration columns to support onboarding wizard
-- Migration file: 20250517000000_add_network_configuration.sql

-- Privacy level column to store network privacy settings
ALTER TABLE public.networks ADD COLUMN IF NOT EXISTS privacy_level text DEFAULT 'private';

-- Purpose column to store the network type/purpose
ALTER TABLE public.networks ADD COLUMN IF NOT EXISTS purpose text DEFAULT 'general';

-- Theme color (added here if not already present)
ALTER TABLE public.networks ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#1976d2';

-- Features configuration as JSON (stores which features are enabled)
ALTER TABLE public.networks ADD COLUMN IF NOT EXISTS features_config jsonb DEFAULT '{"events": true, "news": true, "files": true, "chat": true, "wiki": true, "moodboards": true, "location_sharing": false, "notifications": true}';

-- Default tabs configuration as JSON array (stores the default navigation tabs)
ALTER TABLE public.networks ADD COLUMN IF NOT EXISTS default_tabs jsonb DEFAULT '["news", "members", "events", "chat", "files", "wiki"]';

-- Add constraints for enumerated fields
DO $$
BEGIN
  -- Check if constraint already exists before adding it
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_privacy_level' 
    AND conrelid = 'public.networks'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.networks ADD CONSTRAINT valid_privacy_level 
      CHECK (privacy_level IN (''public'', ''private'', ''restricted''))';
  END IF;
  
  -- Check if constraint already exists before adding it
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_purpose' 
    AND conrelid = 'public.networks'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.networks ADD CONSTRAINT valid_purpose
      CHECK (purpose IN (''general'', ''professional'', ''interest'', ''education'', ''nonprofit''))';
  END IF;
END$$;

-- Add indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_networks_privacy_level ON public.networks(privacy_level);
CREATE INDEX IF NOT EXISTS idx_networks_purpose ON public.networks(purpose);

-- Update any existing networks with default values if they have NULL values
UPDATE public.networks
SET 
  privacy_level = COALESCE(privacy_level, 'private'),
  purpose = COALESCE(purpose, 'general'),
  theme_color = COALESCE(theme_color, '#1976d2'),
  features_config = COALESCE(features_config, '{"events": true, "news": true, "files": true, "chat": true, "wiki": true, "moodboards": true, "location_sharing": false, "notifications": true}'),
  default_tabs = COALESCE(default_tabs, '["news", "members", "events", "chat", "files", "wiki"]')
WHERE 
  privacy_level IS NULL OR
  purpose IS NULL OR
  theme_color IS NULL OR
  features_config IS NULL OR
  default_tabs IS NULL;

-- Add comment to document the purpose of these columns
COMMENT ON COLUMN public.networks.privacy_level IS 'Network privacy setting: public, private, or restricted';
COMMENT ON COLUMN public.networks.purpose IS 'Network type/purpose: general, professional, interest, education, nonprofit';
COMMENT ON COLUMN public.networks.features_config IS 'JSON configuration for enabled/disabled network features';
COMMENT ON COLUMN public.networks.default_tabs IS 'JSON array of default navigation tabs to display';
COMMENT ON COLUMN public.networks.theme_color IS 'Primary theme color for the network';