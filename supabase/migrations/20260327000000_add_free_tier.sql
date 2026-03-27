-- Add free tier: replace trial system with permanent free plan for networks under 100 members
-- Migration file: 20260327000000_add_free_tier.sql

-- 1. Convert all existing trial networks to free plan
UPDATE public.networks
SET
  subscription_plan = 'free',
  subscription_status = 'free',
  is_trial = false,
  trial_start_date = NULL,
  trial_end_date = NULL,
  trial_days_used = 0
WHERE
  subscription_status = 'trial'
  OR (is_trial = true AND subscription_status NOT IN ('active', 'canceled', 'past_due'));

-- 2. Convert networks with NULL/family plan and no active subscription
UPDATE public.networks
SET
  subscription_plan = 'free',
  subscription_status = 'free',
  is_trial = false,
  trial_start_date = NULL,
  trial_end_date = NULL,
  trial_days_used = 0
WHERE
  (subscription_plan IS NULL OR subscription_plan IN ('family', 'free'))
  AND subscription_status NOT IN ('active', 'canceled', 'past_due');

-- 3. Replace trigger: new networks start on free plan instead of trial
CREATE OR REPLACE FUNCTION setup_new_network()
RETURNS trigger AS $$
BEGIN
  -- New networks start on the free plan (no trial)
  NEW.is_trial := false;
  NEW.trial_start_date := NULL;
  NEW.trial_end_date := NULL;
  NEW.trial_days_used := 0;
  NEW.subscription_plan := 'free';
  NEW.subscription_status := 'free';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION setup_new_network() IS 'Sets up new networks on the free plan by default (no trial)';
