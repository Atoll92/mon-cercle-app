-- Add monetization support to networks and events
-- Migration file: 20250525000000_add_monetization_support.sql

-- Add Stripe account ID to networks for payment processing
ALTER TABLE public.networks ADD COLUMN IF NOT EXISTS stripe_account_id text;

-- Add pricing fields to events
ALTER TABLE public.network_events ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 0;
ALTER TABLE public.network_events ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';
ALTER TABLE public.network_events ADD COLUMN IF NOT EXISTS max_tickets integer;
ALTER TABLE public.network_events ADD COLUMN IF NOT EXISTS tickets_sold integer DEFAULT 0;

-- Add payment status to event participations
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'free';
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS payment_amount decimal(10,2);
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone;
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS stripe_payment_id text;

-- Add constraint for payment status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_payment_status' 
    AND conrelid = 'public.event_participations'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.event_participations ADD CONSTRAINT valid_payment_status 
      CHECK (payment_status IN (''free'', ''pending'', ''paid'', ''refunded'', ''cancelled''))';
  END IF;
END$$;

-- Add constraint for currency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_currency' 
    AND conrelid = 'public.network_events'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.network_events ADD CONSTRAINT valid_currency 
      CHECK (currency IN (''EUR'', ''USD'', ''GBP''))';
  END IF;
END$$;

-- Create membership plans table
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  network_id uuid REFERENCES public.networks(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'EUR',
  interval text NOT NULL DEFAULT 'month',
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  stripe_price_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create member subscriptions table
CREATE TABLE IF NOT EXISTS public.member_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  network_id uuid REFERENCES public.networks(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  stripe_subscription_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(profile_id, network_id)
);

-- Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  network_id uuid REFERENCES public.networks(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  message text,
  is_anonymous boolean DEFAULT false,
  stripe_payment_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_participations_payment_status ON public.event_participations(payment_status);
CREATE INDEX IF NOT EXISTS idx_membership_plans_network_id ON public.membership_plans(network_id);
CREATE INDEX IF NOT EXISTS idx_member_subscriptions_profile_id ON public.member_subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_member_subscriptions_network_id ON public.member_subscriptions(network_id);
CREATE INDEX IF NOT EXISTS idx_donations_network_id ON public.donations(network_id);

-- Update the features_config default to include monetization
UPDATE public.networks
SET features_config = features_config || '{"monetization": false}'::jsonb
WHERE NOT (features_config ? 'monetization');

-- Add RLS policies for new tables
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Membership plans policies
CREATE POLICY "membership_plans_viewable_by_network_members" ON public.membership_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = membership_plans.network_id
    )
  );

CREATE POLICY "membership_plans_manageable_by_admins" ON public.membership_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = membership_plans.network_id
      AND profiles.role = 'admin'
    )
  );

-- Member subscriptions policies
CREATE POLICY "member_subscriptions_viewable_by_owner" ON public.member_subscriptions
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "member_subscriptions_viewable_by_network_admins" ON public.member_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = member_subscriptions.network_id
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "member_subscriptions_manageable_by_owner" ON public.member_subscriptions
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "member_subscriptions_updatable_by_owner" ON public.member_subscriptions
  FOR UPDATE USING (profile_id = auth.uid());

-- Donations policies
CREATE POLICY "donations_viewable_by_network_admins" ON public.donations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = donations.network_id
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "donations_viewable_by_donor" ON public.donations
  FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "donations_insertable_by_users" ON public.donations
  FOR INSERT WITH CHECK (donor_id = auth.uid());

-- Add comments
COMMENT ON COLUMN public.networks.stripe_account_id IS 'Stripe Connect account ID for processing payments';
COMMENT ON COLUMN public.network_events.price IS 'Event ticket price (0 for free events)';
COMMENT ON COLUMN public.network_events.currency IS 'Currency for the event price';
COMMENT ON COLUMN public.network_events.max_tickets IS 'Maximum number of tickets available';
COMMENT ON COLUMN public.network_events.tickets_sold IS 'Number of tickets sold';
COMMENT ON COLUMN public.event_participations.payment_status IS 'Payment status: free, pending, paid, refunded, cancelled';
COMMENT ON TABLE public.membership_plans IS 'Subscription plans for network memberships';
COMMENT ON TABLE public.member_subscriptions IS 'Active member subscriptions to network plans';
COMMENT ON TABLE public.donations IS 'Donations made to networks';