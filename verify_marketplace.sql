-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'marketplace%'
ORDER BY table_name;

-- 2. Check if functions exist in pg_proc
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_catalog.pg_get_function_result(p.oid) as result_type,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname LIKE '%marketplace%'
ORDER BY p.proname;

-- 3. Try to test initialize_marketplace_settings function
-- This will error if function doesn't exist
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'initialize_marketplace_settings'
) as function_exists;

-- 4. Check routines from information schema
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%marketplace%';