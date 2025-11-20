-- Fix features_config format inconsistencies
-- Converts any stringified JSON to proper JSONB objects

-- First, let's analyze what we have
DO $$
DECLARE
    network_record RECORD;
    fixed_config jsonb;
    default_config jsonb := '{
        "chat": true,
        "news": true,
        "wiki": true,
        "files": true,
        "events": true,
        "courses": false,
        "moodboards": true,
        "marketplace": false,
        "notifications": true,
        "location_sharing": false,
        "activity_feed": false,
        "allow_member_event_publishing": false,
        "monetization": false,
        "currency": "EUR",
        "reactions": true
    }'::jsonb;
    string_count integer := 0;
    null_count integer := 0;
    array_count integer := 0;
    object_count integer := 0;
    fixed_count integer := 0;
BEGIN
    -- Count different types
    FOR network_record IN
        SELECT id, name, features_config
        FROM networks
    LOOP
        IF network_record.features_config IS NULL THEN
            null_count := null_count + 1;
        ELSIF jsonb_typeof(network_record.features_config) = 'string' THEN
            string_count := string_count + 1;
        ELSIF jsonb_typeof(network_record.features_config) = 'array' THEN
            array_count := array_count + 1;
        ELSIF jsonb_typeof(network_record.features_config) = 'object' THEN
            object_count := object_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Initial state: % NULL, % strings, % arrays, % objects',
        null_count, string_count, array_count, object_count;

    -- Fix each network's features_config
    FOR network_record IN
        SELECT id, name, features_config
        FROM networks
        FOR UPDATE
    LOOP
        fixed_config := NULL;

        -- Handle different cases
        IF network_record.features_config IS NULL THEN
            -- Use default config for NULL values
            fixed_config := default_config;
            RAISE NOTICE 'Network "%" had NULL config, using default', network_record.name;

        ELSIF jsonb_typeof(network_record.features_config) = 'string' THEN
            -- This is likely a double-stringified JSON
            BEGIN
                -- Try to parse the string as JSON
                fixed_config := (network_record.features_config #>> '{}')::jsonb;
                -- Merge with defaults to ensure all keys exist
                fixed_config := default_config || fixed_config;
                RAISE NOTICE 'Network "%" had stringified config, parsed and fixed', network_record.name;
                fixed_count := fixed_count + 1;
            EXCEPTION WHEN OTHERS THEN
                -- If parsing fails, use default
                fixed_config := default_config;
                RAISE WARNING 'Network "%" had malformed stringified config, using default', network_record.name;
            END;

        ELSIF jsonb_typeof(network_record.features_config) = 'array' THEN
            -- This shouldn't be an array, use default
            fixed_config := default_config;
            RAISE NOTICE 'Network "%" had array config (wrong type), using default', network_record.name;
            fixed_count := fixed_count + 1;

        ELSIF jsonb_typeof(network_record.features_config) = 'object' THEN
            -- Already an object, just ensure all keys exist
            fixed_config := default_config || network_record.features_config;

        ELSE
            -- Unknown type, use default
            fixed_config := default_config;
            RAISE WARNING 'Network "%" had unknown config type, using default', network_record.name;
        END IF;

        -- Update only if changed
        IF fixed_config IS DISTINCT FROM network_record.features_config THEN
            UPDATE networks
            SET features_config = fixed_config
            WHERE id = network_record.id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Fixed % networks with incorrect format', fixed_count;
END $$;

-- Now update the audit log function to handle all edge cases
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
    parsed_old jsonb;
    parsed_new jsonb;
BEGIN
    -- Handle NULL configs
    IF old_config IS NULL THEN
        parsed_old := '{}'::jsonb;
    ELSE
        parsed_old := old_config;
    END IF;

    IF new_config IS NULL THEN
        parsed_new := '{}'::jsonb;
    ELSE
        parsed_new := new_config;
    END IF;

    -- Handle stringified JSON (double-encoded)
    IF jsonb_typeof(parsed_old) = 'string' THEN
        BEGIN
            parsed_old := (parsed_old #>> '{}')::jsonb;
        EXCEPTION WHEN OTHERS THEN
            parsed_old := '{}'::jsonb;
        END;
    END IF;

    IF jsonb_typeof(parsed_new) = 'string' THEN
        BEGIN
            parsed_new := (parsed_new #>> '{}')::jsonb;
        EXCEPTION WHEN OTHERS THEN
            parsed_new := '{}'::jsonb;
        END;
    END IF;

    -- Only process if both are objects
    IF jsonb_typeof(parsed_old) != 'object' OR jsonb_typeof(parsed_new) != 'object' THEN
        RETURN;
    END IF;

    -- Iterate through all keys in features_config
    FOR key IN
        SELECT DISTINCT k FROM (
            SELECT jsonb_object_keys(parsed_new) AS k
            UNION
            SELECT jsonb_object_keys(parsed_old) AS k
        ) keys
    LOOP
        -- Skip allow_member_event_publishing as it's already logged
        IF key = 'allow_member_event_publishing' THEN
            CONTINUE;
        END IF;

        old_val := parsed_old->key;
        new_val := parsed_new->key;

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

-- Update the main audit trigger function to handle edge cases better
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
    v_old_config jsonb;
    v_new_config jsonb;
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
    BEGIN
        v_client_ip := inet(current_setting('request.headers', true)::json->>'cf-connecting-ip');
    EXCEPTION WHEN OTHERS THEN
        v_client_ip := NULL;
    END;

    BEGIN
        v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        v_user_agent := NULL;
    END;

    BEGIN
        v_request_id := current_setting('request.headers', true)::json->>'x-request-id';
    EXCEPTION WHEN OTHERS THEN
        v_request_id := NULL;
    END;

    -- Normalize configs (handle stringified JSON)
    v_old_config := OLD.features_config;
    v_new_config := NEW.features_config;

    -- Handle stringified configs
    IF v_old_config IS NOT NULL AND jsonb_typeof(v_old_config) = 'string' THEN
        BEGIN
            v_old_config := (v_old_config #>> '{}')::jsonb;
        EXCEPTION WHEN OTHERS THEN
            v_old_config := '{}'::jsonb;
        END;
    END IF;

    IF v_new_config IS NOT NULL AND jsonb_typeof(v_new_config) = 'string' THEN
        BEGIN
            v_new_config := (v_new_config #>> '{}')::jsonb;
        EXCEPTION WHEN OTHERS THEN
            v_new_config := '{}'::jsonb;
        END;
    END IF;

    -- Handle different operation types
    IF TG_OP = 'UPDATE' THEN
        -- Extract the allow_member_event_publishing values
        IF jsonb_typeof(v_old_config) = 'object' THEN
            v_old_allow_publishing := (v_old_config->>'allow_member_event_publishing')::boolean;
        END IF;

        IF jsonb_typeof(v_new_config) = 'object' THEN
            v_new_allow_publishing := (v_new_config->>'allow_member_event_publishing')::boolean;
        END IF;

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
        IF jsonb_typeof(v_new_config) = 'object' THEN
            v_new_allow_publishing := (v_new_config->>'allow_member_event_publishing')::boolean;
        END IF;

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
        IF jsonb_typeof(v_old_config) = 'object' THEN
            v_old_allow_publishing := (v_old_config->>'allow_member_event_publishing')::boolean;
        END IF;

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

-- Verify the fix
DO $$
DECLARE
    invalid_count integer;
    string_count integer;
BEGIN
    -- Check for any remaining strings
    SELECT COUNT(*) INTO string_count
    FROM networks
    WHERE features_config IS NOT NULL
    AND jsonb_typeof(features_config) = 'string';

    -- Check for any non-objects
    SELECT COUNT(*) INTO invalid_count
    FROM networks
    WHERE features_config IS NOT NULL
    AND jsonb_typeof(features_config) != 'object';

    IF string_count > 0 THEN
        RAISE WARNING 'Still have % networks with stringified features_config', string_count;
    END IF;

    IF invalid_count > 0 THEN
        RAISE WARNING 'Still have % networks with invalid features_config format', invalid_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All networks now have valid features_config format (objects only)';
    END IF;
END $$;