-- Migration: RezoProSpec Three Categories System
-- Description: Updates RezoProSpec to use 3 categories: general, logement, ateliers
-- Date: 2025-10-08

-- ============================================
-- 1. Drop old category constraints FIRST
-- ============================================

-- Drop the old category check constraint that only allows 8 categories
-- This constraint prevents us from using the new 'general' category
-- MUST be done before updating data!
ALTER TABLE public.annonces_moderation
DROP CONSTRAINT IF EXISTS annonces_moderation_category_check;

-- ============================================
-- 2. Migrate existing annonces_moderation data
-- ============================================

-- Migrate existing annonces to new 3-category system
-- This maps old 8 categories to new 3 categories:
-- - 'immobilier' or 'logement' -> 'logement'
-- - 'ateliers' -> 'ateliers'
-- - everything else (cours, materiel, echange, casting, annonces, dons) -> 'general'

-- IMPORTANT: Update ALL RezoProSpec network rows to ensure clean state
-- Also trim any whitespace and handle NULL values
-- CRITICAL: Store the trimmed value, not the comparison result
UPDATE public.annonces_moderation
SET category = TRIM(
  CASE
    WHEN TRIM(COALESCE(category, '')) IN ('immobilier', 'logement') THEN 'logement'
    WHEN TRIM(COALESCE(category, '')) = 'ateliers' THEN 'ateliers'
    ELSE 'general'
  END
)
WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid;

-- ============================================
-- 2. Update profiles default categories
-- ============================================

-- Change default for new profiles to 3 categories
ALTER TABLE public.profiles
ALTER COLUMN annonces_categories
SET DEFAULT '["general", "logement", "ateliers"]'::jsonb;

-- Update comment
COMMENT ON COLUMN public.profiles.annonces_categories IS 'Array of annonce categories user wants to receive notifications for. RezoProSpec uses: general, logement, ateliers. Default: all 3 subscribed.';

-- ============================================
-- 3. Create function to initialize RezoProSpec member categories
-- ============================================

CREATE OR REPLACE FUNCTION init_rezoprospec_member_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for RezoProSpec network (b4e51e21-de8f-4f5b-b35d-f98f6df27508)
  IF NEW.network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid THEN
    -- Set all 3 categories as default subscription
    NEW.annonces_categories = '["general", "logement", "ateliers"]'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-initialize categories for new RezoProSpec members
DROP TRIGGER IF EXISTS set_rezoprospec_categories ON public.profiles;
CREATE TRIGGER set_rezoprospec_categories
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION init_rezoprospec_member_categories();

COMMENT ON FUNCTION init_rezoprospec_member_categories IS 'Automatically subscribes new RezoProSpec members to all 3 categories by default';

-- ============================================
-- 4. Update existing RezoProSpec profiles
-- ============================================

-- Migrate existing RezoProSpec members to the new 3-category system
-- This maps old 8 categories to new 3 categories:
-- - 'immobilier' -> 'logement'
-- - 'ateliers' -> 'ateliers'
-- - everything else -> 'general'

UPDATE public.profiles
SET annonces_categories = (
  SELECT jsonb_agg(DISTINCT new_category)
  FROM jsonb_array_elements_text(annonces_categories) AS old_category,
  LATERAL (
    SELECT CASE
      WHEN old_category = 'immobilier' THEN 'logement'
      WHEN old_category = 'ateliers' THEN 'ateliers'
      ELSE 'general'
    END AS new_category
  ) mapping
)
WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  AND annonces_categories IS NOT NULL
  AND jsonb_array_length(annonces_categories) > 0;

-- For profiles with NULL or empty categories, set default
UPDATE public.profiles
SET annonces_categories = '["general", "logement", "ateliers"]'::jsonb
WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  AND (annonces_categories IS NULL OR jsonb_array_length(annonces_categories) = 0);

-- ============================================
-- 5. Update sympa_subscription_queue default
-- ============================================

-- Update default categories in subscription queue
ALTER TABLE public.sympa_subscription_queue
ALTER COLUMN categories
SET DEFAULT '["general", "logement", "ateliers"]'::jsonb;

COMMENT ON COLUMN public.sympa_subscription_queue.categories IS 'Array of annonce categories user wants to subscribe to. RezoProSpec uses: general, logement, ateliers';

-- ============================================
-- 6. Helper function to validate RezoProSpec categories
-- ============================================

CREATE OR REPLACE FUNCTION validate_rezoprospec_categories(categories_json JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  category TEXT;
  valid_categories TEXT[] := ARRAY['general', 'logement', 'ateliers'];
  has_general BOOLEAN := FALSE;
BEGIN
  -- Check if 'general' is present (mandatory)
  IF NOT (categories_json @> '"general"'::jsonb) THEN
    RETURN FALSE;
  END IF;

  -- Check if all categories in the array are valid
  FOR category IN SELECT jsonb_array_elements_text(categories_json)
  LOOP
    IF NOT (category = ANY(valid_categories)) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_rezoprospec_categories IS 'Validates that categories array contains "general" (mandatory) and only valid categories: general, logement, ateliers';

-- ============================================
-- 7. Add validation constraint to enforce 'general' is always present
-- ============================================

-- Enable constraint to ensure 'general' is always included
ALTER TABLE public.profiles
ADD CONSTRAINT rezoprospec_categories_must_include_general
CHECK (
  network_id != 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  OR validate_rezoprospec_categories(annonces_categories)
);

COMMENT ON CONSTRAINT rezoprospec_categories_must_include_general ON public.profiles IS 'Ensures RezoProSpec members always have "general" category (mandatory) and only valid categories';

-- ============================================
-- 8. Verify data before adding constraint
-- ============================================

-- Check if there are any rows that would violate the new constraint
DO $$
DECLARE
  invalid_count INTEGER;
  invalid_row RECORD;
BEGIN
  -- Count rows that would violate the constraint
  SELECT COUNT(*) INTO invalid_count
  FROM public.annonces_moderation
  WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  AND (category IS NULL OR category NOT IN ('general', 'logement', 'ateliers'));

  IF invalid_count > 0 THEN
    RAISE NOTICE 'Found % rows that would violate the new constraint:', invalid_count;

    -- Show details of invalid rows
    FOR invalid_row IN
      SELECT id, category, length(category) as len, category::bytea as bytes
      FROM public.annonces_moderation
      WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
      AND (category IS NULL OR category NOT IN ('general', 'logement', 'ateliers'))
      LIMIT 5
    LOOP
      RAISE NOTICE 'Invalid row - ID: %, Category: %, Length: %, Bytes: %',
        invalid_row.id, invalid_row.category, invalid_row.len, invalid_row.bytes;
    END LOOP;

    RAISE EXCEPTION 'Cannot add constraint: % invalid rows found', invalid_count;
  ELSE
    RAISE NOTICE 'All rows are valid. Proceeding to add constraint.';
  END IF;
END $$;

-- ============================================
-- 9. Add new category constraint after all data is migrated
-- ============================================

-- Add new constraint ONLY for RezoProSpec network
-- For other networks (if any), allow any category
-- NOTE: We don't use TRIM here because we ensure data is trimmed during migration
-- We add this at the END after all data migrations to avoid conflicts
ALTER TABLE public.annonces_moderation
ADD CONSTRAINT annonces_moderation_category_check
CHECK (
  network_id != 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  OR (category IS NOT NULL AND category IN ('general', 'logement', 'ateliers'))
);

-- Update comment
COMMENT ON COLUMN public.annonces_moderation.category IS 'Category of the annonce for RezoProSpec: general (all announcements), logement (housing), ateliers (workshops/studios)';
