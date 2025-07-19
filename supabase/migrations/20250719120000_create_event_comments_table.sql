-- Create event_comments table
-- This table follows the same patterns as social_wall_comments but is dedicated to event comments
CREATE TABLE IF NOT EXISTS public.event_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    event_id UUID NOT NULL REFERENCES public.network_events(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.event_comments(id) ON DELETE CASCADE,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_event_comments_event ON public.event_comments(event_id) WHERE NOT is_hidden;
CREATE INDEX idx_event_comments_profile ON public.event_comments(profile_id);
CREATE INDEX idx_event_comments_parent ON public.event_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_event_comments_created ON public.event_comments(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_event_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_comments_updated_at
    BEFORE UPDATE ON public.event_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_event_comments_updated_at();

-- Enable Row Level Security
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view all non-hidden comments for events in their network
CREATE POLICY "Users can view non-hidden event comments" ON public.event_comments
    FOR SELECT
    USING (NOT is_hidden OR auth.uid() IN (
        SELECT p.id FROM public.profiles p
        WHERE p.role = 'admin' 
        AND p.network_id = (
            SELECT ne.network_id 
            FROM public.network_events ne 
            WHERE ne.id = event_id
        )
    ));

-- Policy: Users can create comments if they belong to the same network as the event
CREATE POLICY "Users can create event comments" ON public.event_comments
    FOR INSERT
    WITH CHECK (
        auth.uid() = profile_id AND
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.network_events ne ON ne.network_id = p.network_id
            WHERE p.id = auth.uid() 
            AND ne.id = event_id
        )
    );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own event comments" ON public.event_comments
    FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own event comments" ON public.event_comments
    FOR DELETE
    USING (auth.uid() = profile_id);

-- Policy: Network admins can hide/unhide comments for events in their network
CREATE POLICY "Network admins can hide/unhide event comments" ON public.event_comments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.network_events ne ON ne.network_id = p.network_id
            WHERE p.id = auth.uid() 
            AND p.role = 'admin' 
            AND ne.id = event_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.network_events ne ON ne.network_id = p.network_id
            WHERE p.id = auth.uid() 
            AND p.role = 'admin' 
            AND ne.id = event_id
        )
    );

-- Policy: Network admins can delete any comment for events in their network
CREATE POLICY "Network admins can delete event comments" ON public.event_comments
    FOR DELETE
    USING (
        auth.uid() = profile_id OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.network_events ne ON ne.network_id = p.network_id
            WHERE p.id = auth.uid() 
            AND p.role = 'admin' 
            AND ne.id = event_id
        )
    );

-- Add comments to document the table
COMMENT ON TABLE public.event_comments IS 'Comments on network events with threaded reply support';
COMMENT ON COLUMN public.event_comments.event_id IS 'UUID of the network event being commented on';
COMMENT ON COLUMN public.event_comments.profile_id IS 'Profile ID of the comment author';
COMMENT ON COLUMN public.event_comments.parent_comment_id IS 'Reference to parent comment for threaded replies';
COMMENT ON COLUMN public.event_comments.is_hidden IS 'Flag for hidden/moderated comments';
COMMENT ON COLUMN public.event_comments.content IS 'The comment text content';