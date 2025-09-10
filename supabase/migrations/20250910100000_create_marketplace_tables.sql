-- ============================================================================
-- Marketplace System Migration
-- Created: 2025-01-09
-- Description: Creates comprehensive marketplace system with support for:
-- - Physical and digital goods
-- - Online courses with lessons and enrollments  
-- - Categories and subcategories
-- - Orders and transactions with commission tracking
-- - Reviews and ratings
-- - Shipping and payment integration
-- - Multi-tenant network isolation
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. MARKETPLACE CATEGORIES
-- ============================================================================

CREATE TABLE marketplace_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    slug varchar(100) NOT NULL,
    description text,
    icon varchar(100), -- Material UI icon name
    color varchar(7) DEFAULT '#1976d2', -- Hex color code
    parent_category_id uuid REFERENCES marketplace_categories(id) ON DELETE SET NULL, -- For subcategories
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    item_count integer DEFAULT 0, -- Denormalized count for performance
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT marketplace_categories_unique_network_slug 
        UNIQUE (network_id, slug),
    CONSTRAINT marketplace_categories_valid_color 
        CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================================================
-- 2. MARKETPLACE LISTINGS (Main Products/Services Table)
-- ============================================================================

CREATE TYPE marketplace_listing_type AS ENUM ('physical', 'digital', 'service', 'course');
CREATE TYPE marketplace_listing_status AS ENUM ('draft', 'pending', 'active', 'inactive', 'sold', 'archived');

CREATE TABLE marketplace_listings (
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
    is_digital boolean GENERATED ALWAYS AS (listing_type IN ('digital', 'course')) STORED,
    requires_shipping boolean GENERATED ALWAYS AS (listing_type = 'physical') STORED,
    
    -- Inventory (for physical goods)
    stock_quantity integer DEFAULT 1,
    unlimited_stock boolean DEFAULT false,
    
    -- Media
    thumbnail_url text,
    media_urls text[], -- Array of image/video URLs
    media_metadata jsonb DEFAULT '{}', -- Metadata for each media item
    
    -- SEO and Discovery
    slug varchar(255) UNIQUE,
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
    published_at timestamp with time zone,
    
    -- Constraints
    CONSTRAINT marketplace_listings_valid_price 
        CHECK (price >= 0),
    CONSTRAINT marketplace_listings_valid_stock 
        CHECK (stock_quantity >= 0 OR unlimited_stock = true),
    CONSTRAINT marketplace_listings_title_length 
        CHECK (char_length(title) >= 3)
);

-- ============================================================================
-- 3. MARKETPLACE COURSES (Extended Course Features)
-- ============================================================================

CREATE TYPE course_difficulty AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE course_status AS ENUM ('draft', 'under_review', 'published', 'archived');

CREATE TABLE marketplace_courses (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    instructor_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Course Specific Info
    difficulty course_difficulty NOT NULL DEFAULT 'beginner',
    estimated_duration_hours integer, -- Total course duration
    lesson_count integer DEFAULT 0,
    
    -- Prerequisites and Outcomes
    prerequisites text[],
    learning_outcomes text[],
    target_audience text,
    
    -- Content and Materials
    syllabus jsonb, -- Structured course outline
    materials_included text[],
    
    -- Course Status
    status course_status NOT NULL DEFAULT 'draft',
    
    -- Enrollment Settings
    max_enrollments integer, -- NULL for unlimited
    current_enrollments integer DEFAULT 0,
    enrollment_deadline timestamp with time zone,
    
    -- Ratings and Reviews
    rating_average numeric(3,2) DEFAULT 0.0,
    rating_count integer DEFAULT 0,
    
    -- Completion Tracking
    completion_rate numeric(5,2) DEFAULT 0.0, -- Percentage of students who complete
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT marketplace_courses_valid_duration 
        CHECK (estimated_duration_hours > 0),
    CONSTRAINT marketplace_courses_valid_rating 
        CHECK (rating_average >= 0 AND rating_average <= 5),
    CONSTRAINT marketplace_courses_valid_enrollments 
        CHECK (current_enrollments >= 0)
);

