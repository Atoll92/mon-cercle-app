-- Fix badges RLS policy for network creation
-- Migration file: 20250528000007_fix_badges_rls_network_creation.sql

-- Drop existing restrictive policy for badges creation
DROP POLICY IF EXISTS "Network admins can manage badges" ON public.badges;

-- Create new policy that allows network creators to create badges during network setup
CREATE POLICY "Network creators and admins can manage badges"
  ON public.badges FOR ALL
  USING (
    -- Allow if user is admin of the network
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.network_id = badges.network_id 
      AND profiles.role = 'admin'
    )
    OR
    -- Allow if user is the creator of the network (for initial setup)
    EXISTS (
      SELECT 1 FROM public.networks 
      WHERE networks.id = badges.network_id 
      AND networks.created_by = auth.uid()::text
    )
  );

-- Drop existing user_badges policy that's too restrictive
DROP POLICY IF EXISTS "Network admins can manage user badges" ON public.user_badges;

-- Create new policy for user_badges that allows network creators during setup
CREATE POLICY "Network creators and admins can manage user badges"
  ON public.user_badges FOR ALL
  USING (
    -- Allow if user is admin of the network that owns the badge
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.badges b ON b.id = user_badges.badge_id
      WHERE p.id = auth.uid() 
      AND p.network_id = b.network_id 
      AND p.role = 'admin'
    )
    OR
    -- Allow if user is the creator of the network (for initial setup)
    EXISTS (
      SELECT 1 FROM public.networks n
      JOIN public.badges b ON b.network_id = n.id
      WHERE n.created_by = auth.uid()::text
      AND b.id = user_badges.badge_id
    )
  );

-- Add a function to create default badges for a new network
CREATE OR REPLACE FUNCTION create_default_badges_for_network(network_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert default badges for the network
  INSERT INTO public.badges (network_id, name, description, icon, color, criteria, is_active, created_at)
  VALUES 
    (network_id, 'Early Adopter', 'One of the first members to join this network', 'EmojiEvents', '#FFD700', '{"type": "manual"}', true, now()),
    (network_id, 'Active Contributor', 'Regularly contributes to discussions and content', 'Forum', '#4CAF50', '{"type": "automatic", "condition": "posts_count >= 10"}', true, now()),
    (network_id, 'Event Organizer', 'Organizes and hosts community events', 'Event', '#2196F3', '{"type": "manual"}', true, now()),
    (network_id, 'Knowledge Sharer', 'Contributes valuable knowledge to the community wiki', 'MenuBook', '#9C27B0', '{"type": "manual"}', true, now()),
    (network_id, 'Community Champion', 'Goes above and beyond to help community members', 'Stars', '#FF5722', '{"type": "manual"}', true, now());
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Could not create default badges for network %: %', network_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION create_default_badges_for_network(uuid) IS 'Creates default engagement badges for a new network';