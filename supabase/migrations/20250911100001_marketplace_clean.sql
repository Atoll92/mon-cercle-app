-- ============================================================================
-- Clean Marketplace System Migration (No Course Dependencies)
-- Created: 2025-01-09
-- Description: Marketplace system without any course table references
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUMS AND TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE marketplace_listing_type AS ENUM ('physical', 'digital', 'service');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE marketplace_listing_status AS ENUM ('draft', 'pending', 'active', 'inactive', 'sold', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE review_type AS ENUM ('listing', 'seller');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('sale', 'commission', 'refund', 'payout');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. MARKETPLACE CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    slug varchar(100) NOT NULL,
    description text,
    icon varchar(100),
    color varchar(7) DEFAULT '#1976d2',
    parent_category_id uuid REFERENCES marketplace_categories(id) ON DELETE SET NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    item_count integer DEFAULT 0,
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 3. MARKETPLACE LISTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_listings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    seller_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    description text,
    short_description varchar(500),
    category_id uuid REFERENCES marketplace_categories(id) ON DELETE SET NULL,
    tags varchar(50)[],
    price numeric(10,2) NOT NULL DEFAULT 0,
    currency varchar(3) DEFAULT 'USD',
    original_price numeric(10,2),
    price_type varchar(20) DEFAULT 'fixed',
    listing_type marketplace_listing_type NOT NULL DEFAULT 'physical',
    status marketplace_listing_status NOT NULL DEFAULT 'draft',
    is_digital boolean GENERATED ALWAYS AS (listing_type = 'digital') STORED,
    requires_shipping boolean GENERATED ALWAYS AS (listing_type = 'physical') STORED,
    stock_quantity integer DEFAULT 1,
    unlimited_stock boolean DEFAULT false,
    thumbnail_url text,
    media_urls text[],
    media_metadata jsonb DEFAULT '{}',
    slug varchar(255),
    meta_title varchar(150),
    meta_description varchar(300),
    view_count integer DEFAULT 0,
    favorite_count integer DEFAULT 0,
    sales_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone
);

-- ============================================================================
-- 4. MARKETPLACE ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    buyer_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_number varchar(50) UNIQUE NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0,
    shipping_amount numeric(10,2) DEFAULT 0,
    commission_amount numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2) NOT NULL,
    currency varchar(3) DEFAULT 'USD',
    order_status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    shipping_address jsonb,
    shipping_method varchar(100),
    tracking_number varchar(255),
    estimated_delivery_date timestamp with time zone,
    actual_delivery_date timestamp with time zone,
    stripe_payment_intent_id text,
    stripe_transfer_id text,
    payment_method_details jsonb,
    buyer_notes text,
    seller_notes text,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone
);