-- ============================================================================
-- 4. COURSE LESSONS
-- ============================================================================

CREATE TYPE lesson_type AS ENUM ('video', 'text', 'quiz', 'assignment', 'live_session');

CREATE TABLE course_lessons (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES marketplace_courses(id) ON DELETE CASCADE,
    
    -- Lesson Information
    title varchar(255) NOT NULL,
    description text,
    sort_order integer NOT NULL DEFAULT 0,
    
    -- Content
    lesson_type lesson_type NOT NULL DEFAULT 'text',
    content text, -- Text content or embed code
    video_url text,
    video_duration_minutes integer,
    
    -- Resources
    attachments jsonb DEFAULT '[]', -- Array of file references
    
    -- Access Control
    is_preview boolean DEFAULT false, -- Can be viewed without enrollment
    is_published boolean DEFAULT false,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT course_lessons_positive_duration 
        CHECK (video_duration_minutes IS NULL OR video_duration_minutes > 0)
);

-- ============================================================================
-- 5. COURSE ENROLLMENTS
-- ============================================================================

CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled', 'expired');

CREATE TABLE course_enrollments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES marketplace_courses(id) ON DELETE CASCADE,
    student_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Enrollment Details
    status enrollment_status NOT NULL DEFAULT 'active',
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Progress Tracking
    lessons_completed integer DEFAULT 0,
    progress_percentage numeric(5,2) DEFAULT 0.0,
    last_accessed_at timestamp with time zone DEFAULT now(),
    
    -- Completion
    completed_at timestamp with time zone,
    certificate_issued_at timestamp with time zone,
    certificate_url text,
    
    -- Payment (if course was purchased)
    order_id uuid, -- References marketplace_orders when implemented
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    UNIQUE(course_id, student_profile_id),
    CONSTRAINT course_enrollments_valid_progress 
        CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- ============================================================================
-- 6. LESSON PROGRESS TRACKING
-- ============================================================================

CREATE TABLE lesson_progress (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    enrollment_id uuid NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    lesson_id uuid NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    
    -- Progress Details
    is_completed boolean DEFAULT false,
    completion_percentage numeric(5,2) DEFAULT 0.0,
    time_spent_minutes integer DEFAULT 0,
    
    -- Timestamps
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    last_accessed_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    UNIQUE(enrollment_id, lesson_id),
    CONSTRAINT lesson_progress_valid_percentage 
        CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- ============================================================================
-- 7. MARKETPLACE ORDERS
-- ============================================================================

CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');

CREATE TABLE marketplace_orders (
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
    delivered_at timestamp with time zone,
    
    -- Constraints
    CONSTRAINT marketplace_orders_positive_amounts 
        CHECK (subtotal >= 0 AND tax_amount >= 0 AND shipping_amount >= 0 AND commission_amount >= 0 AND total_amount >= 0)
);

-- ============================================================================
-- 8. ORDER ITEMS
-- ============================================================================

CREATE TABLE marketplace_order_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE RESTRICT, -- Prevent deletion of sold items
    
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
    
    -- Course Enrollment (if applicable)
    course_enrollment_id uuid REFERENCES course_enrollments(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT marketplace_order_items_positive_values 
        CHECK (quantity > 0 AND unit_price >= 0 AND total_price >= 0)
);

-- ============================================================================
-- 9. REVIEWS AND RATINGS
-- ============================================================================

CREATE TYPE review_type AS ENUM ('listing', 'course', 'seller');

CREATE TABLE marketplace_reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    reviewer_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Review Target
    review_type review_type NOT NULL,
    listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    course_id uuid REFERENCES marketplace_courses(id) ON DELETE CASCADE,
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
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints - ensure only one target is set
    CONSTRAINT marketplace_reviews_single_target 
        CHECK (
            (review_type = 'listing' AND listing_id IS NOT NULL AND course_id IS NULL AND seller_profile_id IS NULL) OR
            (review_type = 'course' AND course_id IS NOT NULL AND listing_id IS NULL AND seller_profile_id IS NULL) OR
            (review_type = 'seller' AND seller_profile_id IS NOT NULL AND listing_id IS NULL AND course_id IS NULL)
        )
);

