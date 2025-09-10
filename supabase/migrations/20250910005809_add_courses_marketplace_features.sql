-- Add courses and marketplace features to the default features_config

-- Update the default value for features_config to include courses and marketplace
ALTER TABLE networks 
ALTER COLUMN features_config 
SET DEFAULT '{
  "chat": true, 
  "news": true, 
  "wiki": true, 
  "files": true, 
  "events": true, 
  "moodboards": true, 
  "notifications": true, 
  "location_sharing": false,
  "courses": false,
  "marketplace": false
}'::jsonb;

-- Update existing networks to include the new features (default to false)
UPDATE networks 
SET features_config = features_config || '{"courses": false, "marketplace": false}'::jsonb
WHERE NOT (features_config ? 'courses') OR NOT (features_config ? 'marketplace');

-- Update the column comment to reflect new features
COMMENT ON COLUMN networks.features_config IS 'JSON configuration for enabled/disabled network features (events, news, files, chat, wiki, moodboards, location_sharing, notifications, courses, marketplace)';