-- Create audit log table for tracking network feature changes
-- Specifically monitoring allow_member_event_publishing changes

-- Create the audit log table
CREATE TABLE IF NOT EXISTS public.network_features_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
    network_name text NOT NULL,
    changed_field text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    change_type text NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),

    -- User information
    user_id uuid, -- auth.uid() at time of change
    user_email text, -- Email of the user who made the change
    profile_id uuid, -- Profile ID if available
    profile_name text, -- Profile name if available

    -- Request context
    client_ip inet, -- IP address from request
    user_agent text, -- Browser/client info
    request_id text, -- Request ID if available

    -- Timestamp
    changed_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Additional context
    full_old_config jsonb, -- Complete old features_config
    full_new_config jsonb, -- Complete new features_config
    other_changes jsonb -- Any other fields that changed in the same update
);

-- Create indexes for efficient querying
CREATE INDEX idx_network_features_audit_network_id ON public.network_features_audit_log(network_id);
CREATE INDEX idx_network_features_audit_changed_at ON public.network_features_audit_log(changed_at DESC);
CREATE INDEX idx_network_features_audit_user_id ON public.network_features_audit_log(user_id);
CREATE INDEX idx_network_features_audit_field ON public.network_features_audit_log(changed_field);

-- Add comment to describe the table
COMMENT ON TABLE public.network_features_audit_log IS 'Audit log for tracking changes to network features configuration, especially allow_member_event_publishing';

-- Create the trigger function to capture changes
CREATE OR REPLACE FUNCTION public.audit_network_features_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_profile_id uuid;
    v_profile_name text;
    v_client_ip inet;
    v_user_agent text;
    v_request_id text;
    v_old_allow_publishing boolean;
    v_new_allow_publishing boolean;
    v_other_changes jsonb;