-- ============================================================================
-- 10. MARKETPLACE CONFIGURATION
-- ============================================================================

CREATE TABLE marketplace_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_id uuid NOT NULL UNIQUE REFERENCES networks(id) ON DELETE CASCADE,
    
    -- Feature Toggles
    is_enabled boolean DEFAULT false,
    allow_physical_goods boolean DEFAULT true,
    allow_digital_goods boolean DEFAULT true,
    allow_courses boolean DEFAULT true,
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
    
    -- Course Settings
    max_course_price numeric(10,2),
    min_course_duration_hours integer DEFAULT 1,
    max_course_duration_hours integer DEFAULT 100,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT marketplace_settings_valid_commission 
        CHECK (commission_rate_percentage >= 0 AND commission_rate_percentage <= 50),
    CONSTRAINT marketplace_settings_valid_prices 
        CHECK (min_listing_price >= 0)
);

-- ============================================================================
-- 11. TRANSACTION RECORDS (For Commission Tracking)
-- ============================================================================

CREATE TYPE transaction_type AS ENUM ('sale', 'commission', 'refund', 'payout');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE marketplace_transactions (
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
    processed_at timestamp with time zone,
    
    -- Constraints
    CONSTRAINT marketplace_transactions_amount_check 
        CHECK (amount != 0) -- Can be negative for refunds
);

-- ============================================================================
-- 12. WISHLIST/FAVORITES
-- ============================================================================

