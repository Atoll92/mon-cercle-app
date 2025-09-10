import { handleArrayError, handleObjectError } from '../utils/errorHandling';

// Course Categories API

export const getCourseCategories = async (supabase, networkId) => {
  try {
    const { data, error } = await supabase
      .from('course_categories')
      .select('*')
      .eq('network_id', networkId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching course categories:', error);
    return { error: error.message };
  }
};

export const createCourseCategory = async (supabase, categoryData) => {
  try {
    const { data, error } = await supabase
      .from('course_categories')
      .insert([categoryData])
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error creating course category:', error);
    return { error: error.message };
  }
};

export const updateCourseCategory = async (supabase, categoryId, updates) => {
  try {
    const { data, error } = await supabase
      .from('course_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error updating course category:', error);
    return { error: error.message };
  }
};

export const deleteCourseCategory = async (supabase, categoryId) => {
  try {
    const { error } = await supabase
      .from('course_categories')
      .delete()
      .eq('id', categoryId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting course category:', error);
    return { error: error.message };
  }
};

// Courses API

export const getCourses = async (supabase, networkId, filters = {}) => {
  try {
    let query = supabase
      .from('courses')
      .select(`
        *,
        category:course_categories(id, name, color, icon),
        instructor:profiles!instructor_profile_id(id, display_name, avatar_url),
        enrollment_count,
        rating_average,
        rating_count
      `)
      .eq('network_id', networkId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'published');
    }

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.instructorId) {
      query = query.eq('instructor_profile_id', filters.instructorId);
    }

    if (filters.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty);
    }

    if (filters.isFree !== undefined) {
      query = query.eq('is_free', filters.isFree);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%, description.ilike.%${filters.search}%, short_description.ilike.%${filters.search}%`);
    }

    // Sorting
    if (filters.sortBy === 'price') {
      query = query.order('price', { ascending: filters.sortOrder !== 'desc' });
    } else if (filters.sortBy === 'rating') {
      query = query.order('rating_average', { ascending: false });
    } else if (filters.sortBy === 'popularity') {
      query = query.order('enrollment_count', { ascending: false });
    } else if (filters.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('is_featured', { ascending: false })
                   .order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { error: error.message };
  }
};

export const getCourseById = async (supabase, courseId) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        category:course_categories(id, name, color, icon),
        instructor:profiles!instructor_profile_id(id, display_name, avatar_url, bio),
        lessons:course_lessons(
          id, title, slug, description, is_preview, 
          video_duration_seconds, estimated_duration_minutes, sort_order
        )
      `)
      .eq('id', courseId)
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error fetching course:', error);
    return { error: error.message };
  }
};

export const createCourse = async (supabase, courseData) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error creating course:', error);
    return { error: error.message };
  }
};

export const updateCourse = async (supabase, courseId, updates) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error updating course:', error);
    return { error: error.message };
  }
};

export const deleteCourse = async (supabase, courseId) => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { error: error.message };
  }
};

export const publishCourse = async (supabase, courseId) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update({ 
        status: 'published', 
        published_at: new Date().toISOString() 
      })
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error publishing course:', error);
    return { error: error.message };
  }
};

// Course Lessons API

export const getCourseLessons = async (supabase, courseId) => {
  try {
    const { data, error } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching course lessons:', error);
    return { error: error.message };
  }
};

export const getLessonById = async (supabase, lessonId) => {
  try {
    const { data, error } = await supabase
      .from('course_lessons')
      .select(`
        *,
        course:courses(id, title, instructor_profile_id)
      `)
      .eq('id', lessonId)
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return { error: error.message };
  }
};

export const createLesson = async (supabase, lessonData) => {
  try {
    const { data, error } = await supabase
      .from('course_lessons')
      .insert([lessonData])
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error creating lesson:', error);
    return { error: error.message };
  }
};

export const updateLesson = async (supabase, lessonId, updates) => {
  try {
    const { data, error } = await supabase
      .from('course_lessons')
      .update(updates)
      .eq('id', lessonId)
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return { error: error.message };
  }
};

export const deleteLesson = async (supabase, lessonId) => {
  try {
    const { error } = await supabase
      .from('course_lessons')
      .delete()
      .eq('id', lessonId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return { error: error.message };
  }
};

// Course Enrollments API

export const getCourseEnrollments = async (supabase, courseId) => {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        student:profiles!student_profile_id(id, display_name, avatar_url),
        course:courses(id, title)
      `)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });
    
    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    return { error: error.message };
  }
};

export const getStudentEnrollments = async (supabase, studentProfileId) => {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        course:courses(
          id, title, slug, thumbnail_url, instructor_profile_id,
          instructor:profiles!instructor_profile_id(id, display_name, avatar_url)
        )
      `)
      .eq('student_profile_id', studentProfileId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });
    
    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    return { error: error.message };
  }
};

export const enrollInCourse = async (supabase, enrollmentData) => {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert([enrollmentData])
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return { error: error.message };
  }
};

