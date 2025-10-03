-- Migration: Create annonces_moderation table
-- Description: Table for managing email-based annonces (classified ads) with moderation workflow

-- Create the annonces_moderation table
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

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_annonces_network_id ON public.annonces_moderation(network_id);
CREATE INDEX IF NOT EXISTS idx_annonces_status ON public.annonces_moderation(status);
CREATE INDEX IF NOT EXISTS idx_annonces_category ON public.annonces_moderation(category);
CREATE INDEX IF NOT EXISTS idx_annonces_created_at ON public.annonces_moderation(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annonces_sender_email ON public.annonces_moderation(sender_email);

-- Enable Row Level Security
ALTER TABLE public.annonces_moderation ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Network admins can view all annonces for their network
CREATE POLICY "Network admins can view annonces"
  ON public.annonces_moderation
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.network_id = annonces_moderation.network_id
        AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Network admins can insert annonces (for demo/testing purposes)
CREATE POLICY "Network admins can insert annonces"
  ON public.annonces_moderation
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.network_id = annonces_moderation.network_id
        AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Network admins can update annonces (moderation actions)
CREATE POLICY "Network admins can update annonces"
  ON public.annonces_moderation
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.network_id = annonces_moderation.network_id
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.network_id = annonces_moderation.network_id
        AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Network admins can delete annonces
CREATE POLICY "Network admins can delete annonces"
  ON public.annonces_moderation
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.network_id = annonces_moderation.network_id
        AND profiles.role = 'admin'
    )
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_annonces_moderation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at column
CREATE TRIGGER update_annonces_moderation_timestamp
  BEFORE UPDATE ON public.annonces_moderation
  FOR EACH ROW
  EXECUTE FUNCTION update_annonces_moderation_updated_at();

-- Add comment to table
COMMENT ON TABLE public.annonces_moderation IS 'Stores email-based annonces (classified ads) with moderation workflow for network communities';
COMMENT ON COLUMN public.annonces_moderation.category IS 'Category of the annonce: immobilier, ateliers, cours, materiel, echange, casting, annonces, dons';
COMMENT ON COLUMN public.annonces_moderation.status IS 'Moderation status: pending (default), approved, rejected';