CREATE TABLE marketplace_favorites (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Ensure one favorite per user per listing
    UNIQUE(profile_id, listing_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Categories
CREATE INDEX idx_marketplace_categories_network_id ON marketplace_categories(network_id);
CREATE INDEX idx_marketplace_categories_parent ON marketplace_categories(parent_category_id);
CREATE INDEX idx_marketplace_categories_active ON marketplace_categories(network_id, is_active);

-- Listings
CREATE INDEX idx_marketplace_listings_network_id ON marketplace_listings(network_id);
CREATE INDEX idx_marketplace_listings_seller ON marketplace_listings(seller_profile_id);
CREATE INDEX idx_marketplace_listings_category ON marketplace_listings(category_id);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_type ON marketplace_listings(listing_type);
CREATE INDEX idx_marketplace_listings_featured ON marketplace_listings(network_id, is_featured, status);
CREATE INDEX idx_marketplace_listings_search ON marketplace_listings USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_marketplace_listings_price ON marketplace_listings(network_id, price);
CREATE INDEX idx_marketplace_listings_created ON marketplace_listings(network_id, created_at DESC);

-- Courses
CREATE INDEX idx_marketplace_courses_listing ON marketplace_courses(listing_id);
CREATE INDEX idx_marketplace_courses_instructor ON marketplace_courses(instructor_profile_id);
CREATE INDEX idx_marketplace_courses_status ON marketplace_courses(status);
CREATE INDEX idx_marketplace_courses_rating ON marketplace_courses(rating_average DESC);

-- Course Lessons
CREATE INDEX idx_course_lessons_course ON course_lessons(course_id, sort_order);
CREATE INDEX idx_course_lessons_published ON course_lessons(course_id, is_published);

-- Enrollments
CREATE INDEX idx_course_enrollments_student ON course_enrollments(student_profile_id);
CREATE INDEX idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_status ON course_enrollments(status);

-- Lesson Progress
CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- Orders
CREATE INDEX idx_marketplace_orders_network_id ON marketplace_orders(network_id);
CREATE INDEX idx_marketplace_orders_buyer ON marketplace_orders(buyer_profile_id);
CREATE INDEX idx_marketplace_orders_seller ON marketplace_orders(seller_profile_id);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(order_status);
CREATE INDEX idx_marketplace_orders_created ON marketplace_orders(created_at DESC);
CREATE INDEX idx_marketplace_orders_number ON marketplace_orders(order_number);

-- Order Items
CREATE INDEX idx_marketplace_order_items_order ON marketplace_order_items(order_id);
CREATE INDEX idx_marketplace_order_items_listing ON marketplace_order_items(listing_id);

-- Reviews
CREATE INDEX idx_marketplace_reviews_listing ON marketplace_reviews(listing_id);
CREATE INDEX idx_marketplace_reviews_course ON marketplace_reviews(course_id);
CREATE INDEX idx_marketplace_reviews_seller ON marketplace_reviews(seller_profile_id);
CREATE INDEX idx_marketplace_reviews_reviewer ON marketplace_reviews(reviewer_profile_id);
CREATE INDEX idx_marketplace_reviews_network ON marketplace_reviews(network_id);

-- Transactions
CREATE INDEX idx_marketplace_transactions_network ON marketplace_transactions(network_id);
CREATE INDEX idx_marketplace_transactions_seller ON marketplace_transactions(seller_profile_id);
CREATE INDEX idx_marketplace_transactions_buyer ON marketplace_transactions(buyer_profile_id);
CREATE INDEX idx_marketplace_transactions_order ON marketplace_transactions(order_id);
CREATE INDEX idx_marketplace_transactions_type ON marketplace_transactions(transaction_type);

-- Favorites
CREATE INDEX idx_marketplace_favorites_profile ON marketplace_favorites(profile_id);
CREATE INDEX idx_marketplace_favorites_listing ON marketplace_favorites(listing_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Update listing updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_listing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_marketplace_listings_updated_at
    BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW
    EXECUTE PROCEDURE update_marketplace_listing_updated_at();

-- Update category item count
CREATE OR REPLACE FUNCTION update_category_item_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE marketplace_categories 
        SET item_count = item_count + 1 
        WHERE id = NEW.category_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE marketplace_categories 
        SET item_count = GREATEST(0, item_count - 1) 
        WHERE id = OLD.category_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id THEN
        -- Item moved between categories
        UPDATE marketplace_categories 
        SET item_count = GREATEST(0, item_count - 1) 
        WHERE id = OLD.category_id;
        UPDATE marketplace_categories 
        SET item_count = item_count + 1 
        WHERE id = NEW.category_id;
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_marketplace_listings_category_count
    AFTER INSERT OR UPDATE OR DELETE ON marketplace_listings
    FOR EACH ROW
    WHEN (OLD.category_id IS DISTINCT FROM NEW.category_id)
    EXECUTE PROCEDURE update_category_item_count();

-- Update course enrollment count
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE marketplace_courses 
        SET current_enrollments = current_enrollments + 1 
        WHERE id = NEW.course_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE marketplace_courses 
        SET current_enrollments = GREATEST(0, current_enrollments - 1) 
        WHERE id = OLD.course_id;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_course_enrollments_count
    AFTER INSERT OR DELETE ON course_enrollments
    FOR EACH ROW
    EXECUTE PROCEDURE update_course_enrollment_count();

-- Generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate order number format: ORD-YYYYMMDD-XXXXXX
    NEW.order_number = 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((random() * 999999)::text, 6, '0');
    
    -- Ensure uniqueness (very unlikely collision, but just in case)
    WHILE EXISTS (SELECT 1 FROM marketplace_orders WHERE order_number = NEW.order_number) LOOP
        NEW.order_number = 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((random() * 999999)::text, 6, '0');
    END LOOP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON marketplace_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE PROCEDURE generate_order_number();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- This migration creates the structure but doesn't insert any initial data
-- Initial marketplace settings will be created per network through the application

-- Migration completion log
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    '20250910100000_create_marketplace_tables', 
    'completed', 
    'Created comprehensive marketplace system with support for physical/digital goods, courses, orders, reviews, and commission tracking'
);