-- ============================================================================
-- Complete Marketplace System Migration
-- Created: 2025-01-09
-- Description: Single migration file for complete marketplace functionality
-- Features: Physical/digital goods, services, orders, reviews, commissions
-- Note: Courses are separate and admin-only (not part of marketplace)
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
    icon varchar(100), -- Material UI icon name
    color varchar(7) DEFAULT '#1976d2', -- Hex color code
    parent_category_id uuid REFERENCES marketplace_categories(id) ON DELETE SET NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    item_count integer DEFAULT 0, -- Denormalized count for performance
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Add constraints if they don't exist
DO $$ BEGIN
    ALTER TABLE marketplace_categories ADD CONSTRAINT marketplace_categories_unique_network_slug 
        UNIQUE (network_id, slug);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE marketplace_categories ADD CONSTRAINT marketplace_categories_valid_color 
        CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 3. MARKETPLACE LISTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_listings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    seller_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Basic Information
    title varchar(255) NOT NULL,
    description text,
    short_description varchar(500), -- For listing previews
    
    -- Categorization
    category_id uuid REFERENCES marketplace_categories(id) ON DELETE SET NULL,
    tags varchar(50)[], -- Array of tags for search
    
    -- Pricing
    price numeric(10,2) NOT NULL DEFAULT 0,
    currency varchar(3) DEFAULT 'USD',
    original_price numeric(10,2), -- For showing discounts
    price_type varchar(20) DEFAULT 'fixed', -- 'fixed', 'negotiable', 'auction'
    
    -- Type and Status
    listing_type marketplace_listing_type NOT NULL DEFAULT 'physical',
    status marketplace_listing_status NOT NULL DEFAULT 'draft',
    
    -- Digital/Physical Specific
    is_digital boolean GENERATED ALWAYS AS (listing_type = 'digital') STORED,
    requires_shipping boolean GENERATED ALWAYS AS (listing_type = 'physical') STORED,
    
    -- Inventory (for physical goods)
    stock_quantity integer DEFAULT 1,
    unlimited_stock boolean DEFAULT false,
    
    -- Media
    thumbnail_url text,
    media_urls text[], -- Array of image/video URLs
    media_metadata jsonb DEFAULT '{}', -- Metadata for each media item
    
    -- SEO and Discovery
    slug varchar(255),
    meta_title varchar(150),
    meta_description varchar(300),
    
    -- Engagement
    view_count integer DEFAULT 0,
    favorite_count integer DEFAULT 0,
    sales_count integer DEFAULT 0,
    
    -- Moderation
    is_featured boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at timestamp with time zone,
    rejection_reason text,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone
);

-- Add constraints
DO $$ BEGIN
    ALTER TABLE marketplace_listings ADD CONSTRAINT marketplace_listings_valid_price 
        CHECK (price >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE marketplace_listings ADD CONSTRAINT marketplace_listings_valid_stock 
        CHECK (stock_quantity >= 0 OR unlimited_stock = true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE marketplace_listings ADD CONSTRAINT marketplace_listings_title_length 
        CHECK (char_length(title) >= 3);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 4. MARKETPLACE ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    buyer_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Order Details
    order_number varchar(50) UNIQUE NOT NULL, -- Human-readable order number
    
    -- Pricing
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0,
    shipping_amount numeric(10,2) DEFAULT 0,
    commission_amount numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2) NOT NULL,
    currency varchar(3) DEFAULT 'USD',
    
    -- Status Tracking
    order_status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    
    -- Shipping Information (for physical goods)
    shipping_address jsonb, -- {name, address_line_1, address_line_2, city, state, postal_code, country}
    shipping_method varchar(100),
    tracking_number varchar(255),
    estimated_delivery_date timestamp with time zone,
    actual_delivery_date timestamp with time zone,
    
    -- Payment Integration
    stripe_payment_intent_id text,
    stripe_transfer_id text, -- For seller payout
    payment_method_details jsonb,
    
    -- Notes and Communication
    buyer_notes text,
    seller_notes text,
    admin_notes text,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone
);

