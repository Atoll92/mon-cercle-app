-- Create comprehensive courses marketplace schema

-- Course categories table
CREATE TABLE course_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7), -- Hex color code
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL,
  instructor_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic course info
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  
  -- Course content
  content JSONB, -- Rich text content, modules structure
  learning_objectives TEXT[],
  prerequisites TEXT[],
  target_audience TEXT,
  
  -- Pricing & access
  price DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  is_free BOOLEAN DEFAULT false,
  
  -- Course settings
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_hours INTEGER, -- Total course hours
  language VARCHAR(10) DEFAULT 'en',
  max_students INTEGER, -- NULL means unlimited
  
  -- Media
  thumbnail_url TEXT,
  video_preview_url TEXT,
  cover_image_url TEXT,
  
  -- Publishing
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'under_review')),
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  
  -- SEO & discovery
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(network_id, slug)
);

-- Course modules/lessons table
CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Lesson info
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  content JSONB, -- Rich text, videos, attachments
  
  -- Organization
  module_name VARCHAR(100), -- Optional grouping
  sort_order INTEGER DEFAULT 0,
  
  -- Access control
  is_preview BOOLEAN DEFAULT false, -- Can be viewed without enrollment
  is_required BOOLEAN DEFAULT true,
  
  -- Media
  video_url TEXT,
  video_duration_seconds INTEGER,
  attachments JSONB, -- File references
  
  -- Progress tracking
  estimated_duration_minutes INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(course_id, slug)
);

-- Course enrollments table
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Enrollment details
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Progress
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_lesson_id UUID REFERENCES course_lessons(id),
  completed_lessons UUID[] DEFAULT '{}',
  
  -- Payment info
  amount_paid DECIMAL(10,2),
  currency VARCHAR(3),
  payment_method VARCHAR(50),
  payment_reference TEXT,
  
  -- Access
  access_expires_at TIMESTAMP WITH TIME ZONE, -- NULL means lifetime access
  is_active BOOLEAN DEFAULT true,
  
  -- Certificate
  certificate_issued_at TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  
  -- Constraints
  UNIQUE(course_id, student_profile_id)
);

-- Course reviews/ratings table  
CREATE TABLE course_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  content TEXT,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID REFERENCES profiles(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(course_id, reviewer_profile_id)
);

-- Course lesson progress tracking
CREATE TABLE course_lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  
  -- Progress details
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_position INTEGER DEFAULT 0, -- For video progress, reading position, etc.
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- Notes
  student_notes TEXT,
  
  -- Constraints
  UNIQUE(enrollment_id, lesson_id)
);

-- Course discussion forums (optional)
CREATE TABLE course_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE, -- NULL for general course discussion
  author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Discussion content
  title VARCHAR(200),
  content TEXT NOT NULL,
  
  -- Threading
  parent_id UUID REFERENCES course_discussions(id) ON DELETE CASCADE,
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_courses_network_id ON courses(network_id);
CREATE INDEX idx_courses_instructor ON courses(instructor_profile_id);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_published_at ON courses(published_at) WHERE status = 'published';
CREATE INDEX idx_courses_featured ON courses(is_featured) WHERE is_featured = true;

CREATE INDEX idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX idx_course_lessons_sort_order ON course_lessons(course_id, sort_order);

CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_student ON course_enrollments(student_profile_id);
CREATE INDEX idx_course_enrollments_active ON course_enrollments(is_active) WHERE is_active = true;

CREATE INDEX idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX idx_course_reviews_approved ON course_reviews(is_approved) WHERE is_approved = true;

CREATE INDEX idx_lesson_progress_enrollment ON course_lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson ON course_lesson_progress(lesson_id);

CREATE INDEX idx_course_discussions_course ON course_discussions(course_id);
CREATE INDEX idx_course_discussions_lesson ON course_discussions(lesson_id);
CREATE INDEX idx_course_discussions_parent ON course_discussions(parent_id);

-- Create RLS policies

