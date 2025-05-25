import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  AttachFile as FileIcon,
} from '@mui/icons-material';
import { 
  MEDIA_TYPES, 
  validateFile, 
  uploadMediaFile, 
  formatFileSize, 
  getMediaType,
  createVideoThumbnail,
  getMediaDuration,
  formatDuration
} from '../utils/mediaUpload';

function MediaUpload({ 
  onUpload, 
  allowedTypes = ['IMAGE', 'VIDEO', 'AUDIO'],
  bucket = 'media-uploads',
  path = 'general',
  maxFiles = 1,
  showPreview = true,
  compact = false
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previews, setPreviews] = useState([]);

  // Get accept string for file input
  const getAcceptString = () => {
    const types = [];
    if (allowedTypes.includes('IMAGE')) types.push(MEDIA_TYPES.IMAGE.accept);
    if (allowedTypes.includes('VIDEO')) types.push(MEDIA_TYPES.VIDEO.accept);
    if (allowedTypes.includes('AUDIO')) types.push(MEDIA_TYPES.AUDIO.accept);
    return types.join(',');
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    setError(null);

    // Validate files
    const validFiles = [];
    for (const file of selectedFiles) {
      const validation = validateFile(file, allowedTypes);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      validFiles.push({ file, mediaType: validation.mediaType });
    }

    // Check max files
    if (files.length + validFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} file(s) allowed`);
      return;
    }

    // Generate previews
    const newPreviews = [];
    for (const { file, mediaType } of validFiles) {
      let preview = {
        url: URL.createObjectURL(file),
        mediaType,
        name: file.name,
        size: file.size
      };

      // Get duration for audio/video
      if (mediaType === 'AUDIO' || mediaType === 'VIDEO') {
        try {
          const duration = await getMediaDuration(file);
          preview.duration = duration;
        } catch (err) {
          console.error('Error getting duration:', err);
        }
      }

      // Create thumbnail for video
      if (mediaType === 'VIDEO') {
        try {
          const thumbnailBlob = await createVideoThumbnail(file);
          preview.thumbnail = URL.createObjectURL(thumbnailBlob);
        } catch (err) {
          console.error('Error creating thumbnail:', err);
        }
      }

      newPreviews.push(preview);
    }

    setFiles([...files, ...validFiles.map(v => v.file)]);
    setPreviews([...previews, ...newPreviews]);
  };

  // Remove file
  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Clean up object URLs
    if (previews[index].url) URL.revokeObjectURL(previews[index].url);
    if (previews[index].thumbnail) URL.revokeObjectURL(previews[index].thumbnail);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedFiles = [];
      
      for (const file of files) {
        const result = await uploadMediaFile(file, bucket, path);
        // Convert media type to lowercase for database compatibility
        uploadedFiles.push({
          ...result,
          type: result.mediaType.toLowerCase() // Convert to lowercase for database
        });
      }

      // Clean up previews
      previews.forEach(preview => {
        if (preview.url) URL.revokeObjectURL(preview.url);
        if (preview.thumbnail) URL.revokeObjectURL(preview.thumbnail);
      });

      setFiles([]);
      setPreviews([]);
      
      if (onUpload) {
        onUpload(maxFiles === 1 ? uploadedFiles[0] : uploadedFiles);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Get icon for media type
  const getMediaIcon = (mediaType) => {
    switch (mediaType) {
      case 'IMAGE': return <ImageIcon />;
      case 'VIDEO': return <VideoIcon />;
      case 'AUDIO': return <AudioIcon />;
      default: return <FileIcon />;
    }
  };

  // Render preview
  const renderPreview = (preview, index) => {
    const { mediaType, url, thumbnail, name, size, duration } = preview;

    return (
      <Card key={index} sx={{ position: 'relative', width: compact ? 150 : 200 }}>
        {mediaType === 'IMAGE' && (
          <CardMedia
            component="img"
            height={compact ? 100 : 140}
            image={url}
            alt={name}
          />
        )}
        
        {mediaType === 'VIDEO' && (
          <CardMedia
            component="img"
            height={compact ? 100 : 140}
            image={thumbnail || url}
            alt={name}
          />
        )}
        
        {mediaType === 'AUDIO' && (
          <Box
            sx={{
              height: compact ? 100 : 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover'
            }}
          >
            <AudioIcon sx={{ fontSize: compact ? 40 : 60, color: 'action.active' }} />
          </Box>
        )}

        <Box sx={{ p: 1 }}>
          <Typography variant="caption" noWrap>{name}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
            <Chip
              icon={getMediaIcon(mediaType)}
              label={mediaType}
              size="small"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip
              label={formatFileSize(size)}
              size="small"
              sx={{ fontSize: '0.7rem' }}
            />
            {duration && (
              <Chip
                label={formatDuration(duration)}
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </Box>

        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.7)'
            }
          }}
          onClick={() => handleRemoveFile(index)}
        >
          <CancelIcon fontSize="small" />
        </IconButton>
      </Card>
    );
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {files.length < maxFiles && (
        <Box sx={{ mb: 2 }}>
          <input
            accept={getAcceptString()}
            id="media-upload-input"
            type="file"
            multiple={maxFiles > 1}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <label htmlFor="media-upload-input">
            <Button
              variant={compact ? "outlined" : "contained"}
              component="span"
              startIcon={<UploadIcon />}
              disabled={uploading}
              size={compact ? "small" : "medium"}
            >
              {compact ? "Add Media" : `Add ${allowedTypes.join('/')}`}
            </Button>
          </label>
        </Box>
      )}

      {showPreview && previews.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {previews.map((preview, index) => renderPreview(preview, index))}
          </Box>
        </Box>
      )}

      {files.length > 0 && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
        </Button>
      )}
    </Box>
  );
}

export default MediaUpload;