-- Add constraints
DO $$ BEGIN
    ALTER TABLE marketplace_orders ADD CONSTRAINT marketplace_orders_positive_amounts 
        CHECK (subtotal >= 0 AND tax_amount >= 0 AND shipping_amount >= 0 AND commission_amount >= 0 AND total_amount >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 5. ORDER ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_order_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE RESTRICT,
    
    -- Item Details (snapshot at time of purchase)
    title varchar(255) NOT NULL, -- Snapshot of listing title
    description text, -- Snapshot of listing description
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    
    -- Digital Delivery
    download_url text, -- For digital products
    download_count integer DEFAULT 0,
    download_expires_at timestamp with time zone,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add constraints
DO $$ BEGIN
    ALTER TABLE marketplace_order_items ADD CONSTRAINT marketplace_order_items_positive_values 
        CHECK (quantity > 0 AND unit_price >= 0 AND total_price >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 6. REVIEWS AND RATINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    reviewer_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Review Target
    review_type review_type NOT NULL,
    listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    seller_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Review Content
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title varchar(200),
    content text,
    
    -- Verification
    is_verified_purchase boolean DEFAULT false,
    order_id uuid REFERENCES marketplace_orders(id) ON DELETE SET NULL,
    
    -- Moderation
    is_hidden boolean DEFAULT false,
    is_flagged boolean DEFAULT false,
    flag_reason text,
    moderated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    moderated_at timestamp with time zone,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Add constraints
DO $$ BEGIN
    ALTER TABLE marketplace_reviews ADD CONSTRAINT marketplace_reviews_single_target 
        CHECK (
            (review_type = 'listing' AND listing_id IS NOT NULL AND seller_profile_id IS NULL) OR
            (review_type = 'seller' AND seller_profile_id IS NOT NULL AND listing_id IS NULL)
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 7. MARKETPLACE CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL UNIQUE REFERENCES networks(id) ON DELETE CASCADE,
    
    -- Feature Toggles
    is_enabled boolean DEFAULT false,
    allow_physical_goods boolean DEFAULT true,
    allow_digital_goods boolean DEFAULT true,
    allow_services boolean DEFAULT true,
    
    -- Approval and Moderation
    require_listing_approval boolean DEFAULT true,
    auto_approve_trusted_sellers boolean DEFAULT false,
    
    -- Commission and Fees
    commission_rate_percentage numeric(5,2) DEFAULT 10.00,
    min_commission_amount numeric(10,2) DEFAULT 0.50,
    max_commission_amount numeric(10,2), -- NULL for no maximum
    
    -- Payment Settings
    default_currency varchar(3) DEFAULT 'USD',
    supported_currencies varchar(3)[] DEFAULT ARRAY['USD', 'EUR', 'GBP'],
    min_listing_price numeric(10,2) DEFAULT 1.00,
    max_listing_price numeric(10,2), -- NULL for no maximum
    
    -- Shipping Settings (for physical goods)
    default_shipping_zone varchar(100) DEFAULT 'United States',
    max_shipping_cost numeric(10,2),
    free_shipping_threshold numeric(10,2),
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Add constraints
DO $$ BEGIN
    ALTER TABLE marketplace_settings ADD CONSTRAINT marketplace_settings_valid_commission 
        CHECK (commission_rate_percentage >= 0 AND commission_rate_percentage <= 50);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE marketplace_settings ADD CONSTRAINT marketplace_settings_valid_prices 
        CHECK (min_listing_price >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 8. TRANSACTION RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type transaction_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency varchar(3) DEFAULT 'USD',
    status transaction_status NOT NULL DEFAULT 'pending',
    
    -- Related Records
    order_id uuid REFERENCES marketplace_orders(id) ON DELETE SET NULL,
    seller_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    buyer_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Payment Integration
    stripe_transfer_id text,
    stripe_payment_intent_id text,
    stripe_refund_id text,
    
    -- Metadata
    description text,
    metadata jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone
);

-- Add constraints
DO $$ BEGIN
    ALTER TABLE marketplace_transactions ADD CONSTRAINT marketplace_transactions_amount_check 
        CHECK (amount != 0); -- Can be negative for refunds
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 9. FAVORITES/WISHLIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_favorites (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add unique constraint
DO $$ BEGIN
    ALTER TABLE marketplace_favorites ADD CONSTRAINT marketplace_favorites_unique_profile_listing
        UNIQUE(profile_id, listing_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Categories
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_network_id ON marketplace_categories(network_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_parent ON marketplace_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_active ON marketplace_categories(network_id, is_active);

-- Listings
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_network_id ON marketplace_listings(network_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_featured ON marketplace_listings(network_id, is_featured, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON marketplace_listings(network_id, price);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created ON marketplace_listings(network_id, created_at DESC);

-- Full text search on listings
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_search ON marketplace_listings USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Orders
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_network_id ON marketplace_orders(network_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON marketplace_orders(seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_created ON marketplace_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_number ON marketplace_orders(order_number);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order ON marketplace_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_listing ON marketplace_order_items(listing_id);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_listing ON marketplace_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_seller ON marketplace_reviews(seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_reviewer ON marketplace_reviews(reviewer_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_network ON marketplace_reviews(network_id);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_network ON marketplace_transactions(network_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_seller ON marketplace_transactions(seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_buyer ON marketplace_transactions(buyer_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_order ON marketplace_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_type ON marketplace_transactions(transaction_type);

-- Favorites
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_profile ON marketplace_favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_listing ON marketplace_favorites(listing_id);

-- ============================================================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
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
DROP POLICY IF EXISTS "Buyers can view their own orders" ON marketplace_orders;
CREATE POLICY "Buyers can view their own orders"
ON marketplace_orders FOR SELECT
USING (
    buyer_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Sellers can view their orders" ON marketplace_orders;
CREATE POLICY "Sellers can view their orders"
ON marketplace_orders FOR SELECT
USING (
    seller_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
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

DROP POLICY IF EXISTS "Network admins can view all orders" ON marketplace_orders;
CREATE POLICY "Network admins can view all orders"
ON marketplace_orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_orders.network_id 
        AND profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
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

DROP POLICY IF EXISTS "Buyers can create reviews" ON marketplace_reviews;
CREATE POLICY "Buyers can create reviews"
ON marketplace_reviews FOR INSERT
WITH CHECK (
    reviewer_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Settings Policies
DROP POLICY IF EXISTS "Network admins can manage marketplace settings" ON marketplace_settings;
CREATE POLICY "Network admins can manage marketplace settings"
ON marketplace_settings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_settings.network_id 
        AND profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Transactions Policies (admin and system only)
DROP POLICY IF EXISTS "Network admins can view all transactions" ON marketplace_transactions;
CREATE POLICY "Network admins can view all transactions"
ON marketplace_transactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_transactions.network_id 
        AND profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "System can create transactions" ON marketplace_transactions;
CREATE POLICY "System can create transactions"
ON marketplace_transactions FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Favorites Policies
DROP POLICY IF EXISTS "Users can manage their own favorites" ON marketplace_favorites;
CREATE POLICY "Users can manage their own favorites"
ON marketplace_favorites FOR ALL
USING (
    profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- ============================================================================
-- 12. BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Initialize marketplace settings for a network
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
        false, -- Disabled by default
        true,
        true,
        true,
        true, -- Require approval by default
        10.00, -- 10% commission
        0.50, -- 50 cent minimum
        'USD',
        ARRAY['USD', 'EUR', 'GBP'],
        1.00 -- $1 minimum
    ) RETURNING id INTO settings_id;
    
    RETURN settings_id;
END;
$$;

-- Create default marketplace categories
CREATE OR REPLACE FUNCTION create_default_marketplace_categories(network_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
    ON CONFLICT DO NOTHING;
END;
$$;

-- Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate order number format: ORD-YYYYMMDD-XXXXXX
    NEW.order_number = 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((random() * 999999)::text, 6, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM marketplace_orders WHERE order_number = NEW.order_number) LOOP
        NEW.order_number = 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((random() * 999999)::text, 6, '0');
    END LOOP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for order number generation
DROP TRIGGER IF EXISTS trigger_generate_order_number ON marketplace_orders;
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON marketplace_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE PROCEDURE generate_order_number();

-- Update listing updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_listing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_marketplace_listings_updated_at ON marketplace_listings;
CREATE TRIGGER trigger_marketplace_listings_updated_at
    BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW
    EXECUTE PROCEDURE update_marketplace_listing_updated_at();

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

-- Migration completion log
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    '20250911100000_complete_marketplace_system', 
    'completed', 
    'Complete marketplace system with categories, listings, orders, reviews, and commissions. Courses are separate and admin-only.'
) ON CONFLICT DO NOTHING;