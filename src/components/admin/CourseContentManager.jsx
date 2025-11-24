import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation.jsx';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Alert,
  Skeleton,
  useTheme,
  Menu,
  MenuItem,
  Tooltip,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayCircle as VideoIcon,
  Description as DocumentIcon,
  Link as LinkIcon,
  TextFields as TextIcon,
  Visibility as PreviewIcon,
  MoreVert as MoreIcon,
  ContentCopy as DuplicateIcon,
  KeyboardArrowUp as MoveUpIcon,
  KeyboardArrowDown as MoveDownIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
  AttachFile as AttachmentIcon,
  Layers as MixedIcon,
  Image as ImageIcon,
  CloudUpload as UploadIcon,
  AccessTime as DurationIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseclient';
import {
  getCourseWithLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  duplicateLesson,
  publishCourse,
  updateCourse
} from '../../api/courses';
import LessonEditorDialog from './LessonEditorDialog';
import ConfirmDialog from '../ConfirmDialog';

const CONTENT_TYPE_CONFIG = {
  text: { icon: TextIcon, label: 'Text', color: 'default' },
  video: { icon: VideoIcon, label: 'Video', color: 'error' },
  pdf: { icon: DocumentIcon, label: 'PDF', color: 'warning' },
  link: { icon: LinkIcon, label: 'External Link', color: 'info' },
  mixed: { icon: MixedIcon, label: 'Mixed Content', color: 'secondary' }
};

