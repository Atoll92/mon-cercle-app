import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Container,
  Paper,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  School as SchoolIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AccessTime as AccessTimeIcon,
  PlayCircle as PlayCircleIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  TrendingUp as TrendingUpIcon,
  LocalOffer as LocalOfferIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/authcontext';
import { useProfile } from '../../context/profileContext';
import { getCourses, getCourseCategories, enrollInCourse, getEnrollmentStatus } from '../../api/courses';
import { supabase } from '../../supabaseClient';

const CoursesPage = () => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollments, setEnrollments] = useState({});
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [activeTab, setActiveTab] = useState(0);

  const profileId = activeProfile?.id || user?.id;

  useEffect(() => {
    loadData();
  }, [profileId, activeProfile?.network_id]);

  const loadData = async () => {
    if (!activeProfile?.network_id) return;

    setLoading(true);
    setError(null);

    try {
      const [coursesResult, categoriesResult] = await Promise.all([
        getCourses(supabase, activeProfile.network_id, { 
          status: 'published',
          sortBy,
          search: searchQuery,
          categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
          difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
          isFree: priceFilter === 'free' ? true : priceFilter === 'paid' ? false : undefined
        }),
        getCourseCategories(supabase, activeProfile.network_id)
      ]);

      if (coursesResult.error) {
        throw new Error(coursesResult.error);
      }

      if (categoriesResult.error) {
        throw new Error(categoriesResult.error);
      }

      setCourses(coursesResult.data || []);
      setCategories(categoriesResult.data || []);

      // Check enrollment status for each course
      if (profileId && coursesResult.data?.length > 0) {
        const enrollmentPromises = coursesResult.data.map(course =>
          getEnrollmentStatus(supabase, course.id, profileId)
        );
        
        const enrollmentResults = await Promise.all(enrollmentPromises);
        const enrollmentMap = {};
        
        coursesResult.data.forEach((course, index) => {
          enrollmentMap[course.id] = enrollmentResults[index].data;
        });
        
        setEnrollments(enrollmentMap);
      }

    } catch (error) {
      console.error('Error loading courses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (activeProfile?.network_id) {
        loadData();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, difficultyFilter, priceFilter, sortBy]);

  const handleEnrollment = async (course) => {
    if (!profileId) return;

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

      // Update local enrollment status
      setEnrollments(prev => ({
        ...prev,
        [course.id]: result.data
      }));

      // Show success message or redirect to course
      console.log('Successfully enrolled in course:', course.title);
      
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError(error.message);
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

  const CourseCard = ({ course }) => {
    const isEnrolled = enrollments[course.id];
    
    return (
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          }
        }}
      >
        <CardMedia
          component="div"
          sx={{
            height: 200,
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
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8
            }}
          >
            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
              <BookmarkBorderIcon />
            </IconButton>
          </Box>
          {course.video_preview_url && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8
              }}
            >
              <IconButton sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}>
                <PlayCircleIcon />
              </IconButton>
            </Box>
          )}
        </CardMedia>

        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              label={course.difficulty_level}
              size="small"
              color={getDifficultyColor(course.difficulty_level)}
              variant="outlined"
            />
            {course.category && (
              <Chip
                label={course.category.name}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          <Typography variant="h6" component="h3" gutterBottom sx={{ 
            fontSize: '1.1rem',
            fontWeight: 600,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {course.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar 
              src={course.instructor?.avatar_url}
              sx={{ width: 24, height: 24 }}
            />
            <Typography variant="body2" color="text.secondary">
              {course.instructor?.display_name}
            </Typography>
          </Box>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2
            }}
          >
            {course.short_description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {course.estimated_duration_hours}h
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {course.enrollment_count} students
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating 
                value={course.rating_average} 
                precision={0.1} 
                size="small" 
                readOnly 
              />
              <Typography variant="caption" color="text.secondary">
                ({course.rating_count})
              </Typography>
            </Box>
            
            <Typography 
              variant="h6" 
              color="primary" 
              sx={{ fontWeight: 600 }}
            >
              {formatPrice(course.price, course.currency)}
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant={isEnrolled ? "outlined" : "contained"}
            color="primary"
            disabled={isEnrolled}
            onClick={() => handleEnrollment(course)}
            startIcon={isEnrolled ? <MenuBookIcon /> : <SchoolIcon />}
          >
            {isEnrolled ? 'Enrolled' : course.is_free ? 'Enroll Free' : 'Enroll Now'}
          </Button>
        </CardActions>
      </Card>
    );
  };

  const FilterSection = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              label="Difficulty"
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Price</InputLabel>
            <Select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              label="Price"
            >
              <MenuItem value="all">All Prices</MenuItem>
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="featured">Featured</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="popularity">Most Popular</MenuItem>
              <MenuItem value="rating">Highest Rated</MenuItem>
              <MenuItem value="price">Price</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Courses
        </Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
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
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Courses
        </Typography>
      </Box>

      <FilterSection />

      {courses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No courses available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || selectedCategory !== 'all' || difficultyFilter !== 'all' || priceFilter !== 'all'
              ? 'Try adjusting your filters to find more courses.'
              : 'Check back later for new course offerings.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <CourseCard course={course} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default CoursesPage;