-- Migration: Sympa Category-Specific Lists
-- Description: Implements separate Sympa lists for each category
-- Date: 2025-10-08

-- ============================================
-- 1. Create sympa_lists table to store list configuration
-- ============================================

CREATE TABLE IF NOT EXISTS public.sympa_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  list_name TEXT NOT NULL, -- e.g., 'rezoprospec-logement'
  list_email TEXT NOT NULL, -- e.g., 'rezoprospec-logement@lists.riseup.net'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(network_id, category),
  UNIQUE(list_email)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sympa_lists_network ON public.sympa_lists(network_id);
CREATE INDEX IF NOT EXISTS idx_sympa_lists_category ON public.sympa_lists(category);

-- Enable RLS
ALTER TABLE public.sympa_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view sympa lists" ON public.sympa_lists;
CREATE POLICY "Anyone can view sympa lists"
  ON public.sympa_lists
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Network admins can manage sympa lists" ON public.sympa_lists;
CREATE POLICY "Network admins can manage sympa lists"
  ON public.sympa_lists
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.network_id = sympa_lists.network_id
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role full access to sympa lists" ON public.sympa_lists;
CREATE POLICY "Service role full access to sympa lists"
  ON public.sympa_lists
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_sympa_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sympa_lists_timestamp ON public.sympa_lists;
CREATE TRIGGER update_sympa_lists_timestamp
  BEFORE UPDATE ON public.sympa_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_sympa_lists_updated_at();

COMMENT ON TABLE public.sympa_lists IS 'Configuration for Sympa mailing lists per category';
COMMENT ON COLUMN public.sympa_lists.category IS 'Category name (general, logement, ateliers)';
COMMENT ON COLUMN public.sympa_lists.list_name IS 'Sympa list name without domain (e.g., rezoprospec-logement)';
COMMENT ON COLUMN public.sympa_lists.list_email IS 'Full Sympa list email address';

-- ============================================
-- 2. Create sympa_subscriptions table to track member subscriptions
-- ============================================

CREATE TABLE IF NOT EXISTS public.sympa_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sympa_list_id UUID NOT NULL REFERENCES public.sympa_lists(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'subscribed', 'unsubscribed', 'error')),
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, sympa_list_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sympa_subscriptions_profile ON public.sympa_subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sympa_subscriptions_list ON public.sympa_subscriptions(sympa_list_id);
CREATE INDEX IF NOT EXISTS idx_sympa_subscriptions_status ON public.sympa_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sympa_subscriptions_email ON public.sympa_subscriptions(email);

-- Enable RLS
ALTER TABLE public.sympa_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own sympa subscriptions" ON public.sympa_subscriptions;
CREATE POLICY "Users can view own sympa subscriptions"
  ON public.sympa_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Network admins can view sympa subscriptions" ON public.sympa_subscriptions;
CREATE POLICY "Network admins can view sympa subscriptions"
  ON public.sympa_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p1.network_id = p2.network_id
      WHERE p1.user_id = auth.uid()
        AND p1.role = 'admin'
        AND p2.id = sympa_subscriptions.profile_id
    )
  );

DROP POLICY IF EXISTS "Service role full access to sympa subscriptions" ON public.sympa_subscriptions;
CREATE POLICY "Service role full access to sympa subscriptions"
  ON public.sympa_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_sympa_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sympa_subscriptions_timestamp ON public.sympa_subscriptions;
CREATE TRIGGER update_sympa_subscriptions_timestamp
  BEFORE UPDATE ON public.sympa_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_sympa_subscriptions_updated_at();

COMMENT ON TABLE public.sympa_subscriptions IS 'Tracks member subscriptions to Sympa lists with sync status';
COMMENT ON COLUMN public.sympa_subscriptions.status IS 'Subscription status: pending (not yet synced), subscribed (active), unsubscribed (removed), error (sync failed)';

-- ============================================
-- 3. Insert RezoProSpec list configuration
-- ============================================

-- Insert the 3 Sympa lists for RezoProSpec
-- Note: 'general' uses existing 'rezoprospec' list (no suffix)
INSERT INTO public.sympa_lists (network_id, category, list_name, list_email, description)
VALUES
  (
    'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid,
    'general',
    'rezoprospec',
    'rezoprospec@lists.riseup.net',
    'Liste générale pour toutes les annonces RezoProSpec (existing list)'
  ),
  (
    'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid,
    'logement',
    'rezoprospec-logement',
    'rezoprospec-logement@lists.riseup.net',
    'Annonces de logement (locations, ventes, colocations)'
  ),
  (
    'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid,
    'ateliers',
    'rezoprospec-ateliers',
    'rezoprospec-ateliers@lists.riseup.net',
    'Annonces d''ateliers et espaces de travail'
  )
ON CONFLICT (network_id, category) DO NOTHING;

-- ============================================
-- 4. Function to sync profile categories to sympa_subscriptions
-- ============================================

CREATE OR REPLACE FUNCTION sync_profile_sympa_subscriptions()
RETURNS TRIGGER AS $$
DECLARE
  v_category TEXT;
  list_record RECORD;
  profile_email TEXT;
