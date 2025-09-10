-- ============================================================================
-- Marketplace Functions Only
-- Run this in Supabase SQL Editor to create marketplace functions
-- ============================================================================

-- Function 1: Initialize marketplace settings for a network
CREATE OR REPLACE FUNCTION initialize_marketplace_settings(network_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    settings_id uuid;
BEGIN
    -- Check if settings already exist
    SELECT id INTO settings_id 
    FROM marketplace_settings 
    WHERE network_id = network_uuid;
    
    -- Return existing settings if found
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
        false, -- Disabled by default, admin must enable
        true,
        true,
        true,
        true, -- Require approval by default for moderation
        10.00, -- 10% commission
        0.50, -- 50 cent minimum commission
        'USD',
        ARRAY['USD', 'EUR', 'GBP'],
        1.00 -- $1 minimum listing price
    ) RETURNING id INTO settings_id;
    
    RETURN settings_id;
END;
$$;

-- Function 2: Create default marketplace categories
CREATE OR REPLACE FUNCTION create_default_marketplace_categories(network_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_profile_id uuid;
BEGIN
    -- Get a network admin to attribute category creation
    SELECT id INTO admin_profile_id
    FROM profiles 
    WHERE network_id = network_uuid AND role = 'admin'
    LIMIT 1;
    
    -- Create default categories (use ON CONFLICT to avoid duplicates)
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

-- Function 3: Get marketplace statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_marketplace_stats(p_network_id uuid)
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
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM marketplace_listings WHERE network_id = p_network_id)::bigint,
        (SELECT COUNT(*) FROM marketplace_listings WHERE network_id = p_network_id AND status = 'active')::bigint,
        (SELECT COUNT(*) FROM marketplace_orders WHERE network_id = p_network_id)::bigint,
        (SELECT COALESCE(SUM(total_amount), 0) FROM marketplace_orders WHERE network_id = p_network_id AND order_status = 'completed'),
        (SELECT COALESCE(SUM(commission_amount), 0) FROM marketplace_orders WHERE network_id = p_network_id AND order_status = 'completed'),
        (SELECT COUNT(*) FROM marketplace_reviews WHERE network_id = p_network_id)::bigint;
END;
$$;

-- Function 4: Calculate commission for a sale
CREATE OR REPLACE FUNCTION calculate_listing_commission(
    p_network_id uuid, 
    p_sale_amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    commission_rate numeric;
    min_commission numeric;
    max_commission numeric;
    calculated_commission numeric;
BEGIN
    -- Get commission settings for the network
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
    
    -- If no settings found, use defaults
    IF NOT FOUND THEN
        commission_rate := 10.00; -- 10%
        min_commission := 0.50;   -- $0.50
        max_commission := NULL;   -- No max
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

-- Function 5: Setup marketplace for new network (combines initialization)
CREATE OR REPLACE FUNCTION setup_network_marketplace(network_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    settings_id uuid;
BEGIN
    -- Initialize settings
    SELECT initialize_marketplace_settings(network_uuid) INTO settings_id;
    
    -- Create default categories
    PERFORM create_default_marketplace_categories(network_uuid);
    
    RETURN true;
END;
$$;

-- Test the functions work by selecting them
SELECT 'Functions created successfully!' as status;