-- ============================================================================
-- 5. ORDER ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_order_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE RESTRICT,
    title varchar(255) NOT NULL,
    description text,
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    download_url text,
    download_count integer DEFAULT 0,
    download_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- 6. REVIEWS AND RATINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    reviewer_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    review_type review_type NOT NULL,
    listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    seller_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title varchar(200),
    content text,
    is_verified_purchase boolean DEFAULT false,
    order_id uuid REFERENCES marketplace_orders(id) ON DELETE SET NULL,
    is_hidden boolean DEFAULT false,
    is_flagged boolean DEFAULT false,
    flag_reason text,
    moderated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    moderated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 7. MARKETPLACE CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL UNIQUE REFERENCES networks(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT false,
    allow_physical_goods boolean DEFAULT true,
    allow_digital_goods boolean DEFAULT true,
    allow_services boolean DEFAULT true,
    require_listing_approval boolean DEFAULT true,
    auto_approve_trusted_sellers boolean DEFAULT false,
    commission_rate_percentage numeric(5,2) DEFAULT 10.00,
    min_commission_amount numeric(10,2) DEFAULT 0.50,
    max_commission_amount numeric(10,2),
    default_currency varchar(3) DEFAULT 'USD',
    supported_currencies varchar(3)[] DEFAULT ARRAY['USD', 'EUR', 'GBP'],
    min_listing_price numeric(10,2) DEFAULT 1.00,
    max_listing_price numeric(10,2),
    default_shipping_zone varchar(100) DEFAULT 'United States',
    max_shipping_cost numeric(10,2),
    free_shipping_threshold numeric(10,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 8. TRANSACTION RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency varchar(3) DEFAULT 'USD',
    status transaction_status NOT NULL DEFAULT 'pending',
    order_id uuid REFERENCES marketplace_orders(id) ON DELETE SET NULL,
    seller_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    buyer_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    stripe_transfer_id text,
    stripe_payment_intent_id text,
    stripe_refund_id text,
    description text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone
);

-- ============================================================================
-- 9. FAVORITES/WISHLIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_favorites (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(profile_id, listing_id)
);

-- ============================================================================
-- 10. ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;

-- Categories Policies
DROP POLICY IF EXISTS "Network members can view active categories" ON marketplace_categories;
CREATE POLICY "Network members can view active categories"
ON marketplace_categories FOR SELECT
USING (
    is_active = true AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_categories.network_id 
        AND profiles.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Network admins can manage categories" ON marketplace_categories;
CREATE POLICY "Network admins can manage categories"
ON marketplace_categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_categories.network_id 
        AND profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Listings Policies
DROP POLICY IF EXISTS "Network members can view approved listings" ON marketplace_listings;
CREATE POLICY "Network members can view approved listings"
ON marketplace_listings FOR SELECT
USING (
    status = 'active' AND is_approved = true AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_listings.network_id 
        AND profiles.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Sellers can view their own listings" ON marketplace_listings;
CREATE POLICY "Sellers can view their own listings"
ON marketplace_listings FOR SELECT
USING (
    seller_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Network members can create listings" ON marketplace_listings;
CREATE POLICY "Network members can create listings"
ON marketplace_listings FOR INSERT
WITH CHECK (
    seller_profile_id IN (
        SELECT id FROM profiles 
        WHERE user_id = auth.uid() 
        AND network_id = marketplace_listings.network_id
    )
);

DROP POLICY IF EXISTS "Sellers can update their own listings" ON marketplace_listings;
CREATE POLICY "Sellers can update their own listings"
ON marketplace_listings FOR UPDATE
USING (
    seller_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Network admins can manage all listings" ON marketplace_listings;
CREATE POLICY "Network admins can manage all listings"
ON marketplace_listings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_listings.network_id 
        AND profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Orders Policies
DROP POLICY IF EXISTS "Order participants can view orders" ON marketplace_orders;
CREATE POLICY "Order participants can view orders"
ON marketplace_orders FOR SELECT
USING (
    buyer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    seller_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_orders.network_id 
        AND profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Buyers can create orders" ON marketplace_orders;
CREATE POLICY "Buyers can create orders"
ON marketplace_orders FOR INSERT
WITH CHECK (
    buyer_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Order Items Policies  
DROP POLICY IF EXISTS "Order participants can view order items" ON marketplace_order_items;
CREATE POLICY "Order participants can view order items"
ON marketplace_order_items FOR SELECT
USING (
    order_id IN (
        SELECT id FROM marketplace_orders
        WHERE buyer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR seller_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
);

-- Reviews Policies
DROP POLICY IF EXISTS "Network members can view reviews" ON marketplace_reviews;
CREATE POLICY "Network members can view reviews"
ON marketplace_reviews FOR SELECT
USING (
    is_hidden = false AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_reviews.network_id 
        AND profiles.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can create reviews" ON marketplace_reviews;
CREATE POLICY "Users can create reviews"
ON marketplace_reviews FOR INSERT
WITH CHECK (
    reviewer_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Settings Policies
DROP POLICY IF EXISTS "Network admins can manage settings" ON marketplace_settings;
CREATE POLICY "Network admins can manage settings"
ON marketplace_settings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_settings.network_id 
        AND profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Transactions Policies
DROP POLICY IF EXISTS "System can manage transactions" ON marketplace_transactions;
CREATE POLICY "System can manage transactions"
ON marketplace_transactions FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Network admins can view transactions" ON marketplace_transactions;
CREATE POLICY "Network admins can view transactions"
ON marketplace_transactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_transactions.network_id 
        AND profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Favorites Policies
DROP POLICY IF EXISTS "Users can manage favorites" ON marketplace_favorites;
CREATE POLICY "Users can manage favorites"
ON marketplace_favorites FOR ALL
USING (
    profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- ============================================================================
-- 11. BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Initialize marketplace settings
CREATE OR REPLACE FUNCTION initialize_marketplace_settings(network_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    settings_id uuid;
BEGIN
    SELECT id INTO settings_id 
    FROM marketplace_settings 
    WHERE network_id = network_uuid;
    
    IF settings_id IS NOT NULL THEN
        RETURN settings_id;
    END IF;
    
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

-- Create default categories
CREATE OR REPLACE FUNCTION create_default_marketplace_categories(network_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_profile_id uuid;
BEGIN
    SELECT id INTO admin_profile_id
    FROM profiles 
    WHERE network_id = network_uuid AND role = 'admin'
    LIMIT 1;
    
    INSERT INTO marketplace_categories (network_id, name, slug, description, icon, color, created_by) VALUES
    (network_uuid, 'Electronics', 'electronics', 'Computers, phones, gadgets, and electronic devices', 'PhoneAndroid', '#2196F3', admin_profile_id),
    (network_uuid, 'Books & Media', 'books-media', 'Books, audiobooks, music, movies, and digital content', 'MenuBook', '#FF9800', admin_profile_id),
    (network_uuid, 'Clothing & Fashion', 'clothing-fashion', 'Apparel, shoes, accessories, and fashion items', 'Checkroom', '#E91E63', admin_profile_id),
    (network_uuid, 'Home & Garden', 'home-garden', 'Furniture, decor, tools, and home improvement', 'Home', '#4CAF50', admin_profile_id),
    (network_uuid, 'Sports & Recreation', 'sports-recreation', 'Sports equipment, outdoor gear, and recreational items', 'SportsBasketball', '#FF5722', admin_profile_id),
    (network_uuid, 'Digital Downloads', 'digital-downloads', 'Software, templates, digital art, and downloadable content', 'CloudDownload', '#9C27B0', admin_profile_id),
    (network_uuid, 'Services', 'services', 'Consulting, freelance work, and professional services', 'Work', '#607D8B', admin_profile_id)
    ON CONFLICT DO NOTHING;
END;
$$;

-- Get marketplace statistics
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
        (SELECT COUNT(*) FROM marketplace_listings WHERE network_id = p_network_id),
        (SELECT COUNT(*) FROM marketplace_listings WHERE network_id = p_network_id AND status = 'active'),
        (SELECT COUNT(*) FROM marketplace_orders WHERE network_id = p_network_id),
        (SELECT COALESCE(SUM(total_amount), 0) FROM marketplace_orders WHERE network_id = p_network_id AND order_status = 'completed'),
        (SELECT COALESCE(SUM(commission_amount), 0) FROM marketplace_orders WHERE network_id = p_network_id AND order_status = 'completed'),
        (SELECT COUNT(*) FROM marketplace_reviews WHERE network_id = p_network_id);
END;
$$;

-- Generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((random() * 999999)::text, 6, '0');
    
    WHILE EXISTS (SELECT 1 FROM marketplace_orders WHERE order_number = NEW.order_number) LOOP
        NEW.order_number = 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((random() * 999999)::text, 6, '0');
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trigger_generate_order_number ON marketplace_orders;
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON marketplace_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE PROCEDURE generate_order_number();

-- ============================================================================
-- 12. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_network ON marketplace_categories(network_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_network ON marketplace_listings(network_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_network ON marketplace_orders(network_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON marketplace_orders(seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_listing ON marketplace_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_profile ON marketplace_favorites(profile_id);

-- Migration log
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    '20250911100001_marketplace_clean', 
    'completed', 
    'Clean marketplace system without course dependencies'
) ON CONFLICT DO NOTHING;