export const updateEnrollmentProgress = async (supabase, enrollmentId, progressData) => {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .update({
        ...progressData,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', enrollmentId)
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error updating enrollment progress:', error);
    return { error: error.message };
  }
};

export const getEnrollmentStatus = async (supabase, courseId, studentProfileId) => {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_profile_id', studentProfileId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }
    
    return { data: data || null };
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return { error: error.message };
  }
};

// Course Reviews API

export const getCourseReviews = async (supabase, courseId) => {
  try {
    const { data, error } = await supabase
      .from('course_reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_profile_id(id, display_name, avatar_url)
      `)
      .eq('course_id', courseId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching course reviews:', error);
    return { error: error.message };
  }
};

export const createCourseReview = async (supabase, reviewData) => {
  try {
    const { data, error } = await supabase
      .from('course_reviews')
      .insert([reviewData])
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error creating course review:', error);
    return { error: error.message };
  }
};

// Lesson Progress API

export const getLessonProgress = async (supabase, enrollmentId) => {
  try {
    const { data, error } = await supabase
      .from('course_lesson_progress')
      .select(`
        *,
        lesson:course_lessons(id, title, sort_order)
      `)
      .eq('enrollment_id', enrollmentId)
      .order('lesson.sort_order', { ascending: true });
    
    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return { error: error.message };
  }
};

export const updateLessonProgress = async (supabase, enrollmentId, lessonId, progressData) => {
  try {
    const { data, error } = await supabase
      .from('course_lesson_progress')
      .upsert([{
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        ...progressData
      }])
      .select()
      .single();
    
    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return { error: error.message };
  }
};

// Course Stats API

export const getCourseStats = async (supabase, courseId) => {
  try {
    const [enrollmentsResult, reviewsResult, progressResult] = await Promise.all([
      // Total enrollments
      supabase
        .from('course_enrollments')
        .select('id', { count: 'exact' })
        .eq('course_id', courseId)
        .eq('is_active', true),
      
      // Review stats
      supabase
        .from('course_reviews')
        .select('rating')
        .eq('course_id', courseId)
        .eq('is_approved', true),
      
      // Completion stats
      supabase
        .from('course_enrollments')
        .select('progress_percentage, completed_at')
        .eq('course_id', courseId)
        .eq('is_active', true)
    ]);

    const enrollmentCount = enrollmentsResult.count || 0;
    const reviews = reviewsResult.data || [];
    const enrollments = progressResult.data || [];

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    const completionCount = enrollments.filter(e => e.completed_at).length;
    const completionRate = enrollmentCount > 0 ? (completionCount / enrollmentCount) * 100 : 0;

    const averageProgress = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length
      : 0;

    return {
      data: {
        enrollmentCount,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: reviews.length,
        completionCount,
        completionRate: Math.round(completionRate * 10) / 10,
        averageProgress: Math.round(averageProgress * 10) / 10
      }
    };
  } catch (error) {
    console.error('Error fetching course stats:', error);
    return { error: error.message };
  }
};

// Instructor Dashboard Stats
export const getInstructorStats = async (supabase, instructorProfileId) => {
  try {
    const [coursesResult, enrollmentsResult, revenueResult] = await Promise.all([
      // Total courses
      supabase
        .from('courses')
        .select('id, status', { count: 'exact' })
        .eq('instructor_profile_id', instructorProfileId),
      
      // Total enrollments across all courses
      supabase
        .from('course_enrollments')
        .select('course_id, amount_paid, currency')
        .in('course_id', 
          supabase
            .from('courses')
            .select('id')
            .eq('instructor_profile_id', instructorProfileId)
        )
        .eq('is_active', true),
      
      // Recent enrollments
      supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses!inner(id, title, instructor_profile_id),
          student:profiles!student_profile_id(display_name)
        `)
        .eq('course.instructor_profile_id', instructorProfileId)
        .eq('is_active', true)
        .order('enrolled_at', { ascending: false })
        .limit(10)
    ]);

    const courses = coursesResult.data || [];
    const enrollments = enrollmentsResult.data || [];
    const recentEnrollments = revenueResult.data || [];

    const totalRevenue = enrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.amount_paid || 0);
    }, 0);

    const coursesByStatus = courses.reduce((acc, course) => {
      acc[course.status] = (acc[course.status] || 0) + 1;
      return acc;
    }, {});

    return {
      data: {
        totalCourses: courses.length,
        publishedCourses: coursesByStatus.published || 0,
        draftCourses: coursesByStatus.draft || 0,
        totalEnrollments: enrollments.length,
        totalRevenue,
        recentEnrollments: recentEnrollments.map(e => ({
          id: e.id,
          courseName: e.course.title,
          studentName: e.student.display_name,
          enrolledAt: e.enrolled_at,
          amountPaid: e.amount_paid
        }))
      }
    };
  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    return { error: error.message };
  }
};