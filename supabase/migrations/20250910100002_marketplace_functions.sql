-- ============================================================================
-- Marketplace Database Functions Migration
-- Created: 2025-01-09
-- Description: Business logic functions for marketplace operations
-- ============================================================================

-- ============================================================================
-- 1. MARKETPLACE INITIALIZATION FUNCTIONS
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
        allow_courses,
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

-- Create default marketplace categories for a network
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
    
    -- Create default categories
    INSERT INTO marketplace_categories (network_id, name, slug, description, icon, color, created_by) VALUES
    (network_uuid, 'Electronics', 'electronics', 'Computers, phones, gadgets, and electronic devices', 'PhoneAndroid', '#2196F3', admin_profile_id),
    (network_uuid, 'Books & Media', 'books-media', 'Books, audiobooks, music, movies, and digital content', 'MenuBook', '#FF9800', admin_profile_id),
    (network_uuid, 'Clothing & Fashion', 'clothing-fashion', 'Apparel, shoes, accessories, and fashion items', 'Checkroom', '#E91E63', admin_profile_id),
    (network_uuid, 'Home & Garden', 'home-garden', 'Furniture, decor, tools, and home improvement', 'Home', '#4CAF50', admin_profile_id),
    (network_uuid, 'Sports & Recreation', 'sports-recreation', 'Sports equipment, outdoor gear, and recreational items', 'SportsBasketball', '#FF5722', admin_profile_id),
    (network_uuid, 'Digital Downloads', 'digital-downloads', 'Software, templates, digital art, and downloadable content', 'CloudDownload', '#9C27B0', admin_profile_id),
    (network_uuid, 'Online Courses', 'online-courses', 'Educational content, tutorials, and skill development', 'School', '#3F51B5', admin_profile_id),
    (network_uuid, 'Services', 'services', 'Consulting, freelance work, and professional services', 'Work', '#607D8B', admin_profile_id);
END;
$$;

-- ============================================================================
-- 2. LISTING MANAGEMENT FUNCTIONS  
-- ============================================================================

