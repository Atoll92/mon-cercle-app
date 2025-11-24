import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  AppBar,
  Toolbar,
  LinearProgress,
  Chip,
  Avatar,
  Divider,
  Alert,
  Skeleton,
  Collapse,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayCircle as PlayIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Description as DocumentIcon,
  Link as LinkIcon,
  VideoLibrary as VideoIcon,
  TextFields as TextIcon,
  Layers as MixedIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  ExpandLess,
  ExpandMore,
  AccessTime as AccessTimeIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { supabase } from '../supabaseclient';
import {
  getCourseById,
  getLessonById,
  getEnrollmentStatus,
  getLessonProgress,
  updateLessonProgress
} from '../api/courses';
import UserContent from './UserContent';
import MediaPlayer from './MediaPlayer';
import LinkPreview from './LinkPreview';

const CONTENT_TYPE_ICONS = {
  text: TextIcon,
  video: VideoIcon,
  pdf: DocumentIcon,
  link: LinkIcon,
  mixed: MixedIcon
};

const CourseViewer = ({ courseId, onBack, darkMode }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [lessonProgress, setLessonProgress] = useState({});
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [expandedModules, setExpandedModules] = useState({});

  const profileId = activeProfile?.id || user?.id;

  // Load course data
  const loadCourse = useCallback(async () => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    try {
      // Get course with lessons
      const courseResult = await getCourseById(supabase, courseId);
      if (courseResult.error) throw new Error(courseResult.error);
      setCourse(courseResult.data);

      // Get enrollment status
      if (profileId) {
        const enrollmentResult = await getEnrollmentStatus(supabase, courseId, profileId);
        if (enrollmentResult.data) {
          setEnrollment(enrollmentResult.data);

          // Get lesson progress
          const progressResult = await getLessonProgress(supabase, enrollmentResult.data.id);
          if (progressResult.data) {
            const progressMap = {};
            progressResult.data.forEach(p => {
              progressMap[p.lesson_id] = p;
            });
            setLessonProgress(progressMap);
          }
        }
      }

      // Auto-select first lesson or last incomplete lesson
      if (courseResult.data?.lessons?.length > 0) {
        const sortedLessons = [...courseResult.data.lessons].sort((a, b) => a.sort_order - b.sort_order);

        // Find the first incomplete lesson
        let lessonToLoad = sortedLessons[0];
        for (const lesson of sortedLessons) {
          const progress = lessonProgress[lesson.id];
          if (!progress || !progress.completed_at) {
            lessonToLoad = lesson;
            break;
          }
        }

        await loadLesson(lessonToLoad.id);
      }

    } catch (err) {
      console.error('Error loading course:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, profileId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  // Load a specific lesson
  const loadLesson = async (lessonId) => {
    setLessonLoading(true);
    try {
      const result = await getLessonById(supabase, lessonId);
      if (result.error) throw new Error(result.error);
      setCurrentLesson(result.data);

      // Mark lesson as started if enrolled
      if (enrollment && !lessonProgress[lessonId]) {
        await updateLessonProgress(supabase, enrollment.id, lessonId, {
          started_at: new Date().toISOString(),
          progress_percentage: 0
        });
        setLessonProgress(prev => ({
          ...prev,
          [lessonId]: { started_at: new Date().toISOString(), progress_percentage: 0 }
        }));
      }
    } catch (err) {
      console.error('Error loading lesson:', err);
      setError(err.message);
    } finally {
      setLessonLoading(false);
    }
  };

  // Mark lesson as complete
  const markLessonComplete = async () => {
    if (!enrollment || !currentLesson) return;

    try {
      await updateLessonProgress(supabase, enrollment.id, currentLesson.id, {
        completed_at: new Date().toISOString(),
        progress_percentage: 100
      });
      setLessonProgress(prev => ({
        ...prev,
        [currentLesson.id]: {
          ...prev[currentLesson.id],
          completed_at: new Date().toISOString(),
          progress_percentage: 100
        }
      }));

      // Auto-advance to next lesson
      if (course?.lessons) {
        const sortedLessons = [...course.lessons].sort((a, b) => a.sort_order - b.sort_order);
        const currentIndex = sortedLessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex < sortedLessons.length - 1) {
          await loadLesson(sortedLessons[currentIndex + 1].id);
        }
      }
    } catch (err) {
      console.error('Error marking lesson complete:', err);
    }
  };

  // Calculate overall progress
  const calculateProgress = () => {
    if (!course?.lessons?.length) return 0;
    const completed = Object.values(lessonProgress).filter(p => p.completed_at).length;
    return Math.round((completed / course.lessons.length) * 100);
  };

  // Group lessons by module
  const getLessonsByModule = () => {
    if (!course?.lessons) return {};

    const modules = {};
    const sortedLessons = [...course.lessons].sort((a, b) => a.sort_order - b.sort_order);

    sortedLessons.forEach(lesson => {
      const moduleName = lesson.module_name || t('courses.viewer.defaultModule');
      if (!modules[moduleName]) {
        modules[moduleName] = [];
      }
      modules[moduleName].push(lesson);
    });

    return modules;
  };

  const toggleModule = (moduleName) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  // Helper to detect embeddable URLs
  const isEmbeddableUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') ||
           url.includes('youtu.be') ||
           url.includes('vimeo.com') ||
           url.includes('dailymotion.com') ||
           url.includes('twitch.tv') ||
           url.includes('soundcloud.com') ||
           url.includes('spotify.com');
  };

  // Extract YouTube video ID from URL
  const getYouTubeId = (url) => {
    if (!url) return null;
    // Handle youtu.be format
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    // Handle youtube.com/watch?v= format
    const longMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (longMatch) return longMatch[1];
    // Handle youtube.com/embed/ format
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
    return null;
  };

  // Extract Vimeo video ID from URL
  const getVimeoId = (url) => {
    if (!url) return null;
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  // Check if URL is a YouTube URL
  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Check if URL is a Vimeo URL
  const isVimeoUrl = (url) => {
    if (!url) return false;
    return url.includes('vimeo.com');
  };

  // Render embedded video player for YouTube/Vimeo
  const renderVideoEmbed = (url) => {
    const youtubeId = getYouTubeId(url);
    const vimeoId = getVimeoId(url);

    if (youtubeId) {
      return (
        <Box
          sx={{
            position: 'relative',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: 'black'
          }}
        >
          <Box
            component="iframe"
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
            title={currentLesson?.title || 'Video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        </Box>
      );
    }

    if (vimeoId) {
      return (
        <Box
          sx={{
            position: 'relative',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: 'black'
          }}
        >
          <Box
            component="iframe"
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title={currentLesson?.title || 'Video'}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        </Box>
      );
    }

    // Fallback for other platforms - use LinkPreview
    return <LinkPreview url={url} compact={false} />;
  };

  // Render lesson content based on type
  const renderLessonContent = () => {
    if (!currentLesson) return null;

    const contentType = currentLesson.content_type || 'text';

    return (
      <Box sx={{ mb: 3 }}>
        {/* Video content - use iframe for YouTube/Vimeo, MediaPlayer for direct files */}
        {(contentType === 'video' || contentType === 'mixed') && currentLesson.video_url && (
          <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            {isYouTubeUrl(currentLesson.video_url) || isVimeoUrl(currentLesson.video_url) ? (
              renderVideoEmbed(currentLesson.video_url)
            ) : (
              <MediaPlayer
                src={currentLesson.video_url}
                type="video"
                title={currentLesson.title}
              />
            )}
          </Box>
        )}

        {/* Text content */}
        {(contentType === 'text' || contentType === 'mixed') && currentLesson.content && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: darkMode ? alpha('#fff', 0.03) : alpha('#000', 0.02),
              borderRadius: 2
            }}
          >
            <UserContent content={currentLesson.content} html />
          </Paper>
        )}

        {/* PDF content - get from attachments array */}
        {(contentType === 'pdf' || contentType === 'mixed') && currentLesson.attachments?.length > 0 && (
          <>
            {currentLesson.attachments
              .filter(att => att.type === 'application/pdf' || att.url?.endsWith('.pdf'))
              .map((attachment, index) => (
                <Box key={attachment.id || index} sx={{ mb: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: darkMode ? alpha('#fff', 0.03) : alpha('#000', 0.02)
                    }}
                  >
                    <Box
                      component="iframe"
                      src={attachment.url}
                      title={attachment.name || currentLesson.title || 'PDF Document'}
                      sx={{
                        width: '100%',
                        height: { xs: '60vh', md: '70vh' },
                        minHeight: 500,
                        border: 'none',
                        display: 'block'
                      }}
                    />
                  </Paper>
                </Box>
              ))}
          </>
        )}

        {/* External link - embed YouTube/Vimeo, show LinkPreview for others */}
        {(contentType === 'link' || contentType === 'mixed') && currentLesson.external_url && (
          <Box sx={{ mb: 3 }}>
            {isYouTubeUrl(currentLesson.external_url) || isVimeoUrl(currentLesson.external_url) ? (
              // Embeddable video content (YouTube, Vimeo)
              renderVideoEmbed(currentLesson.external_url)
            ) : (
              // Non-embeddable link - show preview card
              <LinkPreview
                url={currentLesson.external_url}
                compact={false}
              />
            )}
          </Box>
        )}

        {/* Attachments - embed media inline based on type */}
        {currentLesson.attachments && currentLesson.attachments.length > 0 && contentType !== 'pdf' && (
          <Box sx={{ mt: 3 }}>
            {currentLesson.attachments.map((attachment, index) => {
              const isPdf = attachment.type === 'application/pdf' || attachment.url?.endsWith('.pdf');
              const isVideo = attachment.type?.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(attachment.url);
              const isAudio = attachment.type?.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(attachment.url);
              const isImage = attachment.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.url);

              // PDF - embed inline
              if (isPdf) {
                return (
                  <Box key={attachment.id || index} sx={{ mb: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: darkMode ? alpha('#fff', 0.03) : alpha('#000', 0.02)
                      }}
                    >
                      <Box
                        component="iframe"
                        src={attachment.url}
                        title={attachment.name || 'PDF Document'}
                        sx={{
                          width: '100%',
                          height: { xs: '60vh', md: '70vh' },
                          minHeight: 500,
                          border: 'none',
                          display: 'block'
                        }}
                      />
                    </Paper>
                  </Box>
                );
              }

              // Video - use MediaPlayer or YouTube/Vimeo embed
              if (isVideo) {
                if (isYouTubeUrl(attachment.url) || isVimeoUrl(attachment.url)) {
                  return (
                    <Box key={attachment.id || index} sx={{ mb: 3 }}>
                      {renderVideoEmbed(attachment.url)}
                    </Box>
                  );
                }
                return (
                  <Box key={attachment.id || index} sx={{ mb: 3 }}>
                    <MediaPlayer
                      src={attachment.url}
                      type="video"
                      title={attachment.name}
                    />
                  </Box>
                );
              }

              // Audio - use MediaPlayer
              if (isAudio) {
                return (
                  <Box key={attachment.id || index} sx={{ mb: 3 }}>
                    <MediaPlayer
                      src={attachment.url}
                      type="audio"
                      title={attachment.name}
                    />
                  </Box>
                );
              }

              // Image - display inline
              if (isImage) {
                return (
                  <Box key={attachment.id || index} sx={{ mb: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: darkMode ? alpha('#fff', 0.03) : alpha('#000', 0.02)
                      }}
                    >
                      <Box
                        component="img"
                        src={attachment.url}
                        alt={attachment.name || 'Image'}
                        sx={{
                          width: '100%',
                          maxHeight: '70vh',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                      />
                    </Paper>
                  </Box>
                );
              }

              // Other files - show download link
              return (
                <Box key={attachment.id || index} sx={{ mb: 2 }}>
                  <ListItemButton
                    component="a"
                    href={attachment.url}
                    target="_blank"
                    sx={{
                      borderRadius: 1,
                      bgcolor: darkMode ? alpha('#fff', 0.03) : alpha('#000', 0.02)
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <DocumentIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={attachment.name || `Attachment ${index + 1}`}
                      secondary={attachment.size ? formatFileSize(attachment.size) : null}
                    />
                  </ListItemButton>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    );
  };

  // Helper functions
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ width: isMobile ? '100%' : 320, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Course header in sidebar */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
          {course?.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={calculateProgress()}
            sx={{
              flexGrow: 1,
              height: 8,
              borderRadius: 4,
              bgcolor: darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {calculateProgress()}%
          </Typography>
        </Box>
      </Box>

      {/* Lessons list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {Object.entries(getLessonsByModule()).map(([moduleName, lessons]) => (
          <Box key={moduleName}>
            {Object.keys(getLessonsByModule()).length > 1 && (
              <ListItemButton onClick={() => toggleModule(moduleName)} sx={{ bgcolor: darkMode ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
                <ListItemText
                  primary={moduleName}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                />
                {expandedModules[moduleName] !== false ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            )}
            <Collapse in={expandedModules[moduleName] !== false} timeout="auto" unmountOnExit={false}>
              <List disablePadding>
                {lessons.map((lesson, index) => {
                  const progress = lessonProgress[lesson.id];
                  const isComplete = progress?.completed_at;
                  const isActive = currentLesson?.id === lesson.id;
                  const ContentIcon = CONTENT_TYPE_ICONS[lesson.content_type] || TextIcon;

                  return (
                    <ListItemButton
                      key={lesson.id}
                      onClick={() => loadLesson(lesson.id)}
                      selected={isActive}
                      sx={{
                        pl: Object.keys(getLessonsByModule()).length > 1 ? 4 : 2,
                        borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                        bgcolor: isActive ? (darkMode ? alpha('#fff', 0.05) : alpha('#000', 0.04)) : 'transparent'
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {isComplete ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <ContentIcon fontSize="small" sx={{ color: darkMode ? alpha('#fff', 0.5) : alpha('#000', 0.4) }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={lesson.title}
                        secondary={lesson.estimated_duration_minutes ? `${lesson.estimated_duration_minutes} min` : null}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 600 : 400,
                          sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Collapse>
          </Box>
        ))}
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2, borderRadius: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          {t('courses.viewer.backToCourses')}
        </Button>
      </Box>
    );
  }

  if (!enrollment) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('courses.viewer.notEnrolled')}
        </Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={onBack}>
          {t('courses.viewer.backToCourses')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh' }}>
      {/* Top App Bar */}
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: darkMode ? alpha('#000', 0.4) : theme.palette.background.paper
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={onBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          {isMobile && (
            <IconButton onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {currentLesson?.title || course?.title}
            </Typography>
            {!isMobile && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('courses.viewer.lessonOf', {
                  current: course?.lessons?.findIndex(l => l.id === currentLesson?.id) + 1 || 1,
                  total: course?.lessons?.length || 0
                })}
              </Typography>
            )}
          </Box>
          <Chip
            icon={<SchoolIcon sx={{ fontSize: 16 }} />}
            label={`${calculateProgress()}%`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Sidebar - Drawer on mobile, permanent on desktop */}
        {isMobile ? (
          <Drawer
            anchor="left"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            PaperProps={{
              sx: {
                bgcolor: darkMode ? alpha('#000', 0.95) : theme.palette.background.paper
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton onClick={() => setSidebarOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            {sidebarContent}
          </Drawer>
        ) : (
          <Paper
            elevation={0}
            sx={{
              width: 320,
              borderRight: `1px solid ${theme.palette.divider}`,
              bgcolor: darkMode ? alpha('#000', 0.2) : alpha('#000', 0.02),
              display: { xs: 'none', md: 'block' }
            }}
          >
            {sidebarContent}
          </Paper>
        )}

        {/* Main content area */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
          {lessonLoading ? (
            <Box>
              <Skeleton variant="text" width={300} height={40} />
              <Skeleton variant="rectangular" height={300} sx={{ mt: 2, borderRadius: 2 }} />
            </Box>
          ) : currentLesson ? (
            <Box>
              {/* Lesson header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {currentLesson.title}
                </Typography>
                {currentLesson.description && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {currentLesson.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {currentLesson.estimated_duration_minutes && (
                    <Chip
                      icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                      label={`${currentLesson.estimated_duration_minutes} min`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  <Chip
                    icon={React.createElement(CONTENT_TYPE_ICONS[currentLesson.content_type] || TextIcon, { sx: { fontSize: 16 } })}
                    label={t(`courses.contentType.${currentLesson.content_type || 'text'}`)}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Lesson content */}
              {renderLessonContent()}

              {/* Mark complete button */}
              {!lessonProgress[currentLesson.id]?.completed_at && (
                <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<CheckCircleIcon />}
                    onClick={markLessonComplete}
                    sx={{ borderRadius: 2, py: 1.5, px: 4 }}
                  >
                    {t('courses.viewer.markComplete')}
                  </Button>
                </Box>
              )}

              {/* Already complete indicator */}
              {lessonProgress[currentLesson.id]?.completed_at && (
                <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    {t('courses.viewer.lessonComplete')}
                  </Alert>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                {t('courses.viewer.selectLesson')}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CourseViewer;
