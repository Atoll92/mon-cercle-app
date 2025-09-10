-- ============================================================================
-- Separate Courses from Marketplace Migration
-- Created: 2025-01-09
-- Description: Separates course system from marketplace. Courses are admin-only
-- and distinct from user-to-user marketplace transactions.
-- ============================================================================

-- ============================================================================
-- 1. REMOVE COURSE INTEGRATION FROM MARKETPLACE
-- ============================================================================

-- Remove course-related enum value from marketplace_listing_type
-- First, check if there are any existing 'course' listings and convert them or remove them
UPDATE marketplace_listings SET listing_type = 'digital' WHERE listing_type = 'course';

-- Recreate the enum without 'course'
ALTER TYPE marketplace_listing_type RENAME TO marketplace_listing_type_old;
CREATE TYPE marketplace_listing_type AS ENUM ('physical', 'digital', 'service');
ALTER TABLE marketplace_listings ALTER COLUMN listing_type TYPE marketplace_listing_type USING listing_type::text::marketplace_listing_type;
DROP TYPE marketplace_listing_type_old;

-- Remove course-related fields from marketplace_listings
ALTER TABLE marketplace_listings DROP COLUMN IF EXISTS is_digital;
ALTER TABLE marketplace_listings DROP COLUMN IF EXISTS requires_shipping;

-- Add back the computed columns without course logic
ALTER TABLE marketplace_listings 
ADD COLUMN is_digital boolean GENERATED ALWAYS AS (listing_type = 'digital') STORED,
ADD COLUMN requires_shipping boolean GENERATED ALWAYS AS (listing_type = 'physical') STORED;

-- Remove course references from marketplace tables
ALTER TABLE marketplace_order_items DROP COLUMN IF EXISTS course_enrollment_id;
ALTER TABLE marketplace_reviews DROP COLUMN IF EXISTS course_id;

-- Update review constraint to remove course option
ALTER TABLE marketplace_reviews DROP CONSTRAINT IF EXISTS marketplace_reviews_single_target;
ALTER TYPE review_type RENAME TO review_type_old;
CREATE TYPE review_type AS ENUM ('listing', 'seller');
ALTER TABLE marketplace_reviews ALTER COLUMN review_type TYPE review_type USING 
    CASE WHEN review_type::text = 'course' THEN 'listing'::review_type ELSE review_type::text::review_type END;
DROP TYPE review_type_old;

-- Recreate the review constraint without course
ALTER TABLE marketplace_reviews ADD CONSTRAINT marketplace_reviews_single_target 
CHECK (
    (review_type = 'listing' AND listing_id IS NOT NULL AND seller_profile_id IS NULL) OR
    (review_type = 'seller' AND seller_profile_id IS NOT NULL AND listing_id IS NULL)
);

-- Remove course settings from marketplace_settings
ALTER TABLE marketplace_settings DROP COLUMN IF EXISTS allow_courses;
ALTER TABLE marketplace_settings DROP COLUMN IF EXISTS max_course_price;
ALTER TABLE marketplace_settings DROP COLUMN IF EXISTS min_course_duration_hours;
ALTER TABLE marketplace_settings DROP COLUMN IF EXISTS max_course_duration_hours;

-- ============================================================================
-- 2. CREATE SEPARATE COURSES SYSTEM (ADMIN-ONLY)
-- ============================================================================

-- Courses are now completely separate from marketplace and only created by admins
-- Keep the existing course tables but ensure they're admin-only

-- Update marketplace_courses to remove marketplace integration
ALTER TABLE marketplace_courses DROP COLUMN IF EXISTS listing_id;

-- Add admin-only constraint (will be enforced by RLS policies)
ALTER TABLE marketplace_courses 
ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0 CHECK (price >= 0);

-- ============================================================================
-- 3. UPDATE RLS POLICIES FOR SEPARATED SYSTEMS
-- ============================================================================

-- Drop existing course-related marketplace policies
DROP POLICY IF EXISTS "Network members can view published courses" ON marketplace_courses;
DROP POLICY IF EXISTS "Instructors can view their own courses" ON marketplace_courses;
DROP POLICY IF EXISTS "Instructors can create courses" ON marketplace_courses;
DROP POLICY IF EXISTS "Instructors can update their own courses" ON marketplace_courses;
DROP POLICY IF EXISTS "Network admins can manage all courses" ON marketplace_courses;

-- Create new admin-only course policies
CREATE POLICY "Only network admins can manage courses"
ON marketplace_courses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_courses.network_id 
        AND profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Allow network members to view published courses
CREATE POLICY "Network members can view published courses"
ON marketplace_courses FOR SELECT
USING (
    status = 'published' AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_courses.network_id 
        AND profiles.user_id = auth.uid()
    )
);

