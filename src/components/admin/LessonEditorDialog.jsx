import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation.jsx';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  LinearProgress,
  InputAdornment,
  Tabs,
  Tab,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  PlayCircle as VideoIcon,
  Description as DocumentIcon,
  Link as LinkIcon,
  TextFields as TextIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  AttachFile as AttachmentIcon,
  Add as AddIcon,
  YouTube as YouTubeIcon,
  Layers as MixedIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseclient';
import { uploadCourseContent, deleteCourseContent } from '../../api/courses';
import { validateFile, formatFileSize, getMediaDuration } from '../../utils/mediaUpload';

const CONTENT_TYPES = [
  { value: 'text', label: 'Text Content', icon: TextIcon, description: 'Rich text lesson with formatting' },
  { value: 'video', label: 'Video Lesson', icon: VideoIcon, description: 'Upload or embed video content' },
  { value: 'pdf', label: 'PDF Document', icon: DocumentIcon, description: 'Upload PDF documents' },
  { value: 'link', label: 'External Link', icon: LinkIcon, description: 'Link to external resources' },
  { value: 'mixed', label: 'Mixed Content', icon: MixedIcon, description: 'Combine multiple content types' }
];

const ATTACHMENT_TYPES = {
  'application/pdf': { icon: DocumentIcon, color: 'warning' },
  'video/mp4': { icon: VideoIcon, color: 'error' },
  'video/webm': { icon: VideoIcon, color: 'error' },
  'video/quicktime': { icon: VideoIcon, color: 'error' },
  'audio/mpeg': { icon: AudioIcon, color: 'secondary' },
  'audio/wav': { icon: AudioIcon, color: 'secondary' },
  'image/jpeg': { icon: ImageIcon, color: 'success' },
  'image/png': { icon: ImageIcon, color: 'success' },
  'image/gif': { icon: ImageIcon, color: 'success' },
  'image/webp': { icon: ImageIcon, color: 'success' }
};

