-- Migration: Rename ateliers category to espaces_de_travail
-- Description: Updates the category from "ateliers" (courses/workshops) to "espaces_de_travail" (workspaces/offices)
-- Date: 2025-10-27

-- ============================================
-- 1. Drop existing constraint
-- ============================================

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS rezoprospec_categories_must_include_general;

-- ============================================
-- 2. Update validation function with new category name
-- ============================================

CREATE OR REPLACE FUNCTION validate_rezoprospec_categories(categories_json JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  category TEXT;
  valid_categories TEXT[] := ARRAY['general', 'logement', 'espaces_de_travail'];
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

COMMENT ON FUNCTION validate_rezoprospec_categories IS 'Validates that categories array contains "general" (mandatory) and only valid categories: general, logement, espaces_de_travail';

-- ============================================
-- 3. Migrate existing data in profiles table
-- ============================================

-- Replace "ateliers" with "espaces_de_travail" in existing profiles
UPDATE public.profiles
SET annonces_categories = (
  SELECT jsonb_agg(
    CASE
      WHEN category = 'ateliers' THEN 'espaces_de_travail'
      ELSE category
    END
  )
  FROM jsonb_array_elements_text(annonces_categories) AS category
)
WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  AND annonces_categories @> '"ateliers"'::jsonb;

-- ============================================
-- 4. Update default for new profiles
-- ============================================

ALTER TABLE public.profiles
ALTER COLUMN annonces_categories
SET DEFAULT '["general", "logement", "espaces_de_travail"]'::jsonb;

COMMENT ON COLUMN public.profiles.annonces_categories IS 'Array of annonce categories user wants to receive notifications for. RezoProSpec uses: general, logement, espaces_de_travail. Default: all 3 subscribed.';

-- ============================================
-- 5. Update init function for new members
-- ============================================

CREATE OR REPLACE FUNCTION init_rezoprospec_member_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for RezoProSpec network (b4e51e21-de8f-4f5b-b35d-f98f6df27508)
  IF NEW.network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid THEN
    -- Set all 3 categories as default subscription
    NEW.annonces_categories = '["general", "logement", "espaces_de_travail"]'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION init_rezoprospec_member_categories IS 'Automatically subscribes new RezoProSpec members to all 3 categories by default';

-- ============================================
-- 6. Re-add constraint with updated validation
-- ============================================

ALTER TABLE public.profiles
ADD CONSTRAINT rezoprospec_categories_must_include_general
CHECK (
  network_id != 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  OR validate_rezoprospec_categories(annonces_categories)
);

COMMENT ON CONSTRAINT rezoprospec_categories_must_include_general ON public.profiles IS 'Ensures RezoProSpec members always have "general" category (mandatory) and only valid categories';

-- ============================================
-- 7. Drop old constraint on annonces_moderation
-- ============================================

ALTER TABLE public.annonces_moderation
DROP CONSTRAINT IF EXISTS annonces_moderation_category_check;

-- ============================================
-- 8. Migrate existing data in annonces_moderation table
-- ============================================

-- Replace "ateliers" with "espaces_de_travail" in existing annonces
UPDATE public.annonces_moderation
SET category = 'espaces_de_travail'
WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  AND category = 'ateliers';

-- ============================================
-- 9. Add new constraint with updated category name
-- ============================================

ALTER TABLE public.annonces_moderation
ADD CONSTRAINT annonces_moderation_category_check
CHECK (
  network_id != 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  OR (category IS NOT NULL AND category IN ('general', 'logement', 'espaces_de_travail'))
);

COMMENT ON COLUMN public.annonces_moderation.category IS 'Category of the annonce for RezoProSpec: general (all announcements), logement (housing), espaces_de_travail (workspaces/offices)';

-- ============================================
-- 10. Update sympa_subscription_queue default
-- ============================================

ALTER TABLE public.sympa_subscription_queue
ALTER COLUMN categories
SET DEFAULT '["general", "logement", "espaces_de_travail"]'::jsonb;

COMMENT ON COLUMN public.sympa_subscription_queue.categories IS 'Array of annonce categories user wants to subscribe to. RezoProSpec uses: general, logement, espaces_de_travail';
