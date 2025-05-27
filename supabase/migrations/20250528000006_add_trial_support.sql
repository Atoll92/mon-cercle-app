-- Add free trial support to networks
-- Migration file: 20250528000006_add_trial_support.sql

-- Add trial-related fields to networks table
ALTER TABLE public.networks ADD COLUMN IF NOT EXISTS trial_start_date timestamp with time zone;
ALTER TABLE public.networks ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone;
ALTER TABLE public.networks ADD COLUMN IF NOT EXISTS is_trial boolean DEFAULT false;
ALTER TABLE public.networks ADD COLUMN IF NOT EXISTS trial_days_used integer DEFAULT 0;

-- Update existing networks to set trial information for free/family plans
UPDATE public.networks 
SET 
  is_trial = true,
  trial_start_date = created_at,
  trial_end_date = created_at + INTERVAL '14 days',
  trial_days_used = GREATEST(0, LEAST(14, EXTRACT(DAY FROM (NOW() - created_at))))
WHERE 
  (subscription_plan IS NULL OR subscription_plan IN ('free', 'family', 'community'))
  AND subscription_status != 'active'
  AND trial_start_date IS NULL;

-- Create function to check if trial is expired
CREATE OR REPLACE FUNCTION is_trial_expired(network_id uuid)
RETURNS boolean AS $$
DECLARE
  trial_end timestamp with time zone;
  is_trial_network boolean;
BEGIN
  SELECT trial_end_date, is_trial
  INTO trial_end, is_trial_network
  FROM public.networks
  WHERE id = network_id;
  
  -- If not a trial network, it's not expired
  IF NOT is_trial_network THEN
    RETURN false;
  END IF;
  
  -- If no trial end date, consider it expired for safety
  IF trial_end IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if trial has expired
  RETURN NOW() > trial_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to get trial days remaining
CREATE OR REPLACE FUNCTION get_trial_days_remaining(network_id uuid)
RETURNS integer AS $$
DECLARE
  trial_end timestamp with time zone;
  is_trial_network boolean;
  days_remaining integer;
BEGIN
  SELECT trial_end_date, is_trial
  INTO trial_end, is_trial_network
  FROM public.networks
  WHERE id = network_id;
  
  -- If not a trial network, return 0
  IF NOT is_trial_network THEN
    RETURN 0;
  END IF;
  
  -- If no trial end date, return 0
  IF trial_end IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate days remaining
  days_remaining := CEIL(EXTRACT(EPOCH FROM (trial_end - NOW())) / 86400);
  
  -- Return 0 if negative (expired)
  RETURN GREATEST(0, days_remaining);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to update trial days used (can be called periodically)
CREATE OR REPLACE FUNCTION update_trial_days_used()
RETURNS void AS $$
BEGIN
  UPDATE public.networks
  SET trial_days_used = GREATEST(0, LEAST(14, EXTRACT(DAY FROM (NOW() - trial_start_date))))
  WHERE is_trial = true
    AND trial_start_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_networks_trial_status ON public.networks(is_trial, trial_end_date);
CREATE INDEX IF NOT EXISTS idx_networks_trial_expired ON public.networks(trial_end_date) WHERE is_trial = true;

-- Create trigger function to setup new networks with trial and default data
CREATE OR REPLACE FUNCTION setup_new_network()
RETURNS trigger AS $$
BEGIN
  -- Set up trial information for all new networks by default
  NEW.is_trial := true;
  NEW.trial_start_date := NOW();
  NEW.trial_end_date := NOW() + INTERVAL '14 days';
  NEW.trial_days_used := 0;
  NEW.subscription_plan := null; -- Start with no plan (free trial)
  NEW.subscription_status := 'trial';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new network setup
DROP TRIGGER IF EXISTS trigger_setup_new_network ON public.networks;
CREATE TRIGGER trigger_setup_new_network
  BEFORE INSERT ON public.networks
  FOR EACH ROW
  EXECUTE FUNCTION setup_new_network();

-- Add comments
COMMENT ON COLUMN public.networks.trial_start_date IS 'When the 14-day free trial started';
COMMENT ON COLUMN public.networks.trial_end_date IS 'When the 14-day free trial ends';
COMMENT ON COLUMN public.networks.is_trial IS 'Whether this network is currently on a trial';
COMMENT ON COLUMN public.networks.trial_days_used IS 'Number of trial days used (0-14)';

COMMENT ON FUNCTION is_trial_expired(uuid) IS 'Check if a network trial has expired';
COMMENT ON FUNCTION get_trial_days_remaining(uuid) IS 'Get the number of trial days remaining for a network';
COMMENT ON FUNCTION update_trial_days_used() IS 'Update trial_days_used for all trial networks based on current date';
COMMENT ON FUNCTION setup_new_network() IS 'Automatically sets up trial information for new networks';