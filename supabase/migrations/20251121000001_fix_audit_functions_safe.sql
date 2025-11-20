-- Safe fix for audit functions to handle all edge cases
-- This replaces the problematic functions with safer versions

-- First, drop and recreate the helper function with better error handling
DROP FUNCTION IF EXISTS public.log_other_feature_changes CASCADE;

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

    -- Only process if both are objects (not arrays, strings, numbers, etc)
    IF jsonb_typeof(parsed_old) != 'object' THEN
        RETURN;
    END IF;

    IF jsonb_typeof(parsed_new) != 'object' THEN
        RETURN;
    END IF;

    -- Use a safer approach to iterate through keys
    BEGIN
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
                BEGIN
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
                EXCEPTION WHEN OTHERS THEN
                    -- Log error but don't fail the whole operation
                    RAISE WARNING 'Could not log change for field %: %', key, SQLERRM;
                END;
            END IF;
        END LOOP;
    EXCEPTION WHEN OTHERS THEN
        -- If iteration fails, just log a warning and return
        RAISE WARNING 'Could not process feature changes: %', SQLERRM;
        RETURN;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now fix the data with a safer approach
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
    current_type text;
BEGIN
    -- First, disable the trigger temporarily to avoid issues during migration
    ALTER TABLE networks DISABLE TRIGGER audit_network_features_trigger;

    -- Count different types
    FOR network_record IN
        SELECT id, name, features_config
        FROM networks
    LOOP
        IF network_record.features_config IS NULL THEN
            null_count := null_count + 1;
        ELSE
            current_type := jsonb_typeof(network_record.features_config);
            IF current_type = 'string' THEN
                string_count := string_count + 1;
            ELSIF current_type = 'array' THEN
                array_count := array_count + 1;
            ELSIF current_type = 'object' THEN
                object_count := object_count + 1;
            END IF;
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

        BEGIN
            -- Handle different cases
            IF network_record.features_config IS NULL THEN
                -- Use default config for NULL values
                fixed_config := default_config;
                RAISE NOTICE 'Network "%" had NULL config, using default', network_record.name;

            ELSE
                current_type := jsonb_typeof(network_record.features_config);

                IF current_type = 'string' THEN
                    -- This is likely a double-stringified JSON
                    BEGIN
                        -- Try to parse the string as JSON
                        fixed_config := (network_record.features_config #>> '{}')::jsonb;

                        -- Check if the parsed value is an object
                        IF jsonb_typeof(fixed_config) = 'object' THEN
                            -- Merge with defaults to ensure all keys exist
                            fixed_config := default_config || fixed_config;
                            RAISE NOTICE 'Network "%" had stringified config, parsed and fixed', network_record.name;
                            fixed_count := fixed_count + 1;
                        ELSE
                            -- Parsed but not an object, use default
                            fixed_config := default_config;
                            RAISE WARNING 'Network "%" had stringified non-object config, using default', network_record.name;
                        END IF;
                    EXCEPTION WHEN OTHERS THEN
                        -- If parsing fails, use default
                        fixed_config := default_config;
                        RAISE WARNING 'Network "%" had malformed stringified config: %, using default', network_record.name, SQLERRM;
                    END;

                ELSIF current_type = 'array' THEN
                    -- This shouldn't be an array, use default
                    fixed_config := default_config;
                    RAISE NOTICE 'Network "%" had array config (wrong type), using default', network_record.name;
                    fixed_count := fixed_count + 1;

                ELSIF current_type = 'object' THEN
                    -- Already an object, just ensure all keys exist
                    fixed_config := default_config || network_record.features_config;

                ELSE
                    -- Scalar or other type, use default
                    fixed_config := default_config;
                    RAISE WARNING 'Network "%" had % config type, using default', network_record.name, current_type;
                END IF;
            END IF;

            -- Update only if changed
            IF fixed_config IS DISTINCT FROM network_record.features_config THEN
                UPDATE networks
                SET features_config = fixed_config
                WHERE id = network_record.id;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to fix network "%": %, using default', network_record.name, SQLERRM;
            -- Try to at least set a valid config
            UPDATE networks
            SET features_config = default_config
            WHERE id = network_record.id;
        END;
    END LOOP;

    -- Re-enable the trigger
    ALTER TABLE networks ENABLE TRIGGER audit_network_features_trigger;

    RAISE NOTICE 'Fixed % networks with incorrect format', fixed_count;
END $$;

-- Update the main audit trigger function to be safer
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
        BEGIN
            SELECT email INTO v_user_email
            FROM auth.users
            WHERE id = v_user_id;
        EXCEPTION WHEN OTHERS THEN
            v_user_email := NULL;
        END;

        -- Try to get profile information for this network
        BEGIN
            SELECT p.id, p.full_name INTO v_profile_id, v_profile_name
            FROM public.profiles p
            WHERE p.user_id = v_user_id
            AND p.network_id = COALESCE(NEW.id, OLD.id)
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            v_profile_id := NULL;
            v_profile_name := NULL;
        END;
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

    -- Handle stringified configs safely
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
        -- Extract the allow_member_event_publishing values safely
        BEGIN
            IF jsonb_typeof(v_old_config) = 'object' THEN
                v_old_allow_publishing := (v_old_config->>'allow_member_event_publishing')::boolean;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_old_allow_publishing := NULL;
        END;

        BEGIN
            IF jsonb_typeof(v_new_config) = 'object' THEN
                v_new_allow_publishing := (v_new_config->>'allow_member_event_publishing')::boolean;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_new_allow_publishing := NULL;
        END;

        -- Check if allow_member_event_publishing changed
        IF v_old_allow_publishing IS DISTINCT FROM v_new_allow_publishing THEN
            BEGIN
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
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Could not log allow_member_event_publishing change: %', SQLERRM;
            END;
        END IF;

        -- Also log if any other features_config fields changed
        IF OLD.features_config IS DISTINCT FROM NEW.features_config THEN
            BEGIN
                -- Check for other feature changes
                PERFORM public.log_other_feature_changes(OLD.features_config, NEW.features_config, NEW.id, NEW.name, v_user_id, v_user_email, v_profile_id, v_profile_name);
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Could not log other feature changes: %', SQLERRM;
            END;
        END IF;

    ELSIF TG_OP = 'INSERT' THEN
        -- Log new network creation with allow_member_event_publishing setting
        BEGIN
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
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not log INSERT: %', SQLERRM;
        END;

    ELSIF TG_OP = 'DELETE' THEN
        -- Log network deletion
        BEGIN
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
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not log DELETE: %', SQLERRM;
        END;
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