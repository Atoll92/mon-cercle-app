-- Simple fix: Allow authenticated users to create system tickets
-- by modifying the existing policy

-- Drop the current network admin policy
DROP POLICY IF EXISTS "Create tickets - network admins" ON support_tickets;

-- Create a new policy that allows both network admin tickets AND system tickets
CREATE POLICY "Create tickets - network admins and system"
ON support_tickets FOR INSERT
TO authenticated
WITH CHECK (
  -- Network admin creating ticket for their network
  (network_id IS NOT NULL 
   AND is_network_admin(network_id) 
   AND submitted_by = auth.uid())
  OR
  -- System-generated tickets (network_id = null, submitted_by = null)
  (network_id IS NULL AND submitted_by IS NULL)
);

-- Also ensure anon can create system tickets
CREATE POLICY "Create tickets - system anon"
ON support_tickets FOR INSERT
TO anon
WITH CHECK (
  network_id IS NULL AND submitted_by IS NULL
);