-- ============================================================================
-- Marketplace RLS Policies Migration  
-- Created: 2025-01-09
-- Description: Implements comprehensive Row-Level Security policies for 
-- marketplace tables following multi-profile architecture
-- ============================================================================

-- Enable RLS on all marketplace tables
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MARKETPLACE CATEGORIES POLICIES
-- ============================================================================

-- Allow network members to view active categories
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

-- Allow network admins to manage categories  
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

-- ============================================================================
-- MARKETPLACE LISTINGS POLICIES
-- ============================================================================

-- Allow network members to view active/approved listings
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

-- Allow sellers to view their own listings (any status)
CREATE POLICY "Sellers can view their own listings"
ON marketplace_listings FOR SELECT
USING (
    seller_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow network members to create listings
CREATE POLICY "Network members can create listings"
ON marketplace_listings FOR INSERT
WITH CHECK (
    seller_profile_id IN (
        SELECT id FROM profiles 
        WHERE user_id = auth.uid() 
        AND network_id = marketplace_listings.network_id
    )
);

-- Allow sellers to update their own listings
CREATE POLICY "Sellers can update their own listings"
ON marketplace_listings FOR UPDATE
USING (
    seller_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow sellers to delete their own listings (if not sold)
CREATE POLICY "Sellers can delete their own unsold listings"
ON marketplace_listings FOR DELETE
USING (
    seller_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND sales_count = 0
);

-- Allow network admins to manage all listings
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

-- ============================================================================
-- MARKETPLACE COURSES POLICIES
-- ============================================================================

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

-- Allow instructors to view their own courses
CREATE POLICY "Instructors can view their own courses"
ON marketplace_courses FOR SELECT
USING (
    instructor_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow instructors to create courses
CREATE POLICY "Instructors can create courses"
ON marketplace_courses FOR INSERT
WITH CHECK (
    instructor_profile_id IN (
        SELECT id FROM profiles 
        WHERE user_id = auth.uid() 
        AND network_id = marketplace_courses.network_id
    )
);

-- Allow instructors to update their own courses
CREATE POLICY "Instructors can update their own courses"
ON marketplace_courses FOR UPDATE
USING (
    instructor_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow network admins to manage all courses
CREATE POLICY "Network admins can manage all courses"
ON marketplace_courses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_courses.network_id 
        AND profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ============================================================================
-- COURSE LESSONS POLICIES
-- ============================================================================

-- Allow course instructors to manage their course lessons
CREATE POLICY "Course instructors can manage their lessons"
ON course_lessons FOR ALL
USING (
    course_id IN (
        SELECT id FROM marketplace_courses 
        WHERE instructor_profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
);

-- Allow enrolled students to view published lessons
CREATE POLICY "Enrolled students can view published lessons"
ON course_lessons FOR SELECT
USING (
    is_published = true AND (
        is_preview = true OR
        course_id IN (
            SELECT course_id FROM course_enrollments 
            WHERE student_profile_id IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            ) AND status = 'active'
        )
    )
);

-- Allow network members to view preview lessons
CREATE POLICY "Network members can view preview lessons"
ON course_lessons FOR SELECT
USING (
    is_published = true AND is_preview = true AND
    EXISTS (
        SELECT 1 FROM marketplace_courses mc
        JOIN profiles p ON p.network_id = mc.network_id
        WHERE mc.id = course_lessons.course_id
        AND p.user_id = auth.uid()
    )
);

-- ============================================================================
-- COURSE ENROLLMENTS POLICIES
-- ============================================================================

-- Allow students to view their own enrollments
CREATE POLICY "Students can view their own enrollments"
ON course_enrollments FOR SELECT
USING (
    student_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow students to create their own enrollments
CREATE POLICY "Students can create their own enrollments"
ON course_enrollments FOR INSERT
WITH CHECK (
    student_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow students to update their own enrollments
CREATE POLICY "Students can update their own enrollments"
ON course_enrollments FOR UPDATE
USING (
    student_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow instructors to view enrollments for their courses
CREATE POLICY "Instructors can view their course enrollments"
ON course_enrollments FOR SELECT
USING (
    course_id IN (
        SELECT id FROM marketplace_courses 
        WHERE instructor_profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
);

-- ============================================================================
-- LESSON PROGRESS POLICIES
-- ============================================================================

-- Allow students to manage their own lesson progress
CREATE POLICY "Students can manage their own lesson progress"
ON lesson_progress FOR ALL
USING (
    enrollment_id IN (
        SELECT id FROM course_enrollments
        WHERE student_profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
);

-- Allow instructors to view progress for their courses
CREATE POLICY "Instructors can view progress for their courses"
ON lesson_progress FOR SELECT
USING (
    lesson_id IN (
        SELECT cl.id FROM course_lessons cl
        JOIN marketplace_courses mc ON mc.id = cl.course_id
        WHERE mc.instructor_profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
);

-- ============================================================================
-- MARKETPLACE ORDERS POLICIES
-- ============================================================================

-- Allow buyers to view their own orders
CREATE POLICY "Buyers can view their own orders"
ON marketplace_orders FOR SELECT
USING (
    buyer_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow sellers to view orders for their products
CREATE POLICY "Sellers can view their orders"
ON marketplace_orders FOR SELECT
USING (
    seller_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow buyers to create orders
CREATE POLICY "Buyers can create orders"
ON marketplace_orders FOR INSERT
WITH CHECK (
    buyer_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow buyers to update their pending orders
CREATE POLICY "Buyers can update their pending orders"
ON marketplace_orders FOR UPDATE
USING (
    buyer_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND order_status = 'pending'
);

-- Allow sellers to update order status
CREATE POLICY "Sellers can update order status"
ON marketplace_orders FOR UPDATE
USING (
    seller_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow network admins to view all orders
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

-- ============================================================================
-- MARKETPLACE ORDER ITEMS POLICIES
-- ============================================================================

-- Allow order participants to view order items
CREATE POLICY "Order participants can view order items"
ON marketplace_order_items FOR SELECT
USING (
    order_id IN (
        SELECT id FROM marketplace_orders
        WHERE buyer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR seller_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
);

-- Allow buyers to create order items during order creation
CREATE POLICY "Buyers can create order items"
ON marketplace_order_items FOR INSERT
WITH CHECK (
    order_id IN (
        SELECT id FROM marketplace_orders
        WHERE buyer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
);

-- ============================================================================
-- MARKETPLACE REVIEWS POLICIES  
-- ============================================================================

-- Allow network members to view non-hidden reviews
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

-- Allow users to create reviews for items they purchased
CREATE POLICY "Buyers can create reviews"
ON marketplace_reviews FOR INSERT
WITH CHECK (
    reviewer_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND (
        -- Must have purchased the item (verified purchase)
        is_verified_purchase = false OR
        order_id IN (
            SELECT id FROM marketplace_orders
            WHERE buyer_profile_id = reviewer_profile_id
        )
    )
);

-- Allow reviewers to update their own reviews
CREATE POLICY "Reviewers can update their own reviews"
ON marketplace_reviews FOR UPDATE
USING (
    reviewer_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Allow reviewers to delete their own reviews
CREATE POLICY "Reviewers can delete their own reviews"
ON marketplace_reviews FOR DELETE
USING (
    reviewer_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- ============================================================================
-- MARKETPLACE SETTINGS POLICIES
-- ============================================================================

-- Allow network admins to manage marketplace settings
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

-- Allow network members to view marketplace settings
CREATE POLICY "Network members can view marketplace settings"
ON marketplace_settings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = marketplace_settings.network_id 
        AND profiles.user_id = auth.uid()
    )
);

-- ============================================================================
-- MARKETPLACE TRANSACTIONS POLICIES
-- ============================================================================

-- Allow network admins to view all transactions
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

-- Allow users to view their own transactions
CREATE POLICY "Users can view their own transactions"
ON marketplace_transactions FOR SELECT
USING (
    seller_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    buyer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Allow system to create transactions (service role only)
CREATE POLICY "System can create transactions"
ON marketplace_transactions FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- MARKETPLACE FAVORITES POLICIES
-- ============================================================================

-- Allow users to manage their own favorites
CREATE POLICY "Users can manage their own favorites"
ON marketplace_favorites FOR ALL
USING (
    profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- ============================================================================
-- ADDITIONAL SECURITY POLICIES
-- ============================================================================

-- Prevent users from favoriting items in networks they don't belong to
ALTER TABLE marketplace_favorites ADD CONSTRAINT marketplace_favorites_network_check
CHECK (
    listing_id IN (
        SELECT ml.id FROM marketplace_listings ml
        JOIN profiles p ON p.network_id = ml.network_id
        WHERE p.id = profile_id
    )
);

-- Ensure course enrollments are within the same network
ALTER TABLE course_enrollments ADD CONSTRAINT course_enrollments_network_check  
CHECK (
    course_id IN (
        SELECT mc.id FROM marketplace_courses mc
        JOIN profiles p ON p.network_id = mc.network_id
        WHERE p.id = student_profile_id
    )
);

-- Ensure orders are within the same network for buyer and seller
ALTER TABLE marketplace_orders ADD CONSTRAINT marketplace_orders_network_check
CHECK (
    EXISTS (
        SELECT 1 FROM profiles bp, profiles sp
        WHERE bp.id = buyer_profile_id 
        AND sp.id = seller_profile_id
        AND bp.network_id = sp.network_id
        AND bp.network_id = marketplace_orders.network_id
    )
);

-- Migration completion log
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    '20250910100001_marketplace_rls_policies', 
    'completed', 
    'Created comprehensive RLS policies for marketplace system with multi-profile support'
);