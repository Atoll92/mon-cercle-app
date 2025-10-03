-- Migration: Add Sympa Integration Support
-- Description: Adds fields and tables to support Sympa mailing list integration for RezoProSpec network

-- ============================================
-- 1. Create or update annonces_moderation table
-- ============================================

-- Create the annonces_moderation table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.annonces_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  subject TEXT,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('immobilier', 'ateliers', 'cours', 'materiel', 'echange', 'casting', 'annonces', 'dons')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Sympa integration fields to annonces_moderation table
ALTER TABLE public.annonces_moderation
ADD COLUMN IF NOT EXISTS sympa_ticket_id TEXT,
ADD COLUMN IF NOT EXISTS sympa_auth_token TEXT,
ADD COLUMN IF NOT EXISTS sympa_command TEXT,
ADD COLUMN IF NOT EXISTS synced_to_sympa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_email_date TIMESTAMPTZ;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_annonces_network_id ON public.annonces_moderation(network_id);
CREATE INDEX IF NOT EXISTS idx_annonces_status ON public.annonces_moderation(status);
CREATE INDEX IF NOT EXISTS idx_annonces_category ON public.annonces_moderation(category);
CREATE INDEX IF NOT EXISTS idx_annonces_created_at ON public.annonces_moderation(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annonces_sender_email ON public.annonces_moderation(sender_email);
CREATE INDEX IF NOT EXISTS idx_annonces_sympa_ticket ON public.annonces_moderation(sympa_ticket_id);
CREATE INDEX IF NOT EXISTS idx_annonces_synced ON public.annonces_moderation(synced_to_sympa);

-- Enable Row Level Security
ALTER TABLE public.annonces_moderation ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Network admins can view all annonces for their network
DROP POLICY IF EXISTS "Network admins can view annonces" ON public.annonces_moderation;
CREATE POLICY "Network admins can view annonces"
  ON public.annonces_moderation
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.network_id = annonces_moderation.network_id
        AND profiles.role = 'admin'
    )
  );

-- Network admins can insert annonces (for demo/testing purposes)
DROP POLICY IF EXISTS "Network admins can insert annonces" ON public.annonces_moderation;
CREATE POLICY "Network admins can insert annonces"
  ON public.annonces_moderation
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.network_id = annonces_moderation.network_id
        AND profiles.role = 'admin'
    )
  );

-- Network admins can update annonces (moderation actions)
DROP POLICY IF EXISTS "Network admins can update annonces" ON public.annonces_moderation;
CREATE POLICY "Network admins can update annonces"
  ON public.annonces_moderation
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.network_id = annonces_moderation.network_id
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.network_id = annonces_moderation.network_id
        AND profiles.role = 'admin'
    )
  );

-- Network admins can delete annonces
DROP POLICY IF EXISTS "Network admins can delete annonces" ON public.annonces_moderation;
CREATE POLICY "Network admins can delete annonces"
  ON public.annonces_moderation
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.network_id = annonces_moderation.network_id
        AND profiles.role = 'admin'
    )
  );

-- Service role can do anything (for Edge Functions)
DROP POLICY IF EXISTS "Service role full access to annonces" ON public.annonces_moderation;
CREATE POLICY "Service role full access to annonces"
  ON public.annonces_moderation
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_annonces_moderation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at column
DROP TRIGGER IF EXISTS update_annonces_moderation_timestamp ON public.annonces_moderation;
CREATE TRIGGER update_annonces_moderation_timestamp
  BEFORE UPDATE ON public.annonces_moderation
  FOR EACH ROW
  EXECUTE FUNCTION update_annonces_moderation_updated_at();

-- Add comments
COMMENT ON TABLE public.annonces_moderation IS 'Stores email-based annonces (classified ads) with moderation workflow for network communities';
COMMENT ON COLUMN public.annonces_moderation.category IS 'Category of the annonce: immobilier, ateliers, cours, materiel, echange, casting, annonces, dons';
COMMENT ON COLUMN public.annonces_moderation.status IS 'Moderation status: pending (default), approved, rejected';
COMMENT ON COLUMN public.annonces_moderation.sympa_ticket_id IS 'Sympa moderation ticket ID from email';
COMMENT ON COLUMN public.annonces_moderation.sympa_auth_token IS 'Authentication token from Sympa moderation email';
COMMENT ON COLUMN public.annonces_moderation.sympa_command IS 'Sympa command used for moderation (DISTRIBUTE or REJECT)';
COMMENT ON COLUMN public.annonces_moderation.synced_to_sympa IS 'Whether moderation action has been synced to Sympa';
COMMENT ON COLUMN public.annonces_moderation.original_email_date IS 'Original date from Sympa email';