function LessonEditorDialog({ open, onClose, onSave, lesson, courseId }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content_type: 'text',
    content: { html: '' },
    module_name: '',
    is_preview: false,
    is_required: true,
    video_url: '',
    external_url: '',
    estimated_duration_minutes: '',
    attachments: []
  });

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        slug: lesson.slug || '',
        description: lesson.description || '',
        content_type: lesson.content_type || 'text',
        content: lesson.content || { html: '' },
        module_name: lesson.module_name || '',
        is_preview: lesson.is_preview || false,
        is_required: lesson.is_required !== false,
        video_url: lesson.video_url || '',
        external_url: lesson.external_url || '',
        estimated_duration_minutes: lesson.estimated_duration_minutes || '',
        attachments: lesson.attachments || []
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        content_type: 'text',
        content: { html: '' },
        module_name: '',
        is_preview: false,
        is_required: true,
        video_url: '',
        external_url: '',
        estimated_duration_minutes: '',
        attachments: []
      });
    }
    setErrors({});
    setActiveTab(0);
  }, [lesson, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from title
    if (field === 'title') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file
        const validation = validateFile(file, ['IMAGE', 'VIDEO', 'AUDIO', 'PDF']);
        if (!validation.valid) {
          setErrors(prev => ({ ...prev, upload: validation.error }));
          continue;
        }

        // Upload file
        const result = await uploadCourseContent(supabase, courseId, lesson?.id || 'new', file);
        if (result.error) {
          setErrors(prev => ({ ...prev, upload: result.error }));
          continue;
        }

        // Get duration for video/audio
        let duration = null;
        if (validation.mediaType === 'VIDEO' || validation.mediaType === 'AUDIO') {
          try {
            duration = await getMediaDuration(file);
          } catch {
            // Duration extraction failed, continue without it
          }
        }

        // Add to attachments
        const newAttachment = {
          id: crypto.randomUUID(),
          type: validation.mediaType.toLowerCase(),
          url: result.data.url,
          path: result.data.path,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          duration,
          uploadedAt: new Date().toISOString()
        };

        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment]
        }));

        // If it's a video and content_type is video, set video_url
        if (validation.mediaType === 'VIDEO' && formData.content_type === 'video') {
          setFormData(prev => ({
            ...prev,
            video_url: result.data.url,
            video_duration_seconds: duration ? Math.round(duration) : null
          }));
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrors(prev => ({ ...prev, upload: error.message }));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = async (attachment) => {
    try {
      // Delete from storage
      if (attachment.path) {
        await deleteCourseContent(supabase, attachment.path);
      }

      // Remove from list
      setFormData(prev => ({
        ...prev,
        attachments: prev.attachments.filter(a => a.id !== attachment.id)
      }));

      // Clear video_url if it was this attachment
      if (attachment.url === formData.video_url) {
        setFormData(prev => ({
          ...prev,
          video_url: '',
          video_duration_seconds: null
        }));
      }
    } catch (error) {
      console.error('Error removing attachment:', error);
      setErrors(prev => ({ ...prev, upload: error.message }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('admin.courses.content.errors.titleRequired');
    }

    if (formData.content_type === 'video' && !formData.video_url && !formData.external_url) {
      newErrors.video = t('admin.courses.content.errors.videoRequired');
    }

    if (formData.content_type === 'link' && !formData.external_url) {
      newErrors.external_url = t('admin.courses.content.errors.linkRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const lessonData = {
      title: formData.title.trim(),
      slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: formData.description.trim(),
      content_type: formData.content_type,
      content: formData.content,
      module_name: formData.module_name.trim() || null,
      is_preview: formData.is_preview,
      is_required: formData.is_required,
      video_url: formData.video_url || null,
      external_url: formData.external_url || null,
      estimated_duration_minutes: formData.estimated_duration_minutes ? parseInt(formData.estimated_duration_minutes) : null,
      attachments: formData.attachments
    };

    onSave(lessonData);
  };

  const handleClose = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      content_type: 'text',
      content: { html: '' },
      module_name: '',
      is_preview: false,
      is_required: true,
      video_url: '',
      external_url: '',
      estimated_duration_minutes: '',
      attachments: []
    });
    setErrors({});
    onClose();
  };

  const getAttachmentIcon = (mimeType) => {
    const config = ATTACHMENT_TYPES[mimeType] || { icon: AttachmentIcon, color: 'default' };
    const Icon = config.icon;
    return <Icon color={config.color} />;
  };

  const isYouTubeUrl = (url) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {lesson ? t('admin.courses.content.editLesson') : t('admin.courses.content.addLesson')}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label={t('admin.courses.content.tabs.basic')} />
          <Tab label={t('admin.courses.content.tabs.content')} />
          <Tab label={t('admin.courses.content.tabs.attachments')} />
          <Tab label={t('admin.courses.content.tabs.settings')} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Basic Info Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.courses.content.lessonTitle')}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.courses.content.lessonSlug')}
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  helperText={t('admin.courses.content.slugHelper')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">/lesson/</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.courses.content.description')}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                  helperText={t('admin.courses.content.descriptionHelper')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('admin.courses.content.moduleName')}
                  value={formData.module_name}
                  onChange={(e) => handleInputChange('module_name', e.target.value)}
                  helperText={t('admin.courses.content.moduleHelper')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('admin.courses.content.duration')}
                  type="number"
                  value={formData.estimated_duration_minutes}
                  onChange={(e) => handleInputChange('estimated_duration_minutes', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{t('common.minutes')}</InputAdornment>
                  }}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          )}

          {/* Content Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('admin.courses.content.contentType')}
                </Typography>
                <Grid container spacing={2}>
                  {CONTENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Grid item xs={6} sm={4} key={type.value}>
                        <Card
                          variant="outlined"
                          sx={{
                            cursor: 'pointer',
                            borderColor: formData.content_type === type.value
                              ? theme.palette.primary.main
                              : theme.palette.divider,
                            bgcolor: formData.content_type === type.value
                              ? theme.palette.primary.main + '10'
                              : 'transparent',
                            '&:hover': {
                              borderColor: theme.palette.primary.main
                            }
                          }}
                          onClick={() => handleInputChange('content_type', type.value)}
                        >
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Icon sx={{ fontSize: 32, color: theme.palette.primary.main, mb: 1 }} />
                            <Typography variant="subtitle2">{type.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {type.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>

              {/* Video Content Options */}
              {(formData.content_type === 'video' || formData.content_type === 'mixed') && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      {t('admin.courses.content.videoOptions')}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('admin.courses.content.externalVideoUrl')}
                      value={formData.external_url}
                      onChange={(e) => handleInputChange('external_url', e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      error={!!errors.video}
                      helperText={errors.video || t('admin.courses.content.externalVideoHelper')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {isYouTubeUrl(formData.external_url) ? (
                              <YouTubeIcon color="error" />
                            ) : (
                              <LinkIcon />
                            )}
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 1 }}>
                      {t('common.or')}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {t('admin.courses.content.uploadVideoInfo')}
                    </Alert>
                  </Grid>
                </>
              )}

              {/* Link Content Options */}
              {formData.content_type === 'link' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.courses.content.externalLink')}
                    value={formData.external_url}
                    onChange={(e) => handleInputChange('external_url', e.target.value)}
                    placeholder="https://..."
                    error={!!errors.external_url}
                    helperText={errors.external_url}
                    required
                  />
                </Grid>
              )}

              {/* Text Content */}
              {(formData.content_type === 'text' || formData.content_type === 'mixed') && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.courses.content.textContent')}
                    value={formData.content?.html || ''}
                    onChange={(e) => handleInputChange('content', { html: e.target.value })}
                    multiline
                    rows={8}
                    helperText={t('admin.courses.content.textContentHelper')}
                  />
                </Grid>
              )}
            </Grid>
          )}

          {/* Attachments Tab */}
          {activeTab === 2 && (
            <Box>
              {errors.upload && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrors(prev => ({ ...prev, upload: null }))}>
                  {errors.upload}
                </Alert>
              )}

              <Box
                sx={{
                  border: `2px dashed ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  mb: 3,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: theme.palette.action.hover
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  multiple
                  accept="image/*,video/*,audio/*,application/pdf"
                  onChange={handleFileUpload}
                />
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {t('admin.courses.content.dropFiles')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.courses.content.supportedFormats')}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  {t('admin.courses.content.selectFiles')}
                </Button>
              </Box>

              {uploading && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('admin.courses.content.uploading')}
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}

              {formData.attachments.length > 0 ? (
                <List>
                  {formData.attachments.map((attachment) => (
                    <ListItem
                      key={attachment.id}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemIcon>
                        {getAttachmentIcon(attachment.mimeType)}
                      </ListItemIcon>
                      <ListItemText
                        primary={attachment.fileName}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption">
                              {formatFileSize(attachment.fileSize)}
                            </Typography>
                            {attachment.duration && (
                              <Typography variant="caption">
                                {Math.round(attachment.duration / 60)} min
                              </Typography>
                            )}
                            <Chip
                              label={attachment.type}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveAttachment(attachment)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  {t('admin.courses.content.noAttachments')}
                </Typography>
              )}
            </Box>
          )}

          {/* Settings Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_preview}
                      onChange={(e) => handleInputChange('is_preview', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{t('admin.courses.content.freePreview')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('admin.courses.content.freePreviewHelper')}
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_required}
                      onChange={(e) => handleInputChange('is_required', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{t('admin.courses.content.required')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('admin.courses.content.requiredHelper')}
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={uploading}
        >
          {lesson ? t('common.save') : t('admin.courses.content.createLesson')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LessonEditorDialog;
