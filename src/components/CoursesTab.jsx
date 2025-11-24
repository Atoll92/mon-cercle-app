import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Rating,
  Skeleton,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  alpha,
  InputAdornment,
  Badge
} from '@mui/material';
import {
  School as SchoolIcon,
  Search as SearchIcon,
  AccessTime as AccessTimeIcon,
  PlayCircle as PlayCircleIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  LocalOffer as LocalOfferIcon,
  PlayLesson as PlayLessonIcon,
  EmojiEvents as TrophyIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useTranslation } from '../hooks/useTranslation';
import { getCourses, getCourseCategories, enrollInCourse, getEnrollmentStatus, getStudentEnrollments } from '../api/courses';
import { supabase } from '../supabaseclient';
import CourseViewer from './CourseViewer';

const CoursesTab = ({ networkId, isUserMember, darkMode }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeProfile } = useProfile();

  const [courses, setCourses] = useState([]);
  const [viewingCourseId, setViewingCourseId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [enrollmentMap, setEnrollmentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters and UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [activeTab, setActiveTab] = useState(0); // 0 = All Courses, 1 = My Courses
  const [showFilters, setShowFilters] = useState(false);

  const profileId = activeProfile?.id || user?.id;
  const effectiveNetworkId = networkId || activeProfile?.network_id;

  const loadData = useCallback(async () => {
    if (!effectiveNetworkId) return;

    setLoading(true);
    setError(null);

    try {
      // Load published courses
      const coursesResult = await getCourses(supabase, effectiveNetworkId, {
        status: 'published',
        sortBy,
        search: searchQuery || undefined,
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        isFree: priceFilter === 'free' ? true : priceFilter === 'paid' ? false : undefined
      });

      if (coursesResult.error) {
        throw new Error(coursesResult.error);
      }

      setCourses(coursesResult.data || []);

      // Load categories
      const categoriesResult = await getCourseCategories(supabase, effectiveNetworkId);
      if (!categoriesResult.error) {
        setCategories(categoriesResult.data || []);
      }

      // Load enrollment status for logged in users
      if (profileId && coursesResult.data?.length > 0) {
        const enrollmentPromises = coursesResult.data.map(course =>
          getEnrollmentStatus(supabase, course.id, profileId)
        );

        const enrollmentResults = await Promise.all(enrollmentPromises);
        const newEnrollmentMap = {};

        coursesResult.data.forEach((course, index) => {
          if (enrollmentResults[index].data) {
            newEnrollmentMap[course.id] = enrollmentResults[index].data;
          }
        });

        setEnrollmentMap(newEnrollmentMap);

        // Load my enrollments for "My Courses" tab
        const myEnrollmentsResult = await getStudentEnrollments(supabase, profileId);
        if (!myEnrollmentsResult.error) {
          setMyEnrollments(myEnrollmentsResult.data || []);
        }
      }

    } catch (err) {
      console.error('Error loading courses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [effectiveNetworkId, profileId, sortBy, searchQuery, selectedCategory, difficultyFilter, priceFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [loadData]);

  const handleEnrollment = async (course) => {
    if (!profileId) return;

    setEnrolling(course.id);
    setError(null);

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

      // Update local state
      setEnrollmentMap(prev => ({
        ...prev,
        [course.id]: result.data
      }));

      setSuccessMessage(t('courses.enrollmentSuccess', { title: course.title }));
      setTimeout(() => setSuccessMessage(null), 5000);

      // Refresh my enrollments
      const myEnrollmentsResult = await getStudentEnrollments(supabase, profileId);
      if (!myEnrollmentsResult.error) {
        setMyEnrollments(myEnrollmentsResult.data || []);
      }

    } catch (err) {
      console.error('Error enrolling in course:', err);
      setError(err.message);
    } finally {
      setEnrolling(null);
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
    if (price === 0) return t('courses.free');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setDifficultyFilter('all');
    setPriceFilter('all');
    setSortBy('featured');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || difficultyFilter !== 'all' || priceFilter !== 'all';

  // Course Card Component
  const CourseCard = ({ course, enrollment, showProgress = false }) => {
    const isEnrolled = !!enrollment;
    const progress = enrollment?.progress_percentage || 0;
    const isCompleted = enrollment?.completed_at;

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          bgcolor: darkMode ? alpha('#000', 0.4) : theme.palette.background.paper,
          border: `1px solid ${darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`,
          borderRadius: 3,
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: darkMode
              ? `0 12px 40px ${alpha('#000', 0.5)}`
              : `0 12px 40px ${alpha('#000', 0.15)}`,
            borderColor: darkMode ? alpha('#fff', 0.2) : theme.palette.primary.light
          }
        }}
      >
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
          {/* Featured badge */}
          {course.is_featured && (
            <Chip
              icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
              label={t('courses.featured')}
              color="primary"
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                fontWeight: 600,
                backdropFilter: 'blur(8px)'
              }}
            />
          )}

          {/* Price badge */}
          <Chip
            icon={course.is_free ? <LocalOfferIcon sx={{ fontSize: 14 }} /> : undefined}
            label={formatPrice(course.price, course.currency)}
            color={course.is_free ? 'success' : 'default'}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              fontWeight: 600,
              bgcolor: darkMode ? alpha('#000', 0.7) : alpha('#fff', 0.95),
              backdropFilter: 'blur(8px)',
              color: course.is_free ? 'success.main' : 'text.primary'
            }}
          />

          {/* Enrolled/Completed indicator */}
          {isEnrolled && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: alpha('#000', 0.8),
                backdropFilter: 'blur(8px)',
                py: 0.5,
                px: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isCompleted ? (
                  <>
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                      {t('courses.completed')}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Box sx={{ flexGrow: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha('#fff', 0.2),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'primary.main'
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500, minWidth: 40 }}>
                      {Math.round(progress)}%
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          )}
        </CardMedia>

        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          {/* Difficulty and category chips */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <Chip
              label={t(`courses.difficulty.${course.difficulty_level}`)}
              size="small"
              color={getDifficultyColor(course.difficulty_level)}
              variant="outlined"
              sx={{ fontWeight: 500, fontSize: '0.7rem' }}
            />
            {course.category && (
              <Chip
                label={course.category.name}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  borderColor: course.category.color || undefined,
                  color: course.category.color || undefined
                }}
              />
            )}
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1.5,
              color: darkMode ? alpha('#fff', 0.95) : 'text.primary'
            }}
          >
            {course.title}
          </Typography>

          {/* Instructor */}
          {course.instructor && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Avatar
                src={course.instructor.profile_picture_url}
                sx={{ width: 28, height: 28 }}
              >
                {course.instructor.full_name?.charAt(0)}
              </Avatar>
              <Typography
                variant="body2"
                sx={{
                  color: darkMode ? alpha('#fff', 0.7) : 'text.secondary',
                  fontWeight: 500
                }}
              >
                {course.instructor.full_name}
              </Typography>
            </Box>
          )}

          {/* Description */}
          <Typography
            variant="body2"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2,
              color: darkMode ? alpha('#fff', 0.6) : 'text.secondary',
              lineHeight: 1.5
            }}
          >
            {course.short_description}
          </Typography>

          {/* Stats row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Tooltip title={t('courses.duration')}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 16, color: darkMode ? alpha('#fff', 0.5) : 'text.secondary' }} />
                <Typography variant="caption" sx={{ color: darkMode ? alpha('#fff', 0.6) : 'text.secondary' }}>
                  {course.estimated_duration_hours}h
                </Typography>
              </Box>
            </Tooltip>
            <Tooltip title={t('courses.students')}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PeopleIcon sx={{ fontSize: 16, color: darkMode ? alpha('#fff', 0.5) : 'text.secondary' }} />
                <Typography variant="caption" sx={{ color: darkMode ? alpha('#fff', 0.6) : 'text.secondary' }}>
                  {course.enrollment_count}
                </Typography>
              </Box>
            </Tooltip>
            {course.rating_count > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Rating
                  value={course.rating_average}
                  precision={0.1}
                  size="small"
                  readOnly
                  sx={{ fontSize: 14 }}
                />
                <Typography variant="caption" sx={{ color: darkMode ? alpha('#fff', 0.6) : 'text.secondary' }}>
                  ({course.rating_count})
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>

        <Divider sx={{ borderColor: darkMode ? alpha('#fff', 0.08) : alpha('#000', 0.08) }} />

        <CardActions sx={{ p: 2 }}>
          <Button
            fullWidth
            variant={isEnrolled ? "outlined" : "contained"}
            color={isCompleted ? "success" : "primary"}
            disabled={enrolling === course.id}
            onClick={() => isEnrolled ? setViewingCourseId(course.id) : handleEnrollment(course)}
            startIcon={
              isCompleted ? <TrophyIcon /> :
              isEnrolled ? <PlayLessonIcon /> :
              <SchoolIcon />
            }
            sx={{
              borderRadius: 2,
              py: 1,
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            {enrolling === course.id
              ? t('courses.enrolling')
              : isCompleted
              ? t('courses.viewCertificate')
              : isEnrolled
              ? t('courses.continueLearning')
              : course.is_free
              ? t('courses.enrollFree')
              : t('courses.enrollNow')
            }
          </Button>
        </CardActions>
      </Card>
    );
  };

  // Show CourseViewer if viewing a course
  if (viewingCourseId) {
    return (
      <CourseViewer
        courseId={viewingCourseId}
        onBack={() => setViewingCourseId(null)}
        darkMode={darkMode}
      />
    );
  }

  // Loading skeleton
  if (loading && courses.length === 0) {
    return (
      <Box sx={{ p: { xs: 0, sm: 2 } }}>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ borderRadius: 3 }}>
                <Skeleton variant="rectangular" height={180} />
                <CardContent>
                  <Skeleton variant="text" height={24} width="40%" sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={28} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} width="60%" sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={40} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // No courses available at all
  if (!loading && courses.length === 0 && !hasActiveFilters) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Paper
          sx={{
            p: 6,
            borderRadius: 3,
            bgcolor: darkMode ? alpha('#000', 0.4) : alpha('#fff', 0.8),
            border: `1px solid ${darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`
          }}
        >
          <SchoolIcon sx={{ fontSize: 80, color: darkMode ? alpha('#fff', 0.3) : 'text.secondary', mb: 3 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {t('courses.noCourses')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('courses.noCoursesDescription')}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Not a member
  if (!user) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Typography variant="body2">
            {t('courses.signInToEnroll')}
          </Typography>
        </Alert>

        {/* Still show courses but without enrollment capability */}
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <CourseCard course={course} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!isUserMember) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Paper
          sx={{
            p: 6,
            borderRadius: 3,
            bgcolor: darkMode ? alpha('#000', 0.4) : alpha('#fff', 0.8),
            border: `1px solid ${darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`
          }}
        >
          <SchoolIcon sx={{ fontSize: 80, color: darkMode ? alpha('#fff', 0.3) : 'text.secondary', mb: 3 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {t('courses.joinToAccess')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('courses.memberOnly')}
          </Typography>
        </Paper>
      </Box>
    );
  }

  const enrolledCourseIds = Object.keys(enrollmentMap);
  const myCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

  return (
    <Box sx={{ p: { xs: 0, sm: 2 } }}>
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs for All Courses / My Courses */}
      {user && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: darkMode ? alpha('#000', 0.3) : alpha('#fff', 0.8),
            border: `1px solid ${darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              px: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 56
              }
            }}
          >
            <Tab
              icon={<SchoolIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={t('courses.allCourses')}
            />
            <Tab
              icon={
                <Badge badgeContent={myCourses.length} color="primary">
                  <MenuBookIcon sx={{ fontSize: 20 }} />
                </Badge>
              }
              iconPosition="start"
              label={t('courses.myCourses')}
            />
          </Tabs>
        </Paper>
      )}

      {/* All Courses Tab */}
      {activeTab === 0 && (
        <>
          {/* Filter Section */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: darkMode ? alpha('#000', 0.3) : alpha('#fff', 0.8),
              border: `1px solid ${darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('courses.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={4} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('courses.filters.difficulty')}</InputLabel>
                  <Select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    label={t('courses.filters.difficulty')}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">{t('courses.filters.allLevels')}</MenuItem>
                    <MenuItem value="beginner">{t('courses.difficulty.beginner')}</MenuItem>
                    <MenuItem value="intermediate">{t('courses.difficulty.intermediate')}</MenuItem>
                    <MenuItem value="advanced">{t('courses.difficulty.advanced')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={4} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('courses.filters.price')}</InputLabel>
                  <Select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    label={t('courses.filters.price')}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">{t('courses.filters.allPrices')}</MenuItem>
                    <MenuItem value="free">{t('courses.free')}</MenuItem>
                    <MenuItem value="paid">{t('courses.filters.paid')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={4} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('courses.filters.sortBy')}</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label={t('courses.filters.sortBy')}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="featured">{t('courses.filters.featured')}</MenuItem>
                    <MenuItem value="newest">{t('courses.filters.newest')}</MenuItem>
                    <MenuItem value="popularity">{t('courses.filters.popular')}</MenuItem>
                    <MenuItem value="rating">{t('courses.filters.topRated')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {hasActiveFilters && (
                <Grid item xs={6} sm={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    sx={{
                      borderRadius: 2,
                      height: 40,
                      textTransform: 'none'
                    }}
                  >
                    {t('courses.filters.clear')}
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Courses Grid */}
          {courses.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: darkMode ? alpha('#000', 0.3) : alpha('#fff', 0.8),
                border: `1px solid ${darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`
              }}
            >
              <FilterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t('courses.noResults')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('courses.noResultsDescription')}
              </Typography>
              <Button variant="outlined" onClick={clearFilters}>
                {t('courses.filters.clear')}
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {courses.map((course) => (
                <Grid item xs={12} sm={6} lg={4} key={course.id}>
                  <CourseCard
                    course={course}
                    enrollment={enrollmentMap[course.id]}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* My Courses Tab */}
      {activeTab === 1 && (
        <>
          {myCourses.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: darkMode ? alpha('#000', 0.3) : alpha('#fff', 0.8),
                border: `1px solid ${darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`
              }}
            >
              <MenuBookIcon sx={{ fontSize: 80, color: darkMode ? alpha('#fff', 0.3) : 'text.secondary', mb: 3 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {t('courses.noEnrollments')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {t('courses.noEnrollmentsDescription')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<SchoolIcon />}
                onClick={() => setActiveTab(0)}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {t('courses.browseCourses')}
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {myCourses.map((course) => (
                <Grid item xs={12} sm={6} lg={4} key={course.id}>
                  <CourseCard
                    course={course}
                    enrollment={enrollmentMap[course.id]}
                    showProgress
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default CoursesTab;
