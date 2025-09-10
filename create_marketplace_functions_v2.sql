-- ============================================================================
-- Marketplace Functions with Explicit Schema and Comments
-- This ensures functions appear in Supabase Dashboard
-- ============================================================================

-- Drop existing functions if they exist (clean slate)
DROP FUNCTION IF EXISTS public.initialize_marketplace_settings(uuid);
DROP FUNCTION IF EXISTS public.create_default_marketplace_categories(uuid);
DROP FUNCTION IF EXISTS public.get_marketplace_stats(uuid);
DROP FUNCTION IF EXISTS public.calculate_listing_commission(uuid, numeric);
DROP FUNCTION IF EXISTS public.setup_network_marketplace(uuid);

-- ============================================================================
-- Function 1: Initialize marketplace settings
-- ============================================================================
CREATE OR REPLACE FUNCTION public.initialize_marketplace_settings(network_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    settings_id uuid;
BEGIN
    -- Check if settings already exist
    SELECT id INTO settings_id 
    FROM marketplace_settings 
    WHERE network_id = network_uuid;
    
    IF settings_id IS NOT NULL THEN
        RETURN settings_id;
    END IF;
    
    -- Create default marketplace settings
    INSERT INTO marketplace_settings (
        network_id,
        is_enabled,
        allow_physical_goods,
        allow_digital_goods, 
        allow_services,
        require_listing_approval,
        commission_rate_percentage,
        min_commission_amount,
        default_currency,
        supported_currencies,
        min_listing_price
    ) VALUES (
        network_uuid,
        false,
        true,
        true,
        true,
        true,
        10.00,
        0.50,
        'USD',
        ARRAY['USD', 'EUR', 'GBP'],
        1.00
    ) RETURNING id INTO settings_id;
    
    RETURN settings_id;
END;
$$;

COMMENT ON FUNCTION public.initialize_marketplace_settings(uuid) IS 'Initialize marketplace settings for a network with default configuration';

-- ============================================================================
-- Function 2: Create default categories
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_default_marketplace_categories(network_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_profile_id uuid;
BEGIN
    -- Get a network admin
    SELECT id INTO admin_profile_id
    FROM profiles 
    WHERE network_id = network_uuid AND role = 'admin'
    LIMIT 1;
    
    -- Create default categories
    INSERT INTO marketplace_categories (network_id, name, slug, description, icon, color, created_by) VALUES
    (network_uuid, 'Electronics', 'electronics', 'Computers, phones, gadgets, and electronic devices', 'PhoneAndroid', '#2196F3', admin_profile_id),
    (network_uuid, 'Books & Media', 'books-media', 'Books, audiobooks, music, movies, and digital content', 'MenuBook', '#FF9800', admin_profile_id),
    (network_uuid, 'Clothing & Fashion', 'clothing-fashion', 'Apparel, shoes, accessories, and fashion items', 'Checkroom', '#E91E63', admin_profile_id),
    (network_uuid, 'Home & Garden', 'home-garden', 'Furniture, decor, tools, and home improvement', 'Home', '#4CAF50', admin_profile_id),
    (network_uuid, 'Sports & Recreation', 'sports-recreation', 'Sports equipment, outdoor gear, and recreational items', 'SportsBasketball', '#FF5722', admin_profile_id),
    (network_uuid, 'Digital Downloads', 'digital-downloads', 'Software, templates, digital art, and downloadable content', 'CloudDownload', '#9C27B0', admin_profile_id),
    (network_uuid, 'Services', 'services', 'Consulting, freelance work, and professional services', 'Work', '#607D8B', admin_profile_id)
    ON CONFLICT (network_id, slug) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.create_default_marketplace_categories(uuid) IS 'Create default marketplace categories for a network';

-- ============================================================================
-- Function 3: Get marketplace statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_marketplace_stats(p_network_id uuid)
RETURNS TABLE (
    total_listings bigint,
    active_listings bigint,
    total_orders bigint,
    total_revenue numeric,
    total_commission numeric,
    total_reviews bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM marketplace_listings WHERE network_id = p_network_id)::bigint,
        (SELECT COUNT(*) FROM marketplace_listings WHERE network_id = p_network_id AND status = 'active')::bigint,
        (SELECT COUNT(*) FROM marketplace_orders WHERE network_id = p_network_id)::bigint,
        (SELECT COALESCE(SUM(total_amount), 0)::numeric FROM marketplace_orders WHERE network_id = p_network_id AND order_status = 'completed'),
        (SELECT COALESCE(SUM(commission_amount), 0)::numeric FROM marketplace_orders WHERE network_id = p_network_id AND order_status = 'completed'),
        (SELECT COUNT(*) FROM marketplace_reviews WHERE network_id = p_network_id)::bigint;
END;
$$;

COMMENT ON FUNCTION public.get_marketplace_stats(uuid) IS 'Get marketplace statistics for network admin dashboard';

-- ============================================================================
-- Function 4: Calculate commission
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_listing_commission(
    p_network_id uuid, 
    p_sale_amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    commission_rate numeric;
    min_commission numeric;
    max_commission numeric;
    calculated_commission numeric;
BEGIN
    -- Get commission settings
    SELECT 
        commission_rate_percentage,
        min_commission_amount,
        max_commission_amount
    INTO 
        commission_rate,
        min_commission,
        max_commission
    FROM marketplace_settings 
    WHERE network_id = p_network_id;
    
    -- Use defaults if not found
    IF NOT FOUND THEN
        commission_rate := 10.00;
        min_commission := 0.50;
        max_commission := NULL;
    END IF;
    
    -- Calculate commission
    calculated_commission := p_sale_amount * (commission_rate / 100.0);
    
    -- Apply minimum
    calculated_commission := GREATEST(calculated_commission, min_commission);
    
    -- Apply maximum if set
    IF max_commission IS NOT NULL THEN
        calculated_commission := LEAST(calculated_commission, max_commission);
    END IF;
    
    RETURN calculated_commission;
END;
$$;

COMMENT ON FUNCTION public.calculate_listing_commission(uuid, numeric) IS 'Calculate commission amount for a marketplace sale';

-- ============================================================================
-- Function 5: Setup marketplace
-- ============================================================================
CREATE OR REPLACE FUNCTION public.setup_network_marketplace(network_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    settings_id uuid;
BEGIN
    -- Initialize settings
    settings_id := public.initialize_marketplace_settings(network_uuid);
    
    -- Create default categories
    PERFORM public.create_default_marketplace_categories(network_uuid);
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

COMMENT ON FUNCTION public.setup_network_marketplace(uuid) IS 'One-click marketplace setup for a network';

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.initialize_marketplace_settings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_marketplace_categories(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_listing_commission(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_network_marketplace(uuid) TO authenticated;

-- ============================================================================
-- Verify functions were created
-- ============================================================================
SELECT 
    p.proname as function_name,
    'Created successfully' as status
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname IN (
    'initialize_marketplace_settings',
    'create_default_marketplace_categories',
    'get_marketplace_stats',
    'calculate_listing_commission',
    'setup_network_marketplace'
)
ORDER BY p.proname;