BEGIN
  -- Only process RezoProSpec network
  IF NEW.network_id != 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid THEN
    RETURN NEW;
  END IF;

  -- Get profile email
  profile_email := COALESCE(NEW.contact_email, (
    SELECT email FROM auth.users WHERE id = NEW.user_id
  ));

  IF profile_email IS NULL THEN
    RAISE WARNING 'No email found for profile %', NEW.id;
    RETURN NEW;
  END IF;

  -- Iterate through each category in annonces_categories
  FOR v_category IN SELECT jsonb_array_elements_text(NEW.annonces_categories)
  LOOP
    -- Find the corresponding Sympa list
    SELECT * INTO list_record
    FROM public.sympa_lists
    WHERE network_id = NEW.network_id
      AND sympa_lists.category = v_category;

    IF FOUND THEN
      -- Insert or update subscription (mark as pending for sync)
      INSERT INTO public.sympa_subscriptions (
        profile_id,
        sympa_list_id,
        email,
        status
      )
      VALUES (
        NEW.id,
        list_record.id,
        profile_email,
        'pending'
      )
      ON CONFLICT (profile_id, sympa_list_id)
      DO UPDATE SET
        status = CASE
          WHEN sympa_subscriptions.status = 'unsubscribed' THEN 'pending'
          ELSE sympa_subscriptions.status
        END,
        email = profile_email,
        updated_at = NOW();
    END IF;
  END LOOP;

  -- Handle unsubscriptions (categories removed from annonces_categories)
  -- IMPORTANT: Never unsubscribe from 'general' category (it's mandatory)
  UPDATE public.sympa_subscriptions ss
  SET
    status = 'unsubscribed',
    updated_at = NOW()
  WHERE ss.profile_id = NEW.id
    AND ss.status != 'unsubscribed'
    AND NOT EXISTS (
      SELECT 1
      FROM public.sympa_lists sl
      WHERE sl.id = ss.sympa_list_id
        AND sl.category = ANY(
          SELECT jsonb_array_elements_text(NEW.annonces_categories)
        )
    )
    -- Never unsubscribe from 'general' category
    AND NOT EXISTS (
      SELECT 1
      FROM public.sympa_lists sl
      WHERE sl.id = ss.sympa_list_id
        AND sl.category = 'general'
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-sync subscriptions when profile categories change
DROP TRIGGER IF EXISTS sync_sympa_on_profile_change ON public.profiles;
CREATE TRIGGER sync_sympa_on_profile_change
  AFTER INSERT OR UPDATE OF annonces_categories ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_sympa_subscriptions();

COMMENT ON FUNCTION sync_profile_sympa_subscriptions IS 'Automatically syncs profile category preferences to sympa_subscriptions table';

-- ============================================
-- 5. Helper function to get Sympa list for category
-- ============================================

CREATE OR REPLACE FUNCTION get_sympa_list_for_category(
  p_network_id UUID,
  p_category TEXT
)
RETURNS TABLE (
  id UUID,
  list_name TEXT,
  list_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sympa_lists.id,
    sympa_lists.list_name,
    sympa_lists.list_email
  FROM public.sympa_lists
  WHERE sympa_lists.network_id = p_network_id
    AND sympa_lists.category = p_category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_sympa_list_for_category IS 'Get Sympa list configuration for a specific category';

-- ============================================
-- 6. Helper function for manual sync (create BEFORE using it)
-- ============================================

CREATE OR REPLACE FUNCTION sync_profile_sympa_subscriptions_helper(
  p_profile_id UUID,
  p_network_id UUID,
  p_contact_email TEXT,
  p_user_id UUID,
  p_categories JSONB
)
RETURNS VOID AS $$
DECLARE
  v_category TEXT;
  list_record RECORD;
  profile_email TEXT;
BEGIN
  -- Get profile email
  profile_email := COALESCE(p_contact_email, (
    SELECT email FROM auth.users WHERE id = p_user_id
  ));

  IF profile_email IS NULL THEN
    RETURN;
  END IF;

  -- Iterate through each category
  FOR v_category IN SELECT jsonb_array_elements_text(p_categories)
  LOOP
    SELECT * INTO list_record
    FROM public.sympa_lists
    WHERE network_id = p_network_id
      AND sympa_lists.category = v_category;

    IF FOUND THEN
      INSERT INTO public.sympa_subscriptions (
        profile_id,
        sympa_list_id,
        email,
        status
      )
      VALUES (
        p_profile_id,
        list_record.id,
        profile_email,
        'pending'
      )
      ON CONFLICT (profile_id, sympa_list_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_profile_sympa_subscriptions_helper IS 'Helper function to manually sync profile categories to sympa_subscriptions';

-- ============================================
-- 7. Initialize subscriptions for existing RezoProSpec members
-- ============================================

-- This will create subscription records for all existing members
-- based on their current annonces_categories preferences
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN
    SELECT id, network_id, contact_email, user_id, annonces_categories
    FROM public.profiles
    WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  LOOP
    -- Trigger the sync function manually for existing profiles
    PERFORM sync_profile_sympa_subscriptions_helper(
      profile_record.id,
      profile_record.network_id,
      profile_record.contact_email,
      profile_record.user_id,
      profile_record.annonces_categories
    );
  END LOOP;
END $$;
