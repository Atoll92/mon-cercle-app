import React, { useState } from 'react';
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
  Chip,
  InputAdornment,
  Divider,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayCircle as PlayCircleIcon,
  CloudUpload as CloudUploadIcon,
  School as SchoolIcon
} from '@mui/icons-material';

const CourseCreationDialog = ({ open, onClose, onSubmit, categories = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    price: 0,
    currency: 'USD',
    isFree: false,
    difficultyLevel: 'beginner',
    estimatedDurationHours: '',
    language: 'en',
    maxStudents: '',
    learningObjectives: [''],
    prerequisites: [''],
    targetAudience: '',
    tags: []
  });

  const [newTag, setNewTag] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [errors, setErrors] = useState({});

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

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleThumbnailUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    }

    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.isFree && (!formData.price || formData.price <= 0)) {
      newErrors.price = 'Price must be greater than 0 for paid courses';
    }

    if (!formData.estimatedDurationHours || formData.estimatedDurationHours <= 0) {
      newErrors.estimatedDurationHours = 'Estimated duration is required';
    }

    const validObjectives = formData.learningObjectives.filter(obj => obj.trim());
    if (validObjectives.length === 0) {
      newErrors.learningObjectives = 'At least one learning objective is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Clean up arrays - remove empty items
    const cleanedData = {
      ...formData,
      learningObjectives: formData.learningObjectives.filter(obj => obj.trim()),
      prerequisites: formData.prerequisites.filter(req => req.trim()),
      price: formData.isFree ? 0 : parseFloat(formData.price),
      maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
      estimatedDurationHours: parseInt(formData.estimatedDurationHours)
    };

    onSubmit(cleanedData, thumbnailFile);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      slug: '',
      shortDescription: '',
      description: '',
      categoryId: '',
      price: 0,
      currency: 'USD',
      isFree: false,
      difficultyLevel: 'beginner',
      estimatedDurationHours: '',
      language: 'en',
      maxStudents: '',
      learningObjectives: [''],
      prerequisites: [''],
      targetAudience: '',
      tags: []
    });
    setNewTag('');
    setThumbnailFile(null);
    setErrors({});
    onClose();
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Create New Course</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Course Title *"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              placeholder="e.g., Complete React Development Course"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="URL Slug"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              helperText="Auto-generated from title. Used in the course URL."
              InputProps={{
                startAdornment: <InputAdornment position="start">/courses/</InputAdornment>
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Short Description *"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              error={!!errors.shortDescription}
              helperText={errors.shortDescription || "Brief description for course cards (max 500 characters)"}
              multiline
              rows={2}
              inputProps={{ maxLength: 500 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Course Description *"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              error={!!errors.description}
              helperText={errors.description || "Detailed course description"}
              multiline
              rows={4}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.categoryId}>
              <InputLabel>Category *</InputLabel>
              <Select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                label="Category *"
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.categoryId && (
                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                  {errors.categoryId}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={formData.difficultyLevel}
                onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                label="Difficulty Level"
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Pricing */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Pricing
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isFree}
                  onChange={(e) => handleInputChange('isFree', e.target.checked)}
                />
              }
              label="This is a free course"
            />
          </Grid>

          {!formData.isFree && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price *"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  error={!!errors.price}
                  helperText={errors.price}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    label="Currency"
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="CAD">CAD ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Course Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Course Details
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated Duration (Hours) *"
              type="number"
              value={formData.estimatedDurationHours}
              onChange={(e) => handleInputChange('estimatedDurationHours', e.target.value)}
              error={!!errors.estimatedDurationHours}
              helperText={errors.estimatedDurationHours || "Total course duration in hours"}
              inputProps={{ min: 1, step: 0.5 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Maximum Students"
              type="number"
              value={formData.maxStudents}
              onChange={(e) => handleInputChange('maxStudents', e.target.value)}
              helperText="Leave empty for unlimited enrollment"
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Target Audience"
              value={formData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              multiline
              rows={2}
              placeholder="Who is this course designed for?"
            />
          </Grid>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Learning Objectives */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Learning Objectives *
            </Typography>
            <Typography variant="caption" color="text.secondary">
              What will students learn in this course?
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <List>
              {formData.learningObjectives.map((objective, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <PlayCircleIcon color="primary" />
                  </ListItemIcon>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={objective}
                    onChange={(e) => handleArrayChange('learningObjectives', index, e.target.value)}
                    placeholder="Enter a learning objective..."
                  />
                  <ListItemSecondaryAction>
                    {formData.learningObjectives.length > 1 && (
                      <IconButton
                        edge="end"
                        onClick={() => removeArrayItem('learningObjectives', index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <Button
              startIcon={<AddIcon />}
              onClick={() => addArrayItem('learningObjectives')}
              size="small"
            >
              Add Learning Objective
            </Button>
            {errors.learningObjectives && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                {errors.learningObjectives}
              </Typography>
            )}
          </Grid>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Prerequisites */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Prerequisites
            </Typography>
            <Typography variant="caption" color="text.secondary">
              What should students know before taking this course?
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <List>
              {formData.prerequisites.map((prerequisite, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <PlayCircleIcon color="secondary" />
                  </ListItemIcon>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={prerequisite}
                    onChange={(e) => handleArrayChange('prerequisites', index, e.target.value)}
                    placeholder="Enter a prerequisite..."
                  />
                  <ListItemSecondaryAction>
                    {formData.prerequisites.length > 1 && (
                      <IconButton
                        edge="end"
                        onClick={() => removeArrayItem('prerequisites', index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <Button
              startIcon={<AddIcon />}
              onClick={() => addArrayItem('prerequisites')}
              size="small"
            >
              Add Prerequisite
            </Button>
          </Grid>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Tags */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Tags
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button onClick={handleAddTag} size="small">
                        Add
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Grid>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Media Upload */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Course Thumbnail
            </Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              Upload Thumbnail
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleThumbnailUpload}
              />
            </Button>
            {thumbnailFile && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Selected: {thumbnailFile.name}
              </Alert>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          size="large"
        >
          Create Course
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseCreationDialog;