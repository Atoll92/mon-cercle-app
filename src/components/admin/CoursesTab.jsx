import { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation.jsx';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  useTheme,
  Alert,
  Skeleton,
  CardMedia,
  Avatar,
  Rating,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Quiz as QuizIcon,
  VideoLibrary as VideoIcon,
  FilePresent as FileIcon,
  Analytics as AnalyticsIcon,
  People as StudentsIcon,
  School as CourseIcon,
  AccessTime as AccessTimeIcon,
  LibraryBooks as ContentIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/authcontext';
import { useProfile } from '../../context/profileContext';
import { supabase } from '../../supabaseclient';
import { getCourses, createCourse, deleteCourse } from '../../api/courses';
import CourseCreationDialog from './CourseCreationDialog';
import CourseContentManager from './CourseContentManager';
import ConfirmDialog from '../ConfirmDialog';

function CoursesTab({ networkId }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const profileId = activeProfile?.id || user?.id;
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Load courses and categories
  useEffect(() => {
    if (networkId) {
      loadData();
    }
  }, [networkId]);

  const loadData = async () => {
    console.log('CoursesTab: loadData called for networkId:', networkId);
    setLoading(true);
    setError(null);
    
    try {
      // Load courses
      console.log('CoursesTab: Calling getCourses API...');
      const coursesResult = await getCourses(supabase, networkId, { status: 'all' });
      console.log('CoursesTab: getCourses result:', coursesResult);

      if (coursesResult.error) {
        throw new Error(coursesResult.error);
      }

      console.log('CoursesTab: Setting courses data:', coursesResult.data);
      setCourses(coursesResult.data || []);
      console.log('CoursesTab: Courses state updated with', coursesResult.data?.length || 0, 'courses');
    } catch (error) {
      console.error('Error loading courses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setDialogOpen(true);
  };

  const handleSubmitCourse = async (courseData, thumbnailFile) => {
    console.log('CoursesTab: handleSubmitCourse called');
    console.log('Received courseData:', courseData);
    console.log('NetworkId:', networkId, 'ProfileId:', profileId);
    
    try {
      setLoading(true);
      
      // Prepare course data with proper field names
      const coursePayload = {
        network_id: networkId,
        instructor_profile_id: profileId,
        title: courseData.title,
        slug: courseData.slug,
        short_description: courseData.shortDescription,
        description: courseData.description,
        category_id: null, // No category required
        difficulty_level: courseData.difficultyLevel,
        price: courseData.price,
        currency: courseData.currency,
        is_free: courseData.isFree,
        estimated_duration_hours: courseData.estimatedDurationHours,
        language: courseData.language,
        max_students: courseData.maxStudents,
        learning_objectives: courseData.learningObjectives,
        prerequisites: courseData.prerequisites,
        target_audience: courseData.targetAudience,
        tags: courseData.tags,
        status: 'draft' // Start as draft
      };

      console.log('CoursesTab: Sending coursePayload to API:', coursePayload);

      // Create the course
      const result = await createCourse(supabase, coursePayload);
      console.log('CoursesTab: createCourse result:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Upload thumbnail if provided
      if (thumbnailFile && result.data) {
        console.log('CoursesTab: Uploading thumbnail for course:', result.data.id);
        try {
          const fileExt = thumbnailFile.name.split('.').pop();
          const fileName = `${result.data.id}/thumbnail.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('course-thumbnails')
            .upload(fileName, thumbnailFile, { upsert: true });

          if (uploadError) {
            console.error('CoursesTab: Thumbnail upload error:', uploadError);
          } else {
            // Update course with thumbnail URL
            const { data: { publicUrl } } = supabase.storage
              .from('course-thumbnails')
              .getPublicUrl(fileName);

            console.log('CoursesTab: Thumbnail URL:', publicUrl);

            await supabase
              .from('courses')
              .update({ thumbnail_url: publicUrl })
              .eq('id', result.data.id);
          }
        } catch (thumbError) {
          console.error('CoursesTab: Error uploading thumbnail:', thumbError);
          // Don't fail the whole operation if thumbnail fails
        }
      }

      // Reload courses
      console.log('CoursesTab: Reloading course list...');
      await loadData();
      console.log('CoursesTab: Course list reloaded, closing dialog');
      setDialogOpen(false);
    } catch (error) {
      console.error('CoursesTab: Error creating course:', error);
      setError(error.message || 'Failed to create course');
    } finally {
      console.log('CoursesTab: Setting loading to false');
      setLoading(false);
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

  const handleManageContent = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleBackFromContent = () => {
    setSelectedCourseId(null);
    loadData(); // Refresh courses list
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setLoading(true);
      const result = await deleteCourse(supabase, courseToDelete.id);
      if (result.error) {
        throw new Error(result.error);
      }
      await loadData();
      setConfirmDelete(false);
      setCourseToDelete(null);
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If a course is selected for content management, show the content manager
  if (selectedCourseId) {
    return (
      <CourseContentManager
        courseId={selectedCourseId}
        onBack={handleBackFromContent}
      />
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${theme.palette.custom.border}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CourseIcon sx={{ mr: 2, color: theme.palette.primary.main, fontSize: 32 }} />
          <Typography variant="h5" component="h2" sx={{ color: theme.palette.custom.lightText }}>
            {t('admin.courses.title')}
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ color: theme.palette.custom.mediumText, mb: 3 }}>
          {t('admin.courses.description')}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={2.4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <VideoIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h6">{t('admin.courses.features.nativeVideo.title')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.courses.features.nativeVideo.description')}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <FileIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />
              <Typography variant="h6">{t('admin.courses.features.fileStorage.title')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.courses.features.fileStorage.description')}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <QuizIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h6">{t('admin.courses.features.quizzes.title')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.courses.features.quizzes.description')}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <StudentsIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
              <Typography variant="h6">{t('admin.courses.features.studentDashboard.title')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.courses.features.studentDashboard.description')}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <AnalyticsIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h6">{t('admin.courses.features.courseAnalytics.title')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.courses.features.courseAnalytics.description')}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateCourse}
          sx={{ mt: 2 }}
        >
          {t('admin.courses.buttons.createNewCourse')}
        </Button>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Courses List */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 2, color: theme.palette.custom.lightText }}>
            {t('admin.courses.coursesList.title', { count: courses.length })}
          </Typography>

          {courses.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <CourseIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No courses yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first course to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateCourse}
              >
                Create First Course
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {console.log('CoursesTab: Rendering', courses.length, 'courses:', courses)}
              {courses.map((course) => (
                <Grid item xs={12} md={6} lg={4} key={course.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.custom.border}`
                    }}
                  >
                    {/* Course Thumbnail */}
                    <CardMedia
                      component="div"
                      sx={{
                        height: 180,
                        background: course.thumbnail_url 
                          ? `url(${course.thumbnail_url})` 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}
                    >
                      {course.is_featured && (
                        <Chip
                          label="Featured"
                          color="primary"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8
                          }}
                        />
                      )}
                      <Chip
                        label={course.status}
                        color={course.status === 'published' ? 'success' : 'warning'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8
                        }}
                      />
                    </CardMedia>

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h3" sx={{ color: theme.palette.custom.lightText }}>
                          {course.title}
                        </Typography>
                        <Chip
                          label={t(`admin.courses.difficulty.${course.difficulty_level}`)}
                          color={getDifficultyColor(course.difficulty_level)}
                          size="small"
                        />
                      </Box>

                      {/* Instructor */}
                      {course.instructor && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Avatar 
                            src={course.instructor.profile_picture_url}
                            sx={{ width: 24, height: 24 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {course.instructor.full_name}
                          </Typography>
                        </Box>
                      )}
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.custom.mediumText, 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {course.short_description || course.description}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.custom.mediumText }}>
                          {course.estimated_duration_hours}h • {formatPrice(course.price, course.currency)}
                        </Typography>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StudentsIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.custom.mediumText }} />
                            <Typography variant="caption">
                              {course.enrollment_count || 0} {t('admin.courses.stats.enrolled')}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.custom.mediumText }} />
                            <Typography variant="caption">
                              Created {new Date(course.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Rating if available */}
                      {course.rating_average > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                          <Rating 
                            value={course.rating_average} 
                            precision={0.1} 
                            size="small" 
                            readOnly 
                          />
                          <Typography variant="caption" color="text.secondary">
                            ({course.rating_count || 0})
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ContentIcon />}
                        variant="contained"
                        onClick={() => handleManageContent(course.id)}
                      >
                        {t('admin.courses.buttons.manageContent')}
                      </Button>
                      <Box>
                        <Tooltip title={t('admin.courses.buttons.preview')}>
                          <IconButton size="small">
                            <PlayIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedCourseId(course.id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setCourseToDelete(course);
                              setConfirmDelete(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Course Creation Dialog */}
      <CourseCreationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmitCourse}
        categories={[]}
        loading={loading}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setCourseToDelete(null);
        }}
        onConfirm={handleDeleteCourse}
        title={t('admin.courses.deleteCourse')}
        message={t('admin.courses.deleteCourseConfirm', { title: courseToDelete?.title })}
        confirmText={t('common.delete')}
        confirmColor="error"
      />
    </Box>
  );
}

export default CoursesTab;