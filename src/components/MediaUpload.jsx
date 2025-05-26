import { useState, useEffect } from 'react';
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
  PictureAsPdf as PdfIcon,
  AttachFile as FileIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { 
  MEDIA_TYPES, 
  validateFile, 
  uploadMediaFile, 
  uploadAlbumArt,
  formatFileSize, 
  createVideoThumbnail,
  getMediaDuration,
  extractAudioMetadata,
  formatDuration,
  generatePDFThumbnail,
  getPDFMetadata
} from '../utils/mediaUpload';
import { getNetworkStorageInfo } from '../api/networks';
import { useNetwork } from '../context/networkContext';
import { useAuth } from '../context/authcontext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';

function MediaUpload({ 
  onUpload, 
  allowedTypes = ['IMAGE', 'VIDEO', 'AUDIO'],
  bucket = 'media-uploads',
  path = 'general',
  maxFiles = 1,
  showPreview = true,
  compact = false,
  autoUpload = false
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Try to use network context, but don't fail if not available
  let currentNetwork = null;
  try {
    const networkContext = useNetwork();
    currentNetwork = networkContext?.currentNetwork;
  } catch (error) {
    // Network context not available, that's okay
    console.log('MediaUpload: Network context not available');
  }
  
  // Check storage limits when network changes or user changes
  useEffect(() => {
    const checkStorage = async () => {
      let networkId = currentNetwork?.id;
      
      // If no network context, try to get network ID from user profile
      if (!networkId && user?.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('network_id')
            .eq('id', user.id)
            .single();
          
          if (profile?.network_id) {
            networkId = profile.network_id;
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
      
      if (!networkId) return;
      
      try {
        const info = await getNetworkStorageInfo(networkId);
        setStorageInfo(info);
      } catch (err) {
        console.error('Error checking storage:', err);
      }
    };
    
    checkStorage();
  }, [currentNetwork?.id, user?.id]);

  // Get accept string for file input
  const getAcceptString = () => {
    const types = [];
    if (allowedTypes.includes('IMAGE')) types.push(MEDIA_TYPES.IMAGE.accept);
    if (allowedTypes.includes('VIDEO')) types.push(MEDIA_TYPES.VIDEO.accept);
    if (allowedTypes.includes('AUDIO')) types.push(MEDIA_TYPES.AUDIO.accept);
    if (allowedTypes.includes('PDF')) types.push(MEDIA_TYPES.PDF.accept);
    return types.join(',');
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    console.log('MediaUpload: Files selected:', selectedFiles);
    console.log('MediaUpload: Allowed types:', allowedTypes);
    setError(null);
    
    // Check if storage limit is reached
    if (storageInfo?.isAtLimit) {
      setError('Storage limit reached. Please upgrade your plan to upload more files.');
      return;
    }

    // Validate files
    const validFiles = [];
    let totalSize = 0;
    for (const file of selectedFiles) {
      const validation = validateFile(file, allowedTypes);
      console.log('MediaUpload: File validation for', file.name, ':', validation);
      if (!validation.valid) {
        console.error('MediaUpload: Validation failed:', validation.error);
        setError(validation.error);
        return;
      }
      validFiles.push({ file, mediaType: validation.mediaType });
      totalSize += file.size;
    }
    
    // Check if files would exceed storage limit
    if (storageInfo && !storageInfo.isUnlimited) {
      const totalSizeInMB = totalSize / (1024 * 1024);
      const remainingMB = storageInfo.limitMB - storageInfo.usageMB;
      
      if (totalSizeInMB > remainingMB) {
        setError(`Not enough storage space. You have ${remainingMB.toFixed(1)}MB remaining.`);
        return;
      }
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

      // Extract metadata for audio files
      if (mediaType === 'AUDIO') {
        try {
          const audioMetadata = await extractAudioMetadata(file);
          preview = { ...preview, ...audioMetadata };
        } catch (err) {
          console.error('Error extracting audio metadata:', err);
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

      // Generate thumbnail and extract metadata for PDF
      if (mediaType === 'PDF') {
        try {
          const pdfMetadata = await getPDFMetadata(file);
          preview = { ...preview, ...pdfMetadata };
          
          const thumbnailBlob = await generatePDFThumbnail(file);
          if (thumbnailBlob) {
            preview.thumbnail = URL.createObjectURL(thumbnailBlob);
          }
        } catch (err) {
          console.error('Error processing PDF:', err);
        }
      }

      newPreviews.push(preview);
    }

    setFiles([...files, ...validFiles.map(v => v.file)]);
    setPreviews([...previews, ...newPreviews]);
    
    // Auto upload if enabled
    if (autoUpload && validFiles.length > 0) {
      // Set a timeout to allow state to update
      setTimeout(() => {
        handleUpload([...files, ...validFiles.map(v => v.file)], [...previews, ...newPreviews]);
      }, 100);
    }
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
  const handleUpload = async (filesToUpload = files, previewsToUpload = previews) => {
    console.log('MediaUpload: handleUpload called with', filesToUpload.length, 'files');
    if (filesToUpload.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const preview = previewsToUpload[i];
        const result = await uploadMediaFile(file, bucket, path, { allowedTypes });
        
        // Upload album art if it exists for audio files
        let permanentAlbumArtUrl = null;
        if (result.mediaType === 'AUDIO' && preview.albumArt) {
          permanentAlbumArtUrl = await uploadAlbumArt(preview.albumArt, bucket, path);
        }
        
        // Combine upload result with preview metadata
        const uploadedFile = {
          ...result,
          type: result.mediaType.toLowerCase(), // Convert to lowercase for database
          metadata: {
            fileName: result.fileName,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
            duration: preview.duration,
            thumbnail: permanentAlbumArtUrl || preview.thumbnail,
            // Audio specific metadata
            title: preview.title,
            artist: preview.artist,
            album: preview.album,
            albumArt: permanentAlbumArtUrl,
            // PDF specific metadata
            numPages: preview.numPages,
            author: preview.author,
            subject: preview.subject,
            creator: preview.creator,
            producer: preview.producer,
            creationDate: preview.creationDate,
            modificationDate: preview.modificationDate
          }
        };
        
        uploadedFiles.push(uploadedFile);
      }

      // Clean up previews
      previewsToUpload.forEach(preview => {
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
      case 'PDF': return <PdfIcon />;
      default: return <FileIcon />;
    }
  };

  // Render preview
  const renderPreview = (preview, index) => {
    const { mediaType, url, thumbnail, albumArt, name, size, duration, title, numPages } = preview;

    return (
      <Card key={index} sx={{ position: 'relative', width: compact ? 150 : 200 }}>
        {mediaType === 'IMAGE' && (
          <CardMedia
            component="img"
            height={compact ? 100 : 140}
            image={url}
            alt={name}
            sx={{ objectFit: 'cover' }}
          />
        )}
        
        {mediaType === 'VIDEO' && (
          <CardMedia
            component="img"
            height={compact ? 100 : 140}
            image={thumbnail || url}
            alt={name}
            sx={{ objectFit: 'contain', bgcolor: '#000' }}
          />
        )}
        
        {mediaType === 'AUDIO' && (
          <>
            {(albumArt || thumbnail) ? (
              <CardMedia
                component="img"
                height={compact ? 100 : 140}
                image={albumArt || thumbnail}
                alt={title || name}
                sx={{ objectFit: 'cover' }}
              />
            ) : (
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
          </>
        )}
        
        {mediaType === 'PDF' && (
          <>
            {thumbnail ? (
              <CardMedia
                component="img"
                height={compact ? 100 : 140}
                image={thumbnail}
                alt={title || name}
                sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
              />
            ) : (
              <Box
                sx={{
                  height: compact ? 100 : 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover'
                }}
              >
                <PdfIcon sx={{ fontSize: compact ? 40 : 60, color: 'error.main' }} />
              </Box>
            )}
          </>
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
            {numPages && (
              <Chip
                label={`${numPages} pages`}
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
      
      {/* Storage warning if at or near limit */}
      {storageInfo && !storageInfo.isUnlimited && storageInfo.percentageUsed >= 90 && (
        <Alert 
          severity={storageInfo.isAtLimit ? "error" : "warning"}
          sx={{ mb: 2 }}
          icon={<WarningIcon />}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => navigate('/pricing')}
            >
              Upgrade Plan
            </Button>
          }
        >
          {storageInfo.isAtLimit ? (
            <>Storage limit reached! Upgrade your plan to continue uploading.</>
          ) : (
            <>You're using {storageInfo.percentageUsed}% of your storage. Consider upgrading soon.</>
          )}
        </Alert>
      )}

      {files.length < maxFiles && (
        <Box>
          <input
            accept={getAcceptString()}
            id="media-upload-input"
            type="file"
            multiple={maxFiles > 1}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={storageInfo?.isAtLimit}
          />
          <label htmlFor="media-upload-input">
            <Button
              variant={compact ? "outlined" : "contained"}
              component="span"
              startIcon={<UploadIcon />}
              disabled={uploading || storageInfo?.isAtLimit}
              size={compact ? "small" : "medium"}
            >
              {compact ? "Add Media" : `Add ${allowedTypes.join('/')}`}
            </Button>
          </label>
          
          {/* Show remaining storage */}
          {storageInfo && !storageInfo.isUnlimited && !compact && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              {storageInfo.limitMB - storageInfo.usageMB}MB remaining
            </Typography>
          )}
        </Box>
      )}

      {showPreview && previews.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {previews.map((preview, index) => renderPreview(preview, index))}
          </Box>
        </Box>
      )}

      {files.length > 0 && !autoUpload && (
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