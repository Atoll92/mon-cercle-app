-- Migration: Rename 'immobilier' category to 'logement'
-- Date: 2025-10-07
-- Description: Update the annonces_moderation table and user preferences to rename 'immobilier' to 'logement'

-- 1. Drop the old constraint FIRST (so we can update the data)
ALTER TABLE public.annonces_moderation
DROP CONSTRAINT IF EXISTS annonces_moderation_category_check;

-- 2. Update existing annonces that have 'immobilier' category
UPDATE public.annonces_moderation
SET category = 'logement'
WHERE category = 'immobilier';

-- 3. Add new constraint with 'logement' instead of 'immobilier'
ALTER TABLE public.annonces_moderation
ADD CONSTRAINT annonces_moderation_category_check
CHECK (category IN ('logement', 'ateliers', 'cours', 'materiel', 'echange', 'casting', 'annonces', 'dons'));

-- 4. Update the comment
COMMENT ON COLUMN public.annonces_moderation.category IS 'Category of the annonce: logement, ateliers, cours, materiel, echange, casting, annonces, dons';

-- 5. Update user notification preferences: replace 'immobilier' with 'logement' in annonces_categories array
UPDATE public.profiles
SET annonces_categories = (
  SELECT jsonb_agg(
    CASE
      WHEN elem::text = '"immobilier"' THEN '"logement"'::jsonb
      ELSE elem
    END
  )
  FROM jsonb_array_elements(annonces_categories) elem
)
WHERE annonces_categories @> '["immobilier"]'::jsonb;

-- 6. Update sympa_subscriptions table if it has category constraints
DO $$
BEGIN
  -- Check if sympa_subscriptions table exists and has a categories column
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'sympa_subscriptions'
    AND column_name = 'categories'
  ) THEN
    -- Update any existing subscriptions that include 'immobilier'
    UPDATE public.sympa_subscriptions
    SET categories = array_replace(categories, 'immobilier', 'logement')
    WHERE 'immobilier' = ANY(categories);
  END IF;
END $$;
