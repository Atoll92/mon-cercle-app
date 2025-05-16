-- Add moderation columns to network_news
ALTER TABLE public.network_news 
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason text;

-- Add moderation columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason text;

-- Add moderation columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS suspension_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS restriction_level text,
ADD COLUMN IF NOT EXISTS restriction_reason text,
ADD COLUMN IF NOT EXISTS last_active timestamp with time zone;

-- Add check constraint for restriction_level values
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_restriction_level_check
CHECK (restriction_level IS NULL OR restriction_level IN ('none', 'limited', 'readonly'));

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    network_id uuid NOT NULL,
    moderator_id uuid NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    action text NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Add foreign key constraints
ALTER TABLE public.moderation_logs
ADD CONSTRAINT moderation_logs_network_id_fkey
FOREIGN KEY (network_id) REFERENCES public.networks(id) ON DELETE CASCADE;

ALTER TABLE public.moderation_logs
ADD CONSTRAINT moderation_logs_moderator_id_fkey
FOREIGN KEY (moderator_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS moderation_logs_network_id_idx ON public.moderation_logs(network_id);
CREATE INDEX IF NOT EXISTS moderation_logs_created_at_idx ON public.moderation_logs(created_at);
CREATE INDEX IF NOT EXISTS moderation_logs_target_type_idx ON public.moderation_logs(target_type);
CREATE INDEX IF NOT EXISTS profiles_is_suspended_idx ON public.profiles(is_suspended);

-- Enable RLS on moderation_logs
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for moderation_logs
CREATE POLICY "Admins can view moderation logs for their network" ON public.moderation_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.network_id = moderation_logs.network_id
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can insert moderation logs for their network" ON public.moderation_logs
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.network_id = moderation_logs.network_id
        AND profiles.role = 'admin'
    )
);

-- Create functions needed for our moderation setup
CREATE OR REPLACE FUNCTION add_moderation_columns_to_news()
RETURNS void AS $$
BEGIN
    ALTER TABLE public.network_news 
    ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS flag_reason text;
    
    RAISE NOTICE 'Added moderation columns to network_news table';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_moderation_columns_to_messages()
RETURNS void AS $$
BEGIN
    ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS flag_reason text;
    
    RAISE NOTICE 'Added moderation columns to messages table';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_moderation_columns_to_profiles()
RETURNS void AS $$
BEGIN
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS suspension_reason text,
    ADD COLUMN IF NOT EXISTS suspension_end_date timestamp with time zone,
    ADD COLUMN IF NOT EXISTS restriction_level text,
    ADD COLUMN IF NOT EXISTS restriction_reason text,
    ADD COLUMN IF NOT EXISTS last_active timestamp with time zone;
    
    -- Check if constraint already exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_restriction_level_check'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_restriction_level_check
        CHECK (restriction_level IS NULL OR restriction_level IN ('none', 'limited', 'readonly'));
    END IF;
    
    RAISE NOTICE 'Added moderation columns to profiles table';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_moderation_logs_table()
RETURNS void AS $$
BEGIN
    -- Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.moderation_logs (
        id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
        network_id uuid NOT NULL,
        moderator_id uuid NOT NULL,
        target_type text NOT NULL,
        target_id uuid NOT NULL,
        action text NOT NULL,
        reason text,
        created_at timestamp with time zone DEFAULT now(),
        PRIMARY KEY (id)
    );
    
    -- Add foreign key constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'moderation_logs_network_id_fkey'
    ) THEN
        ALTER TABLE public.moderation_logs
        ADD CONSTRAINT moderation_logs_network_id_fkey
        FOREIGN KEY (network_id) REFERENCES public.networks(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'moderation_logs_moderator_id_fkey'
    ) THEN
        ALTER TABLE public.moderation_logs
        ADD CONSTRAINT moderation_logs_moderator_id_fkey
        FOREIGN KEY (moderator_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- Create indexes if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'moderation_logs_network_id_idx'
    ) THEN
        CREATE INDEX moderation_logs_network_id_idx ON public.moderation_logs(network_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'moderation_logs_created_at_idx'
    ) THEN
        CREATE INDEX moderation_logs_created_at_idx ON public.moderation_logs(created_at);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'moderation_logs_target_type_idx'
    ) THEN
        CREATE INDEX moderation_logs_target_type_idx ON public.moderation_logs(target_type);
    END IF;
    
    -- Enable RLS
    ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Admins can view moderation logs for their network'
    ) THEN
        CREATE POLICY "Admins can view moderation logs for their network" ON public.moderation_logs
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.network_id = moderation_logs.network_id
                AND profiles.role = 'admin'
            )
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Admins can insert moderation logs for their network'
    ) THEN
        CREATE POLICY "Admins can insert moderation logs for their network" ON public.moderation_logs
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.network_id = moderation_logs.network_id
                AND profiles.role = 'admin'
            )
        );
    END IF;
    
    RAISE NOTICE 'Created moderation_logs table with proper constraints and policies';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to the functions
GRANT EXECUTE ON FUNCTION add_moderation_columns_to_news() TO authenticated;
GRANT EXECUTE ON FUNCTION add_moderation_columns_to_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION add_moderation_columns_to_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION create_moderation_logs_table() TO authenticated;

-- Grant permissions on moderation_logs table
GRANT ALL ON TABLE public.moderation_logs TO anon;
GRANT ALL ON TABLE public.moderation_logs TO authenticated;
GRANT ALL ON TABLE public.moderation_logs TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Moderation system has been set up successfully!';
END $$;