-- Test if functions exist by calling them
SELECT proname as function_name, 
       pronargs as num_arguments,
       pg_catalog.pg_get_function_identity_arguments(oid) as arguments
FROM pg_catalog.pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
    'initialize_marketplace_settings',
    'create_default_marketplace_categories', 
    'get_marketplace_stats',
    'calculate_listing_commission',
    'setup_network_marketplace'
)
ORDER BY proname;