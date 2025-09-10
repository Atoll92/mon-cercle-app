-- Check if marketplace functions exist
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname LIKE '%marketplace%' 
   OR proname LIKE '%get_marketplace_stats%'
   OR proname LIKE '%initialize_marketplace%'
   OR proname LIKE '%create_default_marketplace%'
ORDER BY proname;