BEGIN
    -- Get current user information
    v_user_id := auth.uid();

    -- Get user email if available
    IF v_user_id IS NOT NULL THEN
        SELECT email INTO v_user_email
        FROM auth.users
        WHERE id = v_user_id;

        -- Try to get profile information for this network
        SELECT p.id, p.full_name INTO v_profile_id, v_profile_name
        FROM public.profiles p
        WHERE p.user_id = v_user_id
        AND p.network_id = COALESCE(NEW.id, OLD.id)
        LIMIT 1;
    END IF;

    -- Try to get request context (these might be null if not available)
    v_client_ip := inet(current_setting('request.headers', true)::json->>'cf-connecting-ip');
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
    v_request_id := current_setting('request.headers', true)::json->>'x-request-id';

    -- Handle different operation types
    IF TG_OP = 'UPDATE' THEN
        -- Extract the allow_member_event_publishing values
        v_old_allow_publishing := (OLD.features_config->>'allow_member_event_publishing')::boolean;
        v_new_allow_publishing := (NEW.features_config->>'allow_member_event_publishing')::boolean;

        -- Check if allow_member_event_publishing changed
        IF v_old_allow_publishing IS DISTINCT FROM v_new_allow_publishing THEN

            -- Detect other changes in the same update
            v_other_changes := jsonb_build_object();

            IF OLD.name IS DISTINCT FROM NEW.name THEN
                v_other_changes := v_other_changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
            END IF;

            IF OLD.description IS DISTINCT FROM NEW.description THEN
                v_other_changes := v_other_changes || jsonb_build_object('description', jsonb_build_object('old', OLD.description, 'new', NEW.description));
            END IF;

            IF OLD.privacy_level IS DISTINCT FROM NEW.privacy_level THEN
                v_other_changes := v_other_changes || jsonb_build_object('privacy_level', jsonb_build_object('old', OLD.privacy_level, 'new', NEW.privacy_level));
            END IF;

            -- Log the change
            INSERT INTO public.network_features_audit_log (
                network_id,
                network_name,
                changed_field,
                old_value,
                new_value,
                change_type,
                user_id,
                user_email,
                profile_id,
                profile_name,
                client_ip,
                user_agent,
                request_id,
                full_old_config,
                full_new_config,
                other_changes
            ) VALUES (
                NEW.id,
                NEW.name,
                'allow_member_event_publishing',
                to_jsonb(v_old_allow_publishing),
                to_jsonb(v_new_allow_publishing),
                'UPDATE',
                v_user_id,
                v_user_email,
                v_profile_id,
                v_profile_name,
                v_client_ip,
                v_user_agent,
                v_request_id,
                OLD.features_config,
                NEW.features_config,
                CASE WHEN v_other_changes = '{}'::jsonb THEN NULL ELSE v_other_changes END
            );

            -- Log to server for immediate visibility
            RAISE LOG 'Network feature change: allow_member_event_publishing changed from % to % for network % (%) by user % (%)',
                v_old_allow_publishing,
                v_new_allow_publishing,
                NEW.name,
                NEW.id,
                v_user_email,
                v_user_id;
        END IF;

        -- Also log if any other features_config fields changed
        IF OLD.features_config IS DISTINCT FROM NEW.features_config THEN
            -- Check for other feature changes
            PERFORM public.log_other_feature_changes(OLD.features_config, NEW.features_config, NEW.id, NEW.name, v_user_id, v_user_email, v_profile_id, v_profile_name);
        END IF;

    ELSIF TG_OP = 'INSERT' THEN
        -- Log new network creation with allow_member_event_publishing setting
        v_new_allow_publishing := (NEW.features_config->>'allow_member_event_publishing')::boolean;

        IF v_new_allow_publishing IS NOT NULL THEN
            INSERT INTO public.network_features_audit_log (
                network_id,
                network_name,
                changed_field,
                old_value,
                new_value,
                change_type,
                user_id,
                user_email,
                profile_id,
                profile_name,
                client_ip,
                user_agent,
                request_id,
                full_old_config,
                full_new_config
            ) VALUES (
                NEW.id,
                NEW.name,
                'allow_member_event_publishing',
                NULL,
                to_jsonb(v_new_allow_publishing),
                'INSERT',
                v_user_id,
                v_user_email,
                v_profile_id,
                v_profile_name,
                v_client_ip,
                v_user_agent,
                v_request_id,
                NULL,
                NEW.features_config
            );
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        -- Log network deletion
        v_old_allow_publishing := (OLD.features_config->>'allow_member_event_publishing')::boolean;

        IF v_old_allow_publishing IS NOT NULL THEN
            INSERT INTO public.network_features_audit_log (
                network_id,
                network_name,
                changed_field,
                old_value,
                new_value,
                change_type,
                user_id,
                user_email,
                profile_id,
                profile_name,
                client_ip,
                user_agent,
                request_id,
                full_old_config,
                full_new_config
            ) VALUES (
                OLD.id,
                OLD.name,
                'allow_member_event_publishing',
                to_jsonb(v_old_allow_publishing),
                NULL,
                'DELETE',
                v_user_id,
                v_user_email,
                v_profile_id,
                v_profile_name,
                v_client_ip,
                v_user_agent,
                v_request_id,
                OLD.features_config,
                NULL
            );
        END IF;
    END IF;

    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to log other feature changes
CREATE OR REPLACE FUNCTION public.log_other_feature_changes(
    old_config jsonb,
    new_config jsonb,
    p_network_id uuid,
    p_network_name text,
    p_user_id uuid,
    p_user_email text,
    p_profile_id uuid,
    p_profile_name text
)
RETURNS void AS $$
DECLARE
    key text;
    old_val jsonb;
    new_val jsonb;
