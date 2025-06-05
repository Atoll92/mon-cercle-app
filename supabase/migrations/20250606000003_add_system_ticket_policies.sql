-- Add RLS policies to allow system-generated tickets
-- System tickets have submitted_by = NULL and network_id = NULL

-- Drop the existing create policy that prevents system tickets
DROP POLICY IF EXISTS "Create tickets - network admins" ON support_tickets;

-- Create new policies that allow both user and system tickets

-- 1. Allow network admins to create tickets for their networks
CREATE POLICY "Create tickets - network admins"
ON support_tickets FOR INSERT
TO authenticated
WITH CHECK (
  -- Network admin creating ticket for their network
  (network_id IS NOT NULL 
   AND is_network_admin(network_id) 
   AND submitted_by = auth.uid())
);

-- 2. Allow system to create tickets (bypasses authentication)
CREATE POLICY "Create tickets - system generated"
ON support_tickets FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- System-generated tickets have no network and no submitter
  network_id IS NULL 
  AND submitted_by IS NULL
);

-- 3. Allow viewing of system tickets by super admins
DROP POLICY IF EXISTS "View tickets - network admins and super admins" ON support_tickets;

CREATE POLICY "View tickets - network admins and super admins"
ON support_tickets FOR SELECT
TO authenticated
USING (
  -- Network admins can see their network's tickets
  (network_id IS NOT NULL AND is_network_admin(network_id))
  OR 
  -- Super admins can see all tickets (including system tickets)
  is_super_admin()
);

-- 4. Allow super admins to update system tickets
-- The existing super admin update policy already covers this since it uses is_super_admin()
-- which should work for system tickets too

-- Add a comment explaining system tickets
COMMENT ON TABLE support_tickets IS 'Support tickets for networks and system-generated error reports. System tickets have network_id=NULL and submitted_by=NULL.';