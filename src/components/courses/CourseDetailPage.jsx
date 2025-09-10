import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Rating,
  Chip,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Container,
  Skeleton,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayCircle as PlayCircleIcon,
  School as SchoolIcon,
  AccessTime as AccessTimeIcon,
  People as PeopleIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
  Language as LanguageIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { 
  getCourseById, 
  getCourseLessons, 
  enrollInCourse, 
  getEnrollmentStatus,
  getCourseReviews,
  getLessonProgress
} from '../../api/courses';
import { supabase } from '../../supabaseClient';
import UserContent from '../UserContent';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [lessonProgress, setLessonProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [enrollmentDialog, setEnrollmentDialog] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const profileId = activeProfile?.id || user?.id;

  useEffect(() => {
    loadCourseData();
  }, [courseId, profileId]);

  const loadCourseData = async () => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    try {
      // Load course details
      const courseResult = await getCourseById(supabase, courseId);
      if (courseResult.error) {
        throw new Error(courseResult.error);
      }

      setCourse(courseResult.data);

      // Load lessons
      const lessonsResult = await getCourseLessons(supabase, courseId);
      if (!lessonsResult.error) {
        setLessons(lessonsResult.data || []);
      }

      // Load reviews
      const reviewsResult = await getCourseReviews(supabase, courseId);
      if (!reviewsResult.error) {
        setReviews(reviewsResult.data || []);
      }

      // Check enrollment status if user is logged in
      if (profileId) {
        const enrollmentResult = await getEnrollmentStatus(supabase, courseId, profileId);
        if (!enrollmentResult.error && enrollmentResult.data) {
          setEnrollment(enrollmentResult.data);
          
          // Load lesson progress if enrolled
          const progressResult = await getLessonProgress(supabase, enrollmentResult.data.id);
          if (!progressResult.error) {
            setLessonProgress(progressResult.data || []);
          }
        }
      }

    } catch (error) {
      console.error('Error loading course:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async () => {
    if (!profileId || !course) return;

    setEnrolling(true);
    try {
      const enrollmentData = {
        course_id: course.id,
        student_profile_id: profileId,
        amount_paid: course.is_free ? 0 : course.price,
        currency: course.currency || 'USD',
        payment_method: course.is_free ? 'free' : 'pending'
      };

      const result = await enrollInCourse(supabase, enrollmentData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setEnrollment(result.data);
      setEnrollmentDialog(false);
      
      // Reload course data to update enrollment count
      loadCourseData();
      
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError(error.message);
    } finally {
      setEnrolling(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getCompletedLessons = () => {
    return lessonProgress.filter(progress => progress.completed_at).length;
  };

  const getProgressPercentage = () => {
    if (lessons.length === 0) return 0;
    return (getCompletedLessons() / lessons.length) * 100;
  };

  const isLessonCompleted = (lessonId) => {
    return lessonProgress.some(progress => 
      progress.lesson_id === lessonId && progress.completed_at
    );
  };

  const canAccessLesson = (lesson, index) => {
    if (!enrollment) return lesson.is_preview;
    if (lesson.is_preview) return true;
    
    // Sequential access: can access if previous lessons are completed or this is the first
    if (index === 0) return true;
    
    const previousLesson = lessons[index - 1];
    return isLessonCompleted(previousLesson.id);
  };

  const handleLessonClick = (lesson, index) => {
    if (!canAccessLesson(lesson, index)) return;
    
    // Navigate to lesson player
    navigate(`/courses/${courseId}/lessons/${lesson.id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" width="100%" height={300} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={200} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/courses')}
          sx={{ mb: 3 }}
        >
          Back to Courses
        </Button>
        <Alert severity="error">
          {error || 'Course not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/courses')}
        sx={{ mb: 3 }}
      >
        Back to Courses
      </Button>

      {/* Course Header */}
      <Paper sx={{ p: 4, mb: 3, position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: course.cover_image_url 
              ? `url(${course.cover_image_url})` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
            zIndex: 0
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {course.category && (
                  <Chip
                    label={course.category.name}
                    size="small"
                    variant="outlined"
                  />
                )}
                <Chip
                  label={course.difficulty_level}
                  size="small"
                  color={getDifficultyColor(course.difficulty_level)}
                />
                {course.is_featured && (
                  <Chip
                    label="Featured"
                    size="small"
                    color="primary"
                  />
                )}
              </Box>

              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                {course.title}
              </Typography>

              <Typography variant="h6" color="text.secondary" paragraph>
                {course.short_description}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={course.instructor?.avatar_url} sx={{ width: 32, height: 32 }} />
                  <Typography variant="body2">
                    <strong>{course.instructor?.display_name}</strong>
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={course.rating_average} precision={0.1} size="small" readOnly />
                  <Typography variant="body2">
                    {course.rating_average} ({course.rating_count} reviews)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {course.enrollment_count} students
                  </Typography>
                </Box>
              </Box>

              {enrollment && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Progress: {getCompletedLessons()} of {lessons.length} lessons completed
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getProgressPercentage()} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}

            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                    {formatPrice(course.price, course.currency)}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Duration:</Typography>
                      <Typography variant="body2">{course.estimated_duration_hours}h</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Lessons:</Typography>
                      <Typography variant="body2">{lessons.length}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Language:</Typography>
                      <Typography variant="body2">{course.language || 'English'}</Typography>
                    </Box>
                  </Box>

                  {enrollment ? (
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      size="large"
                      startIcon={<MenuBookIcon />}
                      onClick={() => {
                        const firstIncompleteLesson = lessons.find((lesson, index) => 
                          canAccessLesson(lesson, index) && !isLessonCompleted(lesson.id)
                        );
                        if (firstIncompleteLesson) {
                          handleLessonClick(firstIncompleteLesson, lessons.indexOf(firstIncompleteLesson));
                        } else if (lessons.length > 0) {
                          handleLessonClick(lessons[0], 0);
                        }
                      }}
                    >
                      Continue Learning
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      startIcon={<SchoolIcon />}
                      onClick={() => course.is_free ? handleEnrollment() : setEnrollmentDialog(true)}
                    >
                      {course.is_free ? 'Enroll Free' : 'Enroll Now'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Course Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Curriculum" />
          <Tab label="Reviews" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h5" gutterBottom>
                  About This Course
                </Typography>
                <UserContent 
                  content={course.description} 
                  html={false}
                  sx={{ mb: 3 }}
                />

                {course.learning_objectives && course.learning_objectives.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      What You'll Learn
                    </Typography>
                    <List>
                      {course.learning_objectives.map((objective, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText primary={objective} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {course.prerequisites && course.prerequisites.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Prerequisites
                    </Typography>
                    <List>
                      {course.prerequisites.map((prerequisite, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <PlayCircleIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={prerequisite} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Course Stats
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Students Enrolled:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {course.enrollment_count}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Average Rating:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {course.rating_average}/5
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Total Reviews:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {course.rating_count}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Last Updated:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {new Date(course.updated_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Curriculum Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Course Curriculum
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {lessons.length} lessons • {course.estimated_duration_hours} hours total
              </Typography>

              {lessons.map((lesson, index) => {
                const isCompleted = isLessonCompleted(lesson.id);
                const canAccess = canAccessLesson(lesson, index);
                
                return (
                  <Accordion key={lesson.id} disabled={!canAccess}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isCompleted ? (
                            <CheckCircleIcon color="success" />
                          ) : canAccess ? (
                            <PlayCircleIcon color="primary" />
                          ) : (
                            <LockIcon color="disabled" />
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Lesson {index + 1}
                          </Typography>
                        </Box>
                        
                        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                          {lesson.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {lesson.is_preview && (
                            <Chip label="Preview" size="small" variant="outlined" />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {lesson.estimated_duration_minutes}min
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        {lesson.description}
                      </Typography>
                      
                      {canAccess && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PlayCircleIcon />}
                          onClick={() => handleLessonClick(lesson, index)}
                          sx={{ mt: 2 }}
                        >
                          {enrollment ? 'Start Lesson' : 'Preview'}
                        </Button>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}

          {/* Reviews Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Student Reviews
              </Typography>
              
              {reviews.length === 0 ? (
                <Alert severity="info">
                  No reviews yet. Be the first to review this course!
                </Alert>
              ) : (
                <Box sx={{ mt: 3 }}>
                  {reviews.map((review) => (
                    <Card key={review.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar src={review.reviewer?.avatar_url} />
                          <Box>
                            <Typography variant="subtitle2">
                              {review.reviewer?.display_name}
                            </Typography>
                            <Rating value={review.rating} size="small" readOnly />
                          </Box>
                        </Box>
                        
                        {review.title && (
                          <Typography variant="subtitle1" gutterBottom>
                            {review.title}
                          </Typography>
                        )}
                        
                        <Typography variant="body2" color="text.secondary">
                          {review.content}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Enrollment Confirmation Dialog */}
      <Dialog open={enrollmentDialog} onClose={() => setEnrollmentDialog(false)}>
        <DialogTitle>Enroll in Course</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You are about to enroll in <strong>{course.title}</strong>
          </Typography>
          <Typography variant="h6" color="primary">
            Price: {formatPrice(course.price, course.currency)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            After enrollment, you will have lifetime access to this course content.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollmentDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleEnrollment} 
            variant="contained"
            disabled={enrolling}
          >
            {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseDetailPage;