-- Add engagement badges system
-- Migration file: 20250127000000_add_engagement_badges.sql

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  network_id uuid REFERENCES public.networks(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  icon varchar(50) NOT NULL, -- Material UI icon name
  color varchar(50) DEFAULT 'primary', -- primary, secondary, success, warning, error, info
  criteria_type varchar(50) NOT NULL, -- manual, posts_count, events_attended, messages_sent, member_duration
  criteria_value integer DEFAULT 0, -- threshold value for automatic badges
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(network_id, name)
);

-- Create user_badges table for awarded badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_by uuid REFERENCES public.profiles(id),
  awarded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  reason text,
  UNIQUE(user_id, badge_id)
);

-- Create engagement_stats table for tracking user activity
CREATE TABLE IF NOT EXISTS public.engagement_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  network_id uuid REFERENCES public.networks(id) ON DELETE CASCADE,
  posts_count integer DEFAULT 0,
  events_attended integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  wiki_contributions integer DEFAULT 0,
  polls_participated integer DEFAULT 0,
  files_shared integer DEFAULT 0,
  last_active timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  member_since timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, network_id)
);

-- Add badges field to profiles for quick access
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge_count integer DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_badges_network_id ON public.badges(network_id);
CREATE INDEX IF NOT EXISTS idx_badges_criteria_type ON public.badges(criteria_type);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_engagement_stats_user_network ON public.engagement_stats(user_id, network_id);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges table
-- Anyone in the network can view active badges
CREATE POLICY "Network members can view badges"
  ON public.badges FOR SELECT
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.network_id = badges.network_id
    )
  );

-- Network admins can manage badges
CREATE POLICY "Network admins can manage badges"
  ON public.badges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.network_id = badges.network_id 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for user_badges table
-- Anyone can view badges
CREATE POLICY "Anyone can view user badges"
  ON public.user_badges FOR SELECT
  USING (true);

-- Network admins can award/revoke badges
CREATE POLICY "Network admins can manage user badges"
  ON public.user_badges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.badges b ON b.id = user_badges.badge_id
      WHERE p.id = auth.uid() 
      AND p.network_id = b.network_id 
      AND p.role = 'admin'
    )
  );

-- RLS Policies for engagement_stats table
-- Users can view their own stats
CREATE POLICY "Users can view own engagement stats"
  ON public.engagement_stats FOR SELECT
  USING (user_id = auth.uid());

-- Network admins can view all stats in their network
CREATE POLICY "Network admins can view network engagement stats"
  ON public.engagement_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.network_id = engagement_stats.network_id 
      AND profiles.role = 'admin'
    )
  );

-- System can update engagement stats
CREATE POLICY "System can update engagement stats"
  ON public.engagement_stats FOR ALL
  USING (true);

-- Function to update engagement stats
CREATE OR REPLACE FUNCTION update_engagement_stats()
RETURNS trigger AS $$
BEGIN
  -- Update stats based on the triggering table
  IF TG_TABLE_NAME = 'network_news' THEN
    INSERT INTO public.engagement_stats (user_id, network_id, posts_count)
    VALUES (NEW.created_by, NEW.network_id, 1)
    ON CONFLICT (user_id, network_id)
    DO UPDATE SET 
      posts_count = engagement_stats.posts_count + 1,
      last_active = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now());
      
  ELSIF TG_TABLE_NAME = 'messages' THEN
    INSERT INTO public.engagement_stats (user_id, network_id, messages_sent)
    VALUES (NEW.user_id, NEW.network_id, 1)
    ON CONFLICT (user_id, network_id)
    DO UPDATE SET 
      messages_sent = engagement_stats.messages_sent + 1,
      last_active = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now());
      
  ELSIF TG_TABLE_NAME = 'event_participations' AND NEW.status = 'attending' THEN
    INSERT INTO public.engagement_stats (user_id, network_id, events_attended)
    SELECT NEW.profile_id, e.network_id, 1
    FROM public.network_events e
    WHERE e.id = NEW.event_id
    ON CONFLICT (user_id, network_id)
    DO UPDATE SET 
      events_attended = engagement_stats.events_attended + 1,
      last_active = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update engagement stats