-- Generate unique listing slug
CREATE OR REPLACE FUNCTION generate_listing_slug(listing_title text, network_uuid uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 1;
BEGIN
    -- Create base slug from title
    base_slug := lower(
        regexp_replace(
            regexp_replace(listing_title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    );
    
    -- Limit length
    base_slug := left(base_slug, 100);
    
    final_slug := base_slug;
    
    -- Ensure uniqueness within network
    WHILE EXISTS (
        SELECT 1 FROM marketplace_listings 
        WHERE slug = final_slug AND network_id = network_uuid
    ) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

-- Update listing view count
CREATE OR REPLACE FUNCTION increment_listing_views(listing_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE marketplace_listings 
    SET view_count = view_count + 1,
        updated_at = now()
    WHERE id = listing_uuid;
END;
$$;

-- Calculate listing commission
CREATE OR REPLACE FUNCTION calculate_listing_commission(listing_uuid uuid, sale_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    settings marketplace_settings;
    commission_amount numeric;
BEGIN
    -- Get marketplace settings for the listing's network
    SELECT ms.* INTO settings
    FROM marketplace_settings ms
    JOIN marketplace_listings ml ON ml.network_id = ms.network_id
    WHERE ml.id = listing_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Marketplace settings not found for listing %', listing_uuid;
    END IF;
    
    -- Calculate commission
    commission_amount := sale_amount * (settings.commission_rate_percentage / 100.0);
    
    -- Apply minimum commission
    commission_amount := GREATEST(commission_amount, settings.min_commission_amount);
    
    -- Apply maximum commission if set
    IF settings.max_commission_amount IS NOT NULL THEN
        commission_amount := LEAST(commission_amount, settings.max_commission_amount);
    END IF;
    
    RETURN commission_amount;
END;
$$;

-- ============================================================================
-- 3. ORDER MANAGEMENT FUNCTIONS
-- ============================================================================

-- Create order from cart items
CREATE OR REPLACE FUNCTION create_marketplace_order(
    p_network_id uuid,
    p_buyer_profile_id uuid,
    p_seller_profile_id uuid,
    p_items jsonb, -- Array of {listing_id, quantity, unit_price}
    p_shipping_address jsonb DEFAULT NULL,
    p_buyer_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_id uuid;
    item jsonb;
    listing_record marketplace_listings;
    subtotal numeric := 0;
    commission_total numeric := 0;
    shipping_total numeric := 0;
    tax_total numeric := 0;
    grand_total numeric;
    commission_rate numeric;
    settings marketplace_settings;
BEGIN
    -- Get marketplace settings
    SELECT * INTO settings
    FROM marketplace_settings
    WHERE network_id = p_network_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Marketplace not configured for network %', p_network_id;
    END IF;
    
    -- Validate all items exist and calculate totals
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO listing_record
        FROM marketplace_listings
        WHERE id = (item->>'listing_id')::uuid
        AND network_id = p_network_id
        AND status = 'active'
        AND is_approved = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Listing % not found or not available', item->>'listing_id';
        END IF;
        
        -- Check stock for physical items
        IF listing_record.listing_type = 'physical' 
           AND NOT listing_record.unlimited_stock 
           AND listing_record.stock_quantity < (item->>'quantity')::integer THEN
            RAISE EXCEPTION 'Insufficient stock for listing %', listing_record.title;
        END IF;
        
        subtotal := subtotal + ((item->>'quantity')::integer * (item->>'unit_price')::numeric);
    END LOOP;
    
    -- Calculate commission
    commission_total := subtotal * (settings.commission_rate_percentage / 100.0);
    commission_total := GREATEST(commission_total, settings.min_commission_amount);
    
    -- For now, simplified shipping and tax (would integrate with real services)
    shipping_total := 0; -- Will be calculated based on items and address
    tax_total := 0; -- Will be calculated based on location and tax rules
    
    grand_total := subtotal + shipping_total + tax_total;
    
    -- Create the order
    INSERT INTO marketplace_orders (
        network_id,
        buyer_profile_id,
        seller_profile_id,
        subtotal,
        tax_amount,
        shipping_amount,
        commission_amount,
        total_amount,
        currency,
        shipping_address,
        buyer_notes
    ) VALUES (
        p_network_id,
        p_buyer_profile_id,
        p_seller_profile_id,
        subtotal,
        tax_total,
        shipping_total,
        commission_total,
        grand_total,
        settings.default_currency,
        p_shipping_address,
        p_buyer_notes
    ) RETURNING id INTO order_id;
    
    -- Create order items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO listing_record
        FROM marketplace_listings
        WHERE id = (item->>'listing_id')::uuid;
        
        INSERT INTO marketplace_order_items (
            order_id,
            listing_id,
            title,
            description,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            order_id,
            listing_record.id,
            listing_record.title,
            listing_record.short_description,
            (item->>'quantity')::integer,
            (item->>'unit_price')::numeric,
            (item->>'quantity')::integer * (item->>'unit_price')::numeric
        );
        
        -- Update stock for physical items
        IF listing_record.listing_type = 'physical' AND NOT listing_record.unlimited_stock THEN
            UPDATE marketplace_listings
            SET stock_quantity = stock_quantity - (item->>'quantity')::integer,
                sales_count = sales_count + (item->>'quantity')::integer
            WHERE id = listing_record.id;
        ELSE
            -- Just update sales count for digital items
            UPDATE marketplace_listings
            SET sales_count = sales_count + (item->>'quantity')::integer
            WHERE id = listing_record.id;
        END IF;
    END LOOP;
    
    RETURN order_id;
END;
$$;

-- Update order status with logging
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id uuid,
    p_new_status order_status,
    p_tracking_number text DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_status order_status;
BEGIN
    -- Get current status
    SELECT order_status INTO current_status
    FROM marketplace_orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;
    
    -- Update order
    UPDATE marketplace_orders
    SET order_status = p_new_status,
        tracking_number = COALESCE(p_tracking_number, tracking_number),
        seller_notes = COALESCE(p_notes, seller_notes),
        updated_at = now(),
        confirmed_at = CASE WHEN p_new_status = 'confirmed' AND confirmed_at IS NULL THEN now() ELSE confirmed_at END,
        shipped_at = CASE WHEN p_new_status = 'shipped' AND shipped_at IS NULL THEN now() ELSE shipped_at END,
        delivered_at = CASE WHEN p_new_status = 'delivered' AND delivered_at IS NULL THEN now() ELSE delivered_at END
    WHERE id = p_order_id;
    
    RETURN true;
END;
$$;

-- ============================================================================
-- 4. COURSE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Enroll student in course
CREATE OR REPLACE FUNCTION enroll_student_in_course(
    p_course_id uuid,
    p_student_profile_id uuid,
    p_order_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    enrollment_id uuid;
    course_record marketplace_courses;
BEGIN
    -- Get course details
    SELECT * INTO course_record
    FROM marketplace_courses
    WHERE id = p_course_id AND status = 'published';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Course % not found or not published', p_course_id;
    END IF;
    
    -- Check if already enrolled
    IF EXISTS (
        SELECT 1 FROM course_enrollments
        WHERE course_id = p_course_id AND student_profile_id = p_student_profile_id
    ) THEN
        RAISE EXCEPTION 'Student already enrolled in course';
    END IF;
    
    -- Check enrollment limits
    IF course_record.max_enrollments IS NOT NULL 
       AND course_record.current_enrollments >= course_record.max_enrollments THEN
        RAISE EXCEPTION 'Course enrollment is full';
    END IF;
    
    -- Create enrollment
    INSERT INTO course_enrollments (
        course_id,
        student_profile_id,
        order_id
    ) VALUES (
        p_course_id,
        p_student_profile_id,
        p_order_id
    ) RETURNING id INTO enrollment_id;
    
    RETURN enrollment_id;
END;
$$;

-- Update lesson progress
CREATE OR REPLACE FUNCTION update_lesson_progress(
    p_enrollment_id uuid,
    p_lesson_id uuid,
    p_completion_percentage numeric DEFAULT 100,
    p_time_spent_minutes integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_progress lesson_progress;
    enrollment_record course_enrollments;
BEGIN
    -- Get enrollment details
    SELECT * INTO enrollment_record
    FROM course_enrollments
    WHERE id = p_enrollment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Enrollment % not found', p_enrollment_id;
    END IF;
    
    -- Get existing progress
    SELECT * INTO existing_progress
    FROM lesson_progress
    WHERE enrollment_id = p_enrollment_id AND lesson_id = p_lesson_id;
    
    IF FOUND THEN
        -- Update existing progress
        UPDATE lesson_progress
        SET completion_percentage = p_completion_percentage,
            time_spent_minutes = time_spent_minutes + p_time_spent_minutes,
            is_completed = (p_completion_percentage >= 100),
            completed_at = CASE WHEN p_completion_percentage >= 100 AND completed_at IS NULL THEN now() ELSE completed_at END,
            last_accessed_at = now()
        WHERE id = existing_progress.id;
    ELSE
        -- Create new progress record
        INSERT INTO lesson_progress (
            enrollment_id,
            lesson_id,
            completion_percentage,
            time_spent_minutes,
            is_completed,
            completed_at
        ) VALUES (
            p_enrollment_id,
            p_lesson_id,
            p_completion_percentage,
            p_time_spent_minutes,
            (p_completion_percentage >= 100),
            CASE WHEN p_completion_percentage >= 100 THEN now() ELSE NULL END
        );
    END IF;
    
    -- Update overall course progress
    PERFORM update_course_progress(p_enrollment_id);
END;
$$;

-- Update overall course progress for an enrollment
CREATE OR REPLACE FUNCTION update_course_progress(p_enrollment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_lessons integer;
    completed_lessons integer;
    progress_percentage numeric;
BEGIN
    -- Count total published lessons in the course
    SELECT COUNT(*) INTO total_lessons
    FROM course_lessons cl
    JOIN course_enrollments ce ON ce.course_id = cl.course_id
    WHERE ce.id = p_enrollment_id AND cl.is_published = true;
    
    -- Count completed lessons
    SELECT COUNT(*) INTO completed_lessons
    FROM lesson_progress lp
    WHERE lp.enrollment_id = p_enrollment_id AND lp.is_completed = true;
    
    -- Calculate progress percentage
    IF total_lessons > 0 THEN
        progress_percentage := (completed_lessons::numeric / total_lessons) * 100;
    ELSE
        progress_percentage := 0;
    END IF;
    
    -- Update enrollment record
    UPDATE course_enrollments
    SET lessons_completed = completed_lessons,
        progress_percentage = progress_percentage,
        last_accessed_at = now(),
        status = CASE WHEN progress_percentage >= 100 THEN 'completed' ELSE status END,
        completed_at = CASE WHEN progress_percentage >= 100 AND completed_at IS NULL THEN now() ELSE completed_at END
    WHERE id = p_enrollment_id;
END;
$$;

-- ============================================================================
-- 5. REVIEW AND RATING FUNCTIONS
-- ============================================================================

-- Update listing rating after review changes
CREATE OR REPLACE FUNCTION update_listing_rating(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    avg_rating numeric;
    review_count integer;
BEGIN
    -- Calculate average rating for the listing
    SELECT AVG(rating), COUNT(*)
    INTO avg_rating, review_count
    FROM marketplace_reviews
    WHERE listing_id = p_listing_id AND is_hidden = false;
    
    -- Update the listing
    UPDATE marketplace_listings
    SET 
        -- Store rating info in metadata for now (could add dedicated columns)
        media_metadata = jsonb_set(
            COALESCE(media_metadata, '{}'),
            '{rating}',
            jsonb_build_object(
                'average', COALESCE(avg_rating, 0),
                'count', review_count
            )
        )
    WHERE id = p_listing_id;
END;
$$;

-- Update course rating after review changes  
CREATE OR REPLACE FUNCTION update_course_rating(p_course_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    avg_rating numeric;
    review_count integer;
BEGIN
    -- Calculate average rating for the course
    SELECT AVG(rating), COUNT(*)
    INTO avg_rating, review_count
    FROM marketplace_reviews
    WHERE course_id = p_course_id AND is_hidden = false;
    
    -- Update the course
    UPDATE marketplace_courses
    SET rating_average = COALESCE(avg_rating, 0),
        rating_count = review_count
    WHERE id = p_course_id;
END;
$$;

-- ============================================================================
-- 6. MARKETPLACE STATISTICS FUNCTIONS
-- ============================================================================

-- Get marketplace statistics for a network
CREATE OR REPLACE FUNCTION get_marketplace_stats(p_network_id uuid)
RETURNS TABLE (
    total_listings bigint,
    active_listings bigint,
    total_orders bigint,
    total_revenue numeric,
    total_commission numeric,
    total_courses bigint,
    total_enrollments bigint,
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
        (SELECT COUNT(*) FROM marketplace_courses WHERE network_id = p_network_id),
        (SELECT COUNT(*) FROM course_enrollments ce JOIN marketplace_courses mc ON ce.course_id = mc.id WHERE mc.network_id = p_network_id),
        (SELECT COUNT(*) FROM marketplace_reviews WHERE network_id = p_network_id);
END;
$$;

-- ============================================================================
-- 7. TRIGGER FUNCTIONS FOR AUTOMATED RATING UPDATES
-- ============================================================================

-- Trigger function to update ratings when reviews change
CREATE OR REPLACE FUNCTION trigger_update_ratings()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update listing rating
        IF NEW.listing_id IS NOT NULL THEN
            PERFORM update_listing_rating(NEW.listing_id);
        END IF;
        
        -- Update course rating
        IF NEW.course_id IS NOT NULL THEN
            PERFORM update_course_rating(NEW.course_id);
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update listing rating
        IF OLD.listing_id IS NOT NULL THEN
            PERFORM update_listing_rating(OLD.listing_id);
        END IF;
        
        -- Update course rating
        IF OLD.course_id IS NOT NULL THEN
            PERFORM update_course_rating(OLD.course_id);
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for rating updates
CREATE TRIGGER trigger_marketplace_reviews_rating_update
    AFTER INSERT OR UPDATE OR DELETE ON marketplace_reviews
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_update_ratings();

-- Migration completion log
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    '20250910100002_marketplace_functions', 
    'completed', 
    'Created comprehensive marketplace business logic functions including order management, course enrollment, and rating systems'
);