function CourseContentManager({ courseId, onBack }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const thumbnailInputRef = useRef(null);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCourseWithLessons(supabase, courseId);
      if (result.error) {
        throw new Error(result.error);
      }
      setCourse(result.data);
      setLessons(result.data.lessons || []);
    } catch (err) {
      console.error('Error loading course:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleAddLesson = () => {
    setEditingLesson(null);
    setEditorOpen(true);
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setEditorOpen(true);
    setMenuAnchor(null);
  };

  const handleSaveLesson = async (lessonData) => {
    try {
      if (editingLesson) {
        // Update existing lesson
        const result = await updateLesson(supabase, editingLesson.id, lessonData);
        if (result.error) throw new Error(result.error);
      } else {
        // Create new lesson
        const newLessonData = {
          ...lessonData,
          course_id: courseId,
          sort_order: lessons.length
        };
        const result = await createLesson(supabase, newLessonData);
        if (result.error) throw new Error(result.error);
      }

      await loadCourse();
      setEditorOpen(false);
      setEditingLesson(null);
    } catch (err) {
      console.error('Error saving lesson:', err);
      setError(err.message);
    }
  };

  const handleDeleteLesson = async () => {
    if (!selectedLesson) return;

    try {
      const result = await deleteLesson(supabase, selectedLesson.id);
      if (result.error) throw new Error(result.error);

      await loadCourse();
      setConfirmDelete(false);
      setSelectedLesson(null);
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError(err.message);
    }
  };

  const handleDuplicateLesson = async () => {
    if (!selectedLesson) return;

    try {
      const result = await duplicateLesson(supabase, selectedLesson.id);
      if (result.error) throw new Error(result.error);

      await loadCourse();
      setMenuAnchor(null);
      setSelectedLesson(null);
    } catch (err) {
      console.error('Error duplicating lesson:', err);
      setError(err.message);
    }
  };

  const handleMoveLesson = async (lesson, direction) => {
    const currentIndex = lessons.findIndex(l => l.id === lesson.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= lessons.length) return;

    const newLessons = [...lessons];
    [newLessons[currentIndex], newLessons[newIndex]] = [newLessons[newIndex], newLessons[currentIndex]];

    // Optimistic update
    setLessons(newLessons);

    try {
      const lessonIds = newLessons.map(l => l.id);
      const result = await reorderLessons(supabase, courseId, lessonIds);
      if (result.error) throw new Error(result.error);
    } catch (err) {
      console.error('Error reordering lessons:', err);
      setError(err.message);
      // Revert on error
      await loadCourse();
    }

    setMenuAnchor(null);
  };

  const handlePublishCourse = async () => {
    setPublishing(true);
    try {
      const result = await publishCourse(supabase, courseId);
      if (result.error) throw new Error(result.error);
      await loadCourse();
    } catch (err) {
      console.error('Error publishing course:', err);
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublishCourse = async () => {
    setPublishing(true);
    try {
      const result = await updateCourse(supabase, courseId, { status: 'draft' });
      if (result.error) throw new Error(result.error);
      await loadCourse();
    } catch (err) {
      console.error('Error unpublishing course:', err);
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleThumbnailUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(t('admin.courses.errors.invalidImageType'));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('admin.courses.errors.imageTooLarge'));
      return;
    }

    setUploadingThumbnail(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}/thumbnail.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(fileName);

      // Update course with new thumbnail URL (add cache buster)
      const thumbnailUrl = `${publicUrl}?t=${Date.now()}`;
      const result = await updateCourse(supabase, courseId, { thumbnail_url: thumbnailUrl });
      if (result.error) throw new Error(result.error);

      // Reload course to show new thumbnail
      await loadCourse();
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
      setError(err.message);
    } finally {
      setUploadingThumbnail(false);
      // Reset input
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
    }
  };

  const openMenu = (event, lesson) => {
    setMenuAnchor(event.currentTarget);
    setSelectedLesson(lesson);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setSelectedLesson(null);
  };

  const getContentTypeIcon = (contentType) => {
    const config = CONTENT_TYPE_CONFIG[contentType] || CONTENT_TYPE_CONFIG.text;
    const Icon = config.icon;
    return <Icon sx={{ color: theme.palette[config.color]?.main || theme.palette.text.secondary }} />;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const totalDuration = lessons.reduce((acc, lesson) => acc + (lesson.estimated_duration_minutes || 0), 0);
  const totalAttachments = lessons.reduce((acc, lesson) => acc + (lesson.attachments?.length || 0), 0);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (error && !course) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
          {t('common.back')}
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
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
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h2" sx={{ color: theme.palette.custom.lightText }}>
              {course?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('admin.courses.content.manageContent')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={course?.status}
              color={course?.status === 'published' ? 'success' : 'warning'}
              size="small"
            />
            {course?.status === 'draft' ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PublishIcon />}
                onClick={handlePublishCourse}
                disabled={publishing || lessons.length === 0}
              >
                {t('admin.courses.buttons.publish')}
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<ArchiveIcon />}
                onClick={handleUnpublishCourse}
                disabled={publishing}
              >
                {t('admin.courses.buttons.unpublish')}
              </Button>
            )}
          </Box>
        </Box>

        {/* Course Stats */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h6">{lessons.length}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('admin.courses.content.lessons')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h6">{formatDuration(totalDuration) || '0 min'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('admin.courses.content.totalDuration')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h6">{totalAttachments}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('admin.courses.content.attachments')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h6">{course?.enrollment_count || 0}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('admin.courses.stats.enrolled')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Thumbnail Editor */}
        <Divider sx={{ my: 3 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.custom.lightText }}>
            {t('admin.courses.content.thumbnail')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            {/* Thumbnail Preview */}
            <Box
              sx={{
                width: 200,
                height: 120,
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {course?.thumbnail_url ? (
                <Box
                  component="img"
                  src={course.thumbnail_url}
                  alt={course.title}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <ImageIcon sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
              )}
            </Box>

            {/* Upload Controls */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('admin.courses.content.thumbnailDescription')}
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={uploadingThumbnail ? <CircularProgress size={16} /> : <UploadIcon />}
                disabled={uploadingThumbnail}
                size="small"
              >
                {uploadingThumbnail
                  ? t('common.uploading')
                  : course?.thumbnail_url
                    ? t('admin.courses.content.changeThumbnail')
                    : t('admin.courses.content.uploadThumbnail')
                }
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleThumbnailUpload}
                />
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                {t('admin.courses.content.thumbnailHint')}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Lessons List */}
      <Paper
        sx={{
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${theme.palette.custom.border}`
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: theme.palette.custom.lightText }}>
            {t('admin.courses.content.lessonsList')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddLesson}
          >
            {t('admin.courses.content.addLesson')}
          </Button>
        </Box>

        <Divider />

        {lessons.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <VideoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('admin.courses.content.noLessons')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('admin.courses.content.noLessonsDescription')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddLesson}
            >
              {t('admin.courses.content.addFirstLesson')}
            </Button>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {lessons.map((lesson, index) => (
              <ListItem
                key={lesson.id}
                sx={{
                  borderBottom: index < lessons.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {index + 1}
                  </Typography>
                </ListItemIcon>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getContentTypeIcon(lesson.content_type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: theme.palette.custom.lightText }}>
                        {lesson.title}
                      </Typography>
                      {lesson.is_preview && (
                        <Tooltip title={t('admin.courses.content.freePreview')}>
                          <PreviewIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                        </Tooltip>
                      )}
                      {lesson.module_name && (
                        <Chip label={lesson.module_name} size="small" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      {lesson.estimated_duration_minutes && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DurationIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">
                            {formatDuration(lesson.estimated_duration_minutes)}
                          </Typography>
                        </Box>
                      )}
                      {lesson.attachments?.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AttachmentIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">
                            {lesson.attachments.length} {t('admin.courses.content.files')}
                          </Typography>
                        </Box>
                      )}
                      {lesson.description && (
                        <Typography variant="caption" color="text.secondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 300
                        }}>
                          {lesson.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                  <Tooltip title={t('admin.courses.content.moveUp')}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveLesson(lesson, 'up')}
                        disabled={index === 0}
                      >
                        <MoveUpIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={t('admin.courses.content.moveDown')}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveLesson(lesson, 'down')}
                        disabled={index === lessons.length - 1}
                      >
                        <MoveDownIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <IconButton
                    size="small"
                    onClick={() => handleEditLesson(lesson)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => openMenu(e, lesson)}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        <MenuItem onClick={() => handleEditLesson(selectedLesson)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicateLesson}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('admin.courses.content.duplicate')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setConfirmDelete(true);
            closeMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>{t('common.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Lesson Editor Dialog */}
      <LessonEditorDialog
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingLesson(null);
        }}
        onSave={handleSaveLesson}
        lesson={editingLesson}
        courseId={courseId}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteLesson}
        title={t('admin.courses.content.deleteLesson')}
        message={t('admin.courses.content.deleteLessonConfirm', { title: selectedLesson?.title })}
        confirmText={t('common.delete')}
        confirmColor="error"
      />
    </Box>
  );
}

export default CourseContentManager;
