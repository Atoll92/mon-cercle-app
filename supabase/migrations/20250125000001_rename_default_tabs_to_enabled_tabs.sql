-- Rename default_tabs column to enabled_tabs for better clarity
-- Migration file: 20250125000001_rename_default_tabs_to_enabled_tabs.sql

-- Rename the column
ALTER TABLE public.networks RENAME COLUMN default_tabs TO enabled_tabs;

-- Update the comment to reflect the new name
COMMENT ON COLUMN public.networks.enabled_tabs IS 'JSON array of enabled navigation tabs to display';