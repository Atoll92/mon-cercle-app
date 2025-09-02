import { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Alert,
  LinearProgress
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
  School as CourseIcon
} from '@mui/icons-material';

function CoursesTab({ networkId, darkMode }) {
  const theme = useTheme();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    estimated_hours: '',
    price: 0
  });

  // Mock data for demonstration
  useEffect(() => {
    setCourses([
      {
        id: 1,
        title: 'Introduction to Community Building',
        description: 'Learn the fundamentals of building and managing online communities',
        category: 'Community',
        difficulty: 'beginner',
        estimated_hours: 8,
        enrolled_count: 24,
        completion_rate: 78,
        price: 49.99,
        modules: 6,
        quizzes: 4,
        videos: 12,
        files: 8
      },
      {
        id: 2,
        title: 'Advanced Networking Strategies',
        description: 'Master advanced techniques for professional networking',
        category: 'Professional',
        difficulty: 'advanced',
        estimated_hours: 12,
        enrolled_count: 18,
        completion_rate: 65,
        price: 99.99,
        modules: 8,
        quizzes: 6,
        videos: 18,
        files: 15
      }
    ]);
  }, []);

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setNewCourse({
      title: '',
      description: '',
      category: '',
      difficulty: 'beginner',
      estimated_hours: '',
      price: 0
    });
    setDialogOpen(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setNewCourse({
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      estimated_hours: course.estimated_hours,
      price: course.price
    });
    setDialogOpen(true);
  };

  const handleSaveCourse = () => {
    // Here you would implement the actual save logic
    console.log('Saving course:', newCourse);
    setDialogOpen(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

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
            Course Management
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ color: theme.palette.custom.mediumText, mb: 3 }}>
          Seamlessly blend courses with your community. Create engaging learning experiences with native video hosting, 
          file storage, quizzes, and comprehensive student analytics.
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={2.4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <VideoIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h6">Native Video</Typography>
              <Typography variant="body2" color="text.secondary">
                Built-in video hosting
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <FileIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />
              <Typography variant="h6">File Storage</Typography>
              <Typography variant="body2" color="text.secondary">
                Secure file management
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <QuizIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h6">Quizzes</Typography>
              <Typography variant="body2" color="text.secondary">
                Interactive assessments
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <StudentsIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
              <Typography variant="h6">Student Dashboard</Typography>
              <Typography variant="body2" color="text.secondary">
                Student progress tracking
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <AnalyticsIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h6">Course Analytics</Typography>
              <Typography variant="body2" color="text.secondary">
                Performance insights
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
          Create New Course
        </Button>
      </Paper>

      {/* Courses List */}
      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.custom.lightText }}>
        Your Courses ({courses.length})
      </Typography>

      <Grid container spacing={3}>
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
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ color: theme.palette.custom.lightText }}>
                    {course.title}
                  </Typography>
                  <Chip
                    label={course.difficulty}
                    color={getDifficultyColor(course.difficulty)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: theme.palette.custom.mediumText, mb: 2 }}>
                  {course.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.custom.mediumText }}>
                    Category: {course.category} • {course.estimated_hours}h • ${course.price}
                  </Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StudentsIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.custom.mediumText }} />
                      <Typography variant="caption">
                        {course.enrolled_count} enrolled
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AnalyticsIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.custom.mediumText }} />
                      <Typography variant="caption">
                        {course.completion_rate}% completion
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.custom.mediumText }}>
                    Completion Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={course.completion_rate}
                    sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Grid container spacing={1}>
                  <Grid item>
                    <Chip
                      icon={<VideoIcon />}
                      label={`${course.videos} videos`}
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item>
                    <Chip
                      icon={<QuizIcon />}
                      label={`${course.quizzes} quizzes`}
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item>
                    <Chip
                      icon={<FileIcon />}
                      label={`${course.files} files`}
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  startIcon={<PlayIcon />}
                  variant="outlined"
                >
                  Preview
                </Button>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleEditCourse(course)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Course Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCourse ? 'Edit Course' : 'Create New Course'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Course Title"
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={newCourse.difficulty}
                    onChange={(e) => setNewCourse({ ...newCourse, difficulty: e.target.value })}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Hours"
                  type="number"
                  value={newCourse.estimated_hours}
                  onChange={(e) => setNewCourse({ ...newCourse, estimated_hours: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price ($)"
                  type="number"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveCourse} variant="contained">
            {selectedCourse ? 'Update' : 'Create'} Course
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CoursesTab;