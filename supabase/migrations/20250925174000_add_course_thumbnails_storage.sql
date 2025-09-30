-- Create storage bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-thumbnails', 
  'course-thumbnails', 
  true,  -- Public bucket for course thumbnails
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create policies for course thumbnails
CREATE POLICY "Instructors can upload their course thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-thumbnails' AND
  -- Check if the user is the instructor of the course
  EXISTS (
    SELECT 1
    FROM courses
    WHERE courses.id::text = split_part(storage.objects.name, '/', 1)
      AND courses.instructor_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
  )
);

CREATE POLICY "Instructors can update their course thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK (
  bucket_id = 'course-thumbnails' AND
  -- Check if the user is the instructor of the course
  EXISTS (
    SELECT 1
    FROM courses
    WHERE courses.id::text = split_part(storage.objects.name, '/', 1)
      AND courses.instructor_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
  )
);

CREATE POLICY "Instructors can delete their course thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-thumbnails' AND
  -- Check if the user is the instructor of the course
  EXISTS (
    SELECT 1
    FROM courses
    WHERE courses.id::text = split_part(storage.objects.name, '/', 1)
      AND courses.instructor_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
  )
);

-- Everyone can view course thumbnails (public bucket)
CREATE POLICY "Anyone can view course thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-thumbnails');