-- ============================================
-- 2. Create sympa_subscription_queue table
-- ============================================

CREATE TABLE IF NOT EXISTS public.sympa_subscription_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'synced')),
  categories JSONB DEFAULT '["immobilier","ateliers","cours","materiel","echange","casting","annonces","dons"]'::jsonb,
  sympa_auth_token TEXT,
  motivation TEXT, -- User's motivation for joining (optional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  CONSTRAINT unique_profile_subscription UNIQUE(profile_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscription_queue_profile ON public.sympa_subscription_queue(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscription_queue_status ON public.sympa_subscription_queue(status);
CREATE INDEX IF NOT EXISTS idx_subscription_queue_email ON public.sympa_subscription_queue(email);

-- Enable RLS
ALTER TABLE public.sympa_subscription_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sympa_subscription_queue

-- Users can view their own subscription requests
DROP POLICY IF EXISTS "Users can view own subscription requests" ON public.sympa_subscription_queue;
CREATE POLICY "Users can view own subscription requests"
  ON public.sympa_subscription_queue
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can create their own subscription requests
DROP POLICY IF EXISTS "Users can create own subscription requests" ON public.sympa_subscription_queue;
CREATE POLICY "Users can create own subscription requests"
  ON public.sympa_subscription_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Network admins can view all subscription requests for their network
DROP POLICY IF EXISTS "Network admins can view subscription requests" ON public.sympa_subscription_queue;
CREATE POLICY "Network admins can view subscription requests"
  ON public.sympa_subscription_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p1.network_id = p2.network_id
      WHERE p1.user_id = auth.uid()
        AND p1.role = 'admin'
        AND p2.id = sympa_subscription_queue.profile_id
    )
  );

-- Network admins can update subscription requests (approve/reject)
DROP POLICY IF EXISTS "Network admins can update subscription requests" ON public.sympa_subscription_queue;
CREATE POLICY "Network admins can update subscription requests"
  ON public.sympa_subscription_queue
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p1.network_id = p2.network_id
      WHERE p1.user_id = auth.uid()
        AND p1.role = 'admin'
        AND p2.id = sympa_subscription_queue.profile_id
    )
  );

-- Service role can do anything (for Edge Functions)
DROP POLICY IF EXISTS "Service role full access to subscription queue" ON public.sympa_subscription_queue;
CREATE POLICY "Service role full access to subscription queue"
  ON public.sympa_subscription_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sympa_subscription_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sympa_subscription_queue_timestamp ON public.sympa_subscription_queue;
CREATE TRIGGER update_sympa_subscription_queue_timestamp
  BEFORE UPDATE ON public.sympa_subscription_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_sympa_subscription_queue_updated_at();

-- Add comments
COMMENT ON TABLE public.sympa_subscription_queue IS 'Queue for managing Sympa mailing list subscription requests';
COMMENT ON COLUMN public.sympa_subscription_queue.categories IS 'Array of annonce categories user wants to subscribe to';
COMMENT ON COLUMN public.sympa_subscription_queue.status IS 'Subscription request status: pending, approved, rejected, synced';

-- ============================================
-- 3. Update profiles table for category preferences
-- ============================================

-- Add annonces category preferences to profiles (for RezoProSpec network users)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS annonces_categories JSONB DEFAULT '["immobilier","ateliers","cours","materiel","echange","casting","annonces","dons"]'::jsonb;

-- Add index
CREATE INDEX IF NOT EXISTS idx_profiles_annonces_categories ON public.profiles USING GIN(annonces_categories);

COMMENT ON COLUMN public.profiles.annonces_categories IS 'Array of annonce categories user wants to receive notifications for (RezoProSpec network)';

-- ============================================
-- 4. Create helper function to check network membership
-- ============================================

CREATE OR REPLACE FUNCTION is_rezoprospec_network_member(user_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_profile_id
      AND network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_rezoprospec_network_member IS 'Check if a profile belongs to the RezoProSpec network';