BEGIN
    -- Check if configs are objects (not arrays or scalars)
    IF old_config IS NULL THEN
        old_config := '{}'::jsonb;
    END IF;
    IF new_config IS NULL THEN
        new_config := '{}'::jsonb;
    END IF;

    -- Only process if both are objects
    IF jsonb_typeof(old_config) != 'object' OR jsonb_typeof(new_config) != 'object' THEN
        RETURN;
    END IF;

    -- Iterate through all keys in features_config
    FOR key IN SELECT jsonb_object_keys(new_config) UNION SELECT jsonb_object_keys(old_config)
    LOOP
        -- Skip allow_member_event_publishing as it's already logged
        IF key = 'allow_member_event_publishing' THEN
            CONTINUE;
        END IF;

        old_val := old_config->key;
        new_val := new_config->key;

        -- Log if the value changed
        IF old_val IS DISTINCT FROM new_val THEN
            INSERT INTO public.network_features_audit_log (
                network_id,
                network_name,
                changed_field,
                old_value,
                new_value,
                change_type,
                user_id,
                user_email,
                profile_id,
                profile_name,
                full_old_config,
                full_new_config
            ) VALUES (
                p_network_id,
                p_network_name,
                key,
                old_val,
                new_val,
                'UPDATE',
                p_user_id,
                p_user_email,
                p_profile_id,
                p_profile_name,
                old_config,
                new_config
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS audit_network_features_trigger ON public.networks;
CREATE TRIGGER audit_network_features_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.networks
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_network_features_changes();

-- Create RLS policies for the audit log table
ALTER TABLE public.network_features_audit_log ENABLE ROW LEVEL SECURITY;

-- Super admins can view all logs
CREATE POLICY "Super admins can view all audit logs" ON public.network_features_audit_log
    FOR SELECT
    USING (public.is_super_admin());

-- Network admins can view logs for their networks
CREATE POLICY "Network admins can view their network audit logs" ON public.network_features_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.network_id = network_features_audit_log.network_id
            AND p.user_id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Create a view for easier querying of recent changes
CREATE OR REPLACE VIEW public.recent_feature_changes AS
SELECT
    nf.network_name,
    nf.changed_field,
    nf.old_value,
    nf.new_value,
    nf.user_email,
    nf.profile_name,
    nf.changed_at,
    nf.client_ip,
    nf.other_changes
FROM public.network_features_audit_log nf
WHERE nf.changed_at > now() - interval '30 days'
ORDER BY nf.changed_at DESC;

-- Grant appropriate permissions
GRANT SELECT ON public.recent_feature_changes TO authenticated;

-- Create a function to query audit logs more easily
CREATE OR REPLACE FUNCTION public.get_network_feature_audit_logs(
    p_network_id uuid DEFAULT NULL,
    p_changed_field text DEFAULT NULL,
    p_days_back integer DEFAULT 30
)
RETURNS TABLE (
    network_name text,
    changed_field text,
    old_value jsonb,
    new_value jsonb,
    change_type text,
    user_email text,
    profile_name text,
    changed_at timestamp with time zone,
    client_ip inet,
    user_agent text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        nf.network_name,
        nf.changed_field,
        nf.old_value,
        nf.new_value,
        nf.change_type,
        nf.user_email,
        nf.profile_name,
        nf.changed_at,
        nf.client_ip,
        nf.user_agent
    FROM public.network_features_audit_log nf
    WHERE
        (p_network_id IS NULL OR nf.network_id = p_network_id)
        AND (p_changed_field IS NULL OR nf.changed_field = p_changed_field)
        AND nf.changed_at > now() - (p_days_back || ' days')::interval
    ORDER BY nf.changed_at DESC;
$$;

-- Add helpful comments
COMMENT ON FUNCTION public.audit_network_features_changes() IS 'Trigger function that logs all changes to network features, especially allow_member_event_publishing';
COMMENT ON FUNCTION public.get_network_feature_audit_logs IS 'Query audit logs for network feature changes. Pass network_id, field name, and days to look back';
COMMENT ON VIEW public.recent_feature_changes IS 'View showing feature configuration changes in the last 30 days';