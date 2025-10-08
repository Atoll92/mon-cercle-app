-- Debug query to check annonces_moderation data
-- Run this in Supabase SQL Editor

-- Check the specific failing row
SELECT
  id,
  network_id,
  category,
  length(category) as category_length,
  octet_length(category) as category_bytes,
  category = 'general' as exact_match,
  category::bytea as category_hex,
  quote_literal(category) as quoted_category
FROM public.annonces_moderation
WHERE id = '2c65363a-ec95-430a-a3f3-fc18bd6e6b64'::uuid;

-- Check all RezoProSpec annonces categories
SELECT
  category,
  length(category) as len,
  count(*) as count,
  category = 'general' as is_general,
  category = 'logement' as is_logement,
  category = 'ateliers' as is_ateliers
FROM public.annonces_moderation
WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
GROUP BY category
ORDER BY category;

-- Check for any non-standard characters or whitespace
SELECT
  id,
  category,
  length(category) as len,
  length(trim(category)) as trimmed_len,
  category != trim(category) as has_whitespace,
  ascii(substring(category from 1 for 1)) as first_char_ascii,
  ascii(substring(category from length(category) for 1)) as last_char_ascii
FROM public.annonces_moderation
WHERE network_id = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508'::uuid
AND category NOT IN ('general', 'logement', 'ateliers')
LIMIT 20;

-- Check all constraints on the table
SELECT
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
AND rel.relname = 'annonces_moderation'
AND con.contype = 'c'
ORDER BY con.conname;