CREATE TRIGGER update_engagement_on_news
  AFTER INSERT ON public.network_news
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_stats();

CREATE TRIGGER update_engagement_on_messages
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_stats();

CREATE TRIGGER update_engagement_on_event_participation
  AFTER INSERT OR UPDATE ON public.event_participations
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_stats();

-- Function to check and award automatic badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id uuid, p_network_id uuid)
RETURNS void AS $$
DECLARE
  v_badge RECORD;
  v_stats RECORD;
  v_member_days integer;
BEGIN
  -- Get user's engagement stats
  SELECT * INTO v_stats
  FROM public.engagement_stats
  WHERE user_id = p_user_id AND network_id = p_network_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate member duration in days
  v_member_days := EXTRACT(day FROM (now() - v_stats.member_since));
  
  -- Check each active automatic badge
  FOR v_badge IN 
    SELECT * FROM public.badges 
    WHERE network_id = p_network_id 
    AND is_active = true 
    AND criteria_type != 'manual'
  LOOP
    -- Check if user already has this badge
    IF EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = p_user_id AND badge_id = v_badge.id
    ) THEN
      CONTINUE;
    END IF;
    
    -- Check criteria and award badge if met
    IF (v_badge.criteria_type = 'posts_count' AND v_stats.posts_count >= v_badge.criteria_value) OR
       (v_badge.criteria_type = 'events_attended' AND v_stats.events_attended >= v_badge.criteria_value) OR
       (v_badge.criteria_type = 'messages_sent' AND v_stats.messages_sent >= v_badge.criteria_value) OR
       (v_badge.criteria_type = 'member_duration' AND v_member_days >= v_badge.criteria_value) THEN
      
      INSERT INTO public.user_badges (user_id, badge_id, reason)
      VALUES (p_user_id, v_badge.id, 'Automatically awarded based on activity');
      
      -- Update badge count
      UPDATE public.profiles 
      SET badge_count = badge_count + 1
      WHERE id = p_user_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update badge count
CREATE OR REPLACE FUNCTION update_badge_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET badge_count = badge_count + 1
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET badge_count = badge_count - 1
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update badge count
CREATE TRIGGER update_profile_badge_count
  AFTER INSERT OR DELETE ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION update_badge_count();

-- Insert some default badges for new networks
CREATE OR REPLACE FUNCTION create_default_badges()
RETURNS trigger AS $$
BEGIN
  -- Early Adopter badge
  INSERT INTO public.badges (network_id, name, description, icon, color, criteria_type, criteria_value)
  VALUES (
    NEW.id, 
    'Early Adopter', 
    'One of the first 10 members to join', 
    'Star', 
    'warning', 
    'manual', 
    0
  );
  
  -- Active Contributor badge
  INSERT INTO public.badges (network_id, name, description, icon, color, criteria_type, criteria_value)
  VALUES (
    NEW.id, 
    'Active Contributor', 
    'Posted 10 or more times', 
    'TrendingUp', 
    'primary', 
    'posts_count', 
    10
  );
  
  -- Event Enthusiast badge
  INSERT INTO public.badges (network_id, name, description, icon, color, criteria_type, criteria_value)
  VALUES (
    NEW.id, 
    'Event Enthusiast', 
    'Attended 5 or more events', 
    'Event', 
    'success', 
    'events_attended', 
    5
  );
  
  -- Conversation Starter badge
  INSERT INTO public.badges (network_id, name, description, icon, color, criteria_type, criteria_value)
  VALUES (
    NEW.id, 
    'Conversation Starter', 
    'Sent 50 or more messages', 
    'Chat', 
    'info', 
    'messages_sent', 
    50
  );
  
  -- Loyal Member badge
  INSERT INTO public.badges (network_id, name, description, icon, color, criteria_type, criteria_value)
  VALUES (
    NEW.id, 
    'Loyal Member', 
    'Member for 30 days or more', 
    'Loyalty', 
    'secondary', 
    'member_duration', 
    30
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add default badges for new networks
CREATE TRIGGER create_network_default_badges
  AFTER INSERT ON public.networks
  FOR EACH ROW
  EXECUTE FUNCTION create_default_badges();