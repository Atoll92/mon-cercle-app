-- Add storage bucket for course content (videos, PDFs, documents, images)
-- This extends the existing course-thumbnails bucket with more content types

-- Create course-content bucket for all course materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-content',
  'course-content',
  true,
  104857600, -- 100MB limit for videos
  ARRAY[
    -- Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    -- Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    -- Documents
    'application/pdf',
    -- Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Course content public read" ON storage.objects;
DROP POLICY IF EXISTS "Course content instructor upload" ON storage.objects;
DROP POLICY IF EXISTS "Course content instructor update" ON storage.objects;
DROP POLICY IF EXISTS "Course content instructor delete" ON storage.objects;

-- Policy: Anyone can view course content (for published courses)
CREATE POLICY "Course content public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-content');

-- Policy: Course instructors can upload content
-- Path format: {courseId}/{lessonId or 'general'}/{filename}
CREATE POLICY "Course content instructor upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-content'
  AND (
    -- Extract course_id from path (first segment)
    EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON c.instructor_profile_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.id::text = (storage.foldername(name))[1]
    )
    OR
    -- Network admin can also upload
    EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON p.network_id = c.network_id
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'moderator')
      AND c.id::text = (storage.foldername(name))[1]
    )
  )
);

-- Policy: Course instructors can update their content
CREATE POLICY "Course content instructor update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-content'
  AND (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON c.instructor_profile_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.id::text = (storage.foldername(name))[1]
    )
    OR
    EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON p.network_id = c.network_id
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'moderator')
      AND c.id::text = (storage.foldername(name))[1]
    )
  )
);

-- Policy: Course instructors can delete their content
CREATE POLICY "Course content instructor delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-content'
  AND (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON c.instructor_profile_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.id::text = (storage.foldername(name))[1]
    )
    OR
    EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON p.network_id = c.network_id
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'moderator')
      AND c.id::text = (storage.foldername(name))[1]
    )
  )
);

-- Add content_type column to course_lessons if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_lessons' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE course_lessons ADD COLUMN content_type VARCHAR(20) DEFAULT 'text'
      CHECK (content_type IN ('text', 'video', 'pdf', 'link', 'mixed'));
  END IF;
END $$;

-- Add external_url column for external links (YouTube, Vimeo, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_lessons' AND column_name = 'external_url'
  ) THEN
    ALTER TABLE course_lessons ADD COLUMN external_url TEXT;
  END IF;
END $$;

-- Add order column for better lesson ordering (alias for sort_order if needed)
COMMENT ON COLUMN course_lessons.sort_order IS 'Lesson order within the course (0-indexed)';
COMMENT ON COLUMN course_lessons.module_name IS 'Optional module/section name for grouping lessons';
COMMENT ON COLUMN course_lessons.content_type IS 'Primary content type: text, video, pdf, link, or mixed';
COMMENT ON COLUMN course_lessons.attachments IS 'JSON array of file attachments: [{id, type, url, fileName, fileSize, uploadedAt}]';