-- Course categories
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_categories_read_policy" ON course_categories FOR SELECT
USING (
  network_id IN (
    SELECT p.network_id 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "course_categories_write_policy" ON course_categories FOR ALL
USING (
  network_id IN (
    SELECT p.network_id 
    FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'moderator')
  )
);

-- Courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_read_policy" ON courses FOR SELECT
USING (
  network_id IN (
    SELECT p.network_id 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  )
  AND (status = 'published' OR instructor_profile_id IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  ))
);

CREATE POLICY "courses_instructor_write_policy" ON courses FOR ALL
USING (
  instructor_profile_id IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "courses_admin_write_policy" ON courses FOR ALL
USING (
  network_id IN (
    SELECT p.network_id 
    FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'moderator')
  )
);

-- Course lessons
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_lessons_read_policy" ON course_lessons FOR SELECT
USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.network_id = c.network_id
    WHERE p.user_id = auth.uid()
    AND (
      c.status = 'published' 
      OR c.instructor_profile_id = p.id
      OR EXISTS (
        SELECT 1 FROM course_enrollments ce 
        WHERE ce.course_id = c.id 
        AND ce.student_profile_id = p.id 
        AND ce.is_active = true
      )
    )
  )
);

CREATE POLICY "course_lessons_instructor_write_policy" ON course_lessons FOR ALL
USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON c.instructor_profile_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Course enrollments
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_enrollments_read_policy" ON course_enrollments FOR SELECT
USING (
  student_profile_id IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  )
  OR course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON c.instructor_profile_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "course_enrollments_student_write_policy" ON course_enrollments FOR INSERT
WITH CHECK (
  student_profile_id IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "course_enrollments_update_policy" ON course_enrollments FOR UPDATE
USING (
  student_profile_id IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- Course reviews
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_reviews_read_policy" ON course_reviews FOR SELECT
USING (
  is_approved = true
  OR reviewer_profile_id IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  )
  OR course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON c.instructor_profile_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "course_reviews_write_policy" ON course_reviews FOR ALL
USING (
  reviewer_profile_id IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- Course lesson progress
ALTER TABLE course_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_lesson_progress_policy" ON course_lesson_progress FOR ALL
USING (
  enrollment_id IN (
    SELECT ce.id FROM course_enrollments ce
    JOIN profiles p ON ce.student_profile_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Course discussions
ALTER TABLE course_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_discussions_read_policy" ON course_discussions FOR SELECT
USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.network_id = c.network_id
    WHERE p.user_id = auth.uid()
    AND (
      c.status = 'published'
      OR EXISTS (
        SELECT 1 FROM course_enrollments ce
        WHERE ce.course_id = c.id
        AND ce.student_profile_id = p.id
        AND ce.is_active = true
      )
    )
  )
);

CREATE POLICY "course_discussions_write_policy" ON course_discussions FOR ALL
USING (
  author_profile_id IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  )
  AND course_id IN (
    SELECT c.id FROM courses c
    WHERE EXISTS (
      SELECT 1 FROM course_enrollments ce
      JOIN profiles p ON ce.student_profile_id = p.id
      WHERE ce.course_id = c.id
      AND p.user_id = auth.uid()
      AND ce.is_active = true
    )
  )
);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_categories_updated_at BEFORE UPDATE ON course_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON course_lessons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_reviews_updated_at BEFORE UPDATE ON course_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_discussions_updated_at BEFORE UPDATE ON course_discussions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update course stats
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'course_enrollments' THEN
    -- Update enrollment count
    UPDATE courses 
    SET enrollment_count = (
      SELECT COUNT(*) 
      FROM course_enrollments 
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) 
      AND is_active = true
    )
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
  ELSIF TG_TABLE_NAME = 'course_reviews' THEN
    -- Update rating stats
    UPDATE courses 
    SET 
      rating_average = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM course_reviews 
        WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) 
        AND is_approved = true
      ),
      rating_count = (
        SELECT COUNT(*) 
        FROM course_reviews 
        WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) 
        AND is_approved = true
      )
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update course stats
CREATE TRIGGER update_course_enrollment_stats
  AFTER INSERT OR UPDATE OR DELETE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_course_stats();

CREATE TRIGGER update_course_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON course_reviews
  FOR EACH ROW EXECUTE FUNCTION update_course_stats();