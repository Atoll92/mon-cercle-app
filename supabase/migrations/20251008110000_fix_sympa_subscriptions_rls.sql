-- Migration: Fix RLS policies for sympa_subscriptions
-- Description: Allow users to insert/update their own sympa_subscriptions and make trigger function run with elevated permissions
-- Date: 2025-10-08

-- Add INSERT policy for users to manage their own subscriptions
DROP POLICY IF EXISTS "Users can insert own sympa subscriptions" ON public.sympa_subscriptions;
CREATE POLICY "Users can insert own sympa subscriptions"
  ON public.sympa_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Add UPDATE policy for users to manage their own subscriptions
DROP POLICY IF EXISTS "Users can update own sympa subscriptions" ON public.sympa_subscriptions;
CREATE POLICY "Users can update own sympa subscriptions"
  ON public.sympa_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Add DELETE policy for users to manage their own subscriptions
DROP POLICY IF EXISTS "Users can delete own sympa subscriptions" ON public.sympa_subscriptions;
CREATE POLICY "Users can delete own sympa subscriptions"
  ON public.sympa_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Make the trigger function run with SECURITY DEFINER so it has elevated permissions
-- This is needed because the trigger inserts into sympa_subscriptions which requires permissions
CREATE OR REPLACE FUNCTION sync_profile_sympa_subscriptions()
RETURNS TRIGGER
SECURITY DEFINER -- Run with function owner's permissions (typically postgres/service role)
SET search_path = public -- Security best practice
AS $$
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

COMMENT ON POLICY "Users can insert own sympa subscriptions" ON public.sympa_subscriptions IS
  'Allow users to create subscriptions for their own profiles';
COMMENT ON POLICY "Users can update own sympa subscriptions" ON public.sympa_subscriptions IS
  'Allow users to update subscriptions for their own profiles';
COMMENT ON POLICY "Users can delete own sympa subscriptions" ON public.sympa_subscriptions IS
  'Allow users to delete subscriptions for their own profiles';
