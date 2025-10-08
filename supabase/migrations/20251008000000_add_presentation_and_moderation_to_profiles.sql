-- Add presentation and moderation_status columns to profiles table

-- Add presentation column for user self-description
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS presentation text;

-- Add moderation_status column for profile approval workflow
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- Create an index on moderation_status for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_moderation_status
ON public.profiles(moderation_status);

-- Add comment to explain the columns
COMMENT ON COLUMN public.profiles.presentation IS 'User presentation describing their professional links with arts and culture and their motivation to join the group';
COMMENT ON COLUMN public.profiles.moderation_status IS 'Status of profile moderation: pending (waiting for admin approval), approved, or rejected';