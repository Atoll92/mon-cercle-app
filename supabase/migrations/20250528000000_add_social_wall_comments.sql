-- Create social_wall_comments table
CREATE TABLE IF NOT EXISTS public.social_wall_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('news', 'post')),
    item_id UUID NOT NULL,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.social_wall_comments(id) ON DELETE CASCADE,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_social_wall_comments_item ON public.social_wall_comments(item_type, item_id) WHERE NOT is_hidden;
CREATE INDEX idx_social_wall_comments_profile ON public.social_wall_comments(profile_id);
CREATE INDEX idx_social_wall_comments_parent ON public.social_wall_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_social_wall_comments_created ON public.social_wall_comments(created_at DESC);

-- Add foreign key constraints based on item_type
-- Note: We can't use a direct foreign key since item_id references different tables
-- This will be enforced through triggers or application logic

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_social_wall_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_wall_comments_updated_at
    BEFORE UPDATE ON public.social_wall_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_social_wall_comments_updated_at();

-- Enable Row Level Security
ALTER TABLE public.social_wall_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view all non-hidden comments
CREATE POLICY "Users can view non-hidden comments" ON public.social_wall_comments
    FOR SELECT
    USING (NOT is_hidden OR auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'admin' AND network_id IN (
            -- Get network_id based on the commented item
            SELECT CASE 
                WHEN item_type = 'news' THEN (SELECT network_id FROM public.network_news WHERE id = item_id)
                WHEN item_type = 'post' THEN (SELECT network_id FROM public.profiles WHERE id IN (
                    SELECT profile_id FROM public.portfolio_items WHERE id = item_id
                ))
            END
        )
    ));

-- Policy: Users can create comments if they belong to the network
CREATE POLICY "Users can create comments" ON public.social_wall_comments
    FOR INSERT
    WITH CHECK (
        auth.uid() = profile_id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND network_id IN (
                -- Get network_id based on the item being commented on
                SELECT CASE 
                    WHEN item_type = 'news' THEN (SELECT network_id FROM public.network_news WHERE id = item_id)
                    WHEN item_type = 'post' THEN (SELECT network_id FROM public.profiles WHERE id IN (
                        SELECT profile_id FROM public.portfolio_items WHERE id = item_id
                    ))
                END
            )
        )
    );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.social_wall_comments
    FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.social_wall_comments
    FOR DELETE
    USING (auth.uid() = profile_id);

-- Policy: Network admins can hide/unhide comments
CREATE POLICY "Network admins can hide/unhide comments" ON public.social_wall_comments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND network_id IN (
                -- Get network_id based on the commented item
                SELECT CASE 
                    WHEN item_type = 'news' THEN (SELECT network_id FROM public.network_news WHERE id = item_id)
                    WHEN item_type = 'post' THEN (SELECT network_id FROM public.profiles WHERE id IN (
                        SELECT profile_id FROM public.portfolio_items WHERE id = item_id
                    ))
                END
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND network_id IN (
                -- Get network_id based on the commented item
                SELECT CASE 
                    WHEN item_type = 'news' THEN (SELECT network_id FROM public.network_news WHERE id = item_id)
                    WHEN item_type = 'post' THEN (SELECT network_id FROM public.profiles WHERE id IN (
                        SELECT profile_id FROM public.portfolio_items WHERE id = item_id
                    ))
                END
            )
        )
    );

-- Add comment to document the table
COMMENT ON TABLE public.social_wall_comments IS 'Comments on social wall items (news and portfolio posts)';
COMMENT ON COLUMN public.social_wall_comments.item_type IS 'Type of item being commented on: news or post';
COMMENT ON COLUMN public.social_wall_comments.item_id IS 'UUID of the news or portfolio item being commented on';
COMMENT ON COLUMN public.social_wall_comments.parent_comment_id IS 'Reference to parent comment for threaded replies';
COMMENT ON COLUMN public.social_wall_comments.is_hidden IS 'Flag for hidden/moderated comments';