-- Course lessons - admin management, student viewing
DROP POLICY IF EXISTS "Course instructors can manage their lessons" ON course_lessons;
CREATE POLICY "Network admins can manage course lessons"
ON course_lessons FOR ALL
USING (
    course_id IN (
        SELECT id FROM marketplace_courses 
        WHERE network_id IN (
            SELECT network_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
);

-- ============================================================================
-- 4. UPDATE FUNCTIONS TO REMOVE MARKETPLACE INTEGRATION
-- ============================================================================

-- Update marketplace settings initialization to remove course settings
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
    
    -- Create default marketplace settings (no course settings)
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

-- Update default categories to remove course category from marketplace
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
    
    -- Create default categories (no course category)
    INSERT INTO marketplace_categories (network_id, name, slug, description, icon, color, created_by) VALUES
    (network_uuid, 'Electronics', 'electronics', 'Computers, phones, gadgets, and electronic devices', 'PhoneAndroid', '#2196F3', admin_profile_id),
    (network_uuid, 'Books & Media', 'books-media', 'Books, audiobooks, music, movies, and digital content', 'MenuBook', '#FF9800', admin_profile_id),
    (network_uuid, 'Clothing & Fashion', 'clothing-fashion', 'Apparel, shoes, accessories, and fashion items', 'Checkroom', '#E91E63', admin_profile_id),
    (network_uuid, 'Home & Garden', 'home-garden', 'Furniture, decor, tools, and home improvement', 'Home', '#4CAF50', admin_profile_id),
    (network_uuid, 'Sports & Recreation', 'sports-recreation', 'Sports equipment, outdoor gear, and recreational items', 'SportsBasketball', '#FF5722', admin_profile_id),
    (network_uuid, 'Digital Downloads', 'digital-downloads', 'Software, templates, digital art, and downloadable content', 'CloudDownload', '#9C27B0', admin_profile_id),
    (network_uuid, 'Services', 'services', 'Consulting, freelance work, and professional services', 'Work', '#607D8B', admin_profile_id);
END;
$$;

-- Remove course enrollment from marketplace order creation
-- The create_marketplace_order function no longer needs to handle course enrollments

-- Update marketplace stats to exclude courses (they're separate now)
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

-- Add separate course stats function
CREATE OR REPLACE FUNCTION get_course_stats(p_network_id uuid)
RETURNS TABLE (
    total_courses bigint,
    published_courses bigint,
    total_enrollments bigint,
    total_completions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM marketplace_courses WHERE network_id = p_network_id),
        (SELECT COUNT(*) FROM marketplace_courses WHERE network_id = p_network_id AND status = 'published'),
        (SELECT COUNT(*) FROM course_enrollments ce JOIN marketplace_courses mc ON ce.course_id = mc.id WHERE mc.network_id = p_network_id),
        (SELECT COUNT(*) FROM course_enrollments ce JOIN marketplace_courses mc ON ce.course_id = mc.id WHERE mc.network_id = p_network_id AND ce.status = 'completed');
END;
$$;

-- Update the rating trigger to remove course handling
CREATE OR REPLACE FUNCTION trigger_update_ratings()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update listing rating only
        IF NEW.listing_id IS NOT NULL THEN
            PERFORM update_listing_rating(NEW.listing_id);
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update listing rating only
        IF OLD.listing_id IS NOT NULL THEN
            PERFORM update_listing_rating(OLD.listing_id);
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Remove course rating update function as it's no longer needed for marketplace
DROP FUNCTION IF EXISTS update_course_rating(uuid);

-- ============================================================================
-- 5. CREATE ADMIN COURSE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to create a course (admin-only)
CREATE OR REPLACE FUNCTION create_course(
    p_network_id uuid,
    p_instructor_profile_id uuid,
    p_title varchar(255),
    p_description text,
    p_difficulty course_difficulty DEFAULT 'beginner',
    p_is_free boolean DEFAULT true,
    p_price numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    course_id uuid;
    instructor_profile profiles;
BEGIN
    -- Verify instructor is an admin in the network
    SELECT * INTO instructor_profile
    FROM profiles
    WHERE id = p_instructor_profile_id 
    AND network_id = p_network_id 
    AND role = 'admin';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only network admins can create courses';
    END IF;
    
    -- Create the course
    INSERT INTO marketplace_courses (
        network_id,
        instructor_profile_id,
        difficulty,
        status,
        is_free,
        price
    ) VALUES (
        p_network_id,
        p_instructor_profile_id,
        p_difficulty,
        'draft',
        p_is_free,
        CASE WHEN p_is_free THEN 0 ELSE p_price END
    ) RETURNING id INTO course_id;
    
    RETURN course_id;
END;
$$;

-- Function to enroll all network members in a free course (admin action)
CREATE OR REPLACE FUNCTION enroll_all_members_in_course(
    p_course_id uuid,
    p_admin_profile_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    course_record marketplace_courses;
    enrollment_count integer := 0;
    member_profile profiles;
BEGIN
    -- Get course details and verify it's free
    SELECT * INTO course_record
    FROM marketplace_courses
    WHERE id = p_course_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Course not found';
    END IF;
    
    IF NOT course_record.is_free THEN
        RAISE EXCEPTION 'Can only auto-enroll members in free courses';
    END IF;
    
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = p_admin_profile_id 
        AND network_id = course_record.network_id 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only network admins can enroll all members';
    END IF;
    
    -- Enroll all network members who aren't already enrolled
    FOR member_profile IN 
        SELECT * FROM profiles 
        WHERE network_id = course_record.network_id
        AND id NOT IN (
            SELECT student_profile_id FROM course_enrollments 
            WHERE course_id = p_course_id
        )
    LOOP
        INSERT INTO course_enrollments (
            course_id,
            student_profile_id
        ) VALUES (
            p_course_id,
            member_profile.id
        );
        
        enrollment_count := enrollment_count + 1;
    END LOOP;
    
    RETURN enrollment_count;
END;
$$;

-- ============================================================================
-- 6. REMOVE INDEXES THAT ARE NO LONGER NEEDED
-- ============================================================================

-- Remove course-related marketplace indexes
DROP INDEX IF EXISTS idx_marketplace_courses_listing;
DROP INDEX IF EXISTS idx_marketplace_reviews_course;

-- ============================================================================
-- 7. UPDATE MARKETPLACE SETTINGS FOR EXISTING NETWORKS
-- ============================================================================

-- Clean up existing marketplace settings to remove course fields
DO $$
BEGIN
    -- Remove course-related settings from existing records
    -- This is a safe operation as the columns are being dropped anyway
END $$;

-- Migration completion log
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    '20250910100003_separate_courses_from_marketplace', 
    'completed', 
    'Separated courses from marketplace - courses are now admin-only and distinct from user marketplace transactions'
);