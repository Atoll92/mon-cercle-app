-- Fix RLS policies for event_comments to work with multi-profile system
-- The issue is that we need to check profile_id belongs to the same network as the event

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view non-hidden event comments" ON public.event_comments;
DROP POLICY IF EXISTS "Users can create event comments" ON public.event_comments;
DROP POLICY IF EXISTS "Users can update own event comments" ON public.event_comments;
DROP POLICY IF EXISTS "Users can delete own event comments" ON public.event_comments;
DROP POLICY IF EXISTS "Network admins can hide/unhide event comments" ON public.event_comments;
DROP POLICY IF EXISTS "Network admins can delete event comments" ON public.event_comments;

-- Policy: Users can view all non-hidden comments for events in their network
CREATE POLICY "Users can view non-hidden event comments" ON public.event_comments
    FOR SELECT
    USING (
        NOT is_hidden OR 
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.network_events ne ON ne.network_id = p.network_id
            WHERE p.user_id = auth.uid() 
            AND p.role = 'admin' 
            AND ne.id = event_id
        )
    );

-- Policy: Users can create comments if their profile belongs to the same network as the event
CREATE POLICY "Users can create event comments" ON public.event_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.network_events ne ON ne.network_id = p.network_id
            WHERE p.id = profile_id
            AND p.user_id = auth.uid()
            AND ne.id = event_id
        )
    );

-- Policy: Users can update their own comments (profile must be owned by the authenticated user)
CREATE POLICY "Users can update own event comments" ON public.event_comments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = profile_id 
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = profile_id 
            AND p.user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own comments (profile must be owned by the authenticated user)
CREATE POLICY "Users can delete own event comments" ON public.event_comments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = profile_id 
            AND p.user_id = auth.uid()
        )
    );

-- Policy: Network admins can hide/unhide comments for events in their network
CREATE POLICY "Network admins can hide/unhide event comments" ON public.event_comments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.network_events ne ON ne.network_id = p.network_id
            WHERE p.user_id = auth.uid() 
            AND p.role = 'admin' 
            AND ne.id = event_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.network_events ne ON ne.network_id = p.network_id
            WHERE p.user_id = auth.uid() 
            AND p.role = 'admin' 
            AND ne.id = event_id
        )
    );

-- Policy: Network admins can delete any comment for events in their network
CREATE POLICY "Network admins can delete event comments" ON public.event_comments
    FOR DELETE
    USING (
        -- User owns the comment
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = profile_id 
            AND p.user_id = auth.uid()
        )
        OR
        -- User is admin in the event's network
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.network_events ne ON ne.network_id = p.network_id
            WHERE p.user_id = auth.uid() 
            AND p.role = 'admin' 
            AND ne.id = event_id
        )
    );

-- Add comment about the RLS fix
COMMENT ON TABLE public.event_comments IS 'Comments on network events with multi-profile aware RLS policies';