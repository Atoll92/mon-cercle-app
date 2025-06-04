-- Add created_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

-- Set default value for new records
ALTER TABLE public.profiles 
ALTER COLUMN created_at SET DEFAULT now();

-- Initialize existing records with today's date
UPDATE public.profiles 
SET created_at = now() 
WHERE created_at IS NULL;

-- Make the column NOT NULL after setting values
ALTER TABLE public.profiles 
ALTER COLUMN created_at SET NOT NULL;

-- Add an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at);

-- Add a comment for documentation
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when the profile was created';