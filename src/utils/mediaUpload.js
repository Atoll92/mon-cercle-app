import { supabase } from '../supabaseclient';

// Supported file types
export const MEDIA_TYPES = {
  IMAGE: {
    accept: 'image/*',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  VIDEO: {
    accept: 'video/*',
    extensions: ['.mp4', '.webm', '.ogg', '.mov', '.avi'],
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  AUDIO: {
    accept: 'audio/*',
    extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  ALL: {
    accept: 'image/*,video/*,audio/*',
    extensions: [], // Combined from above
    mimeTypes: [], // Combined from above
    maxSize: 100 * 1024 * 1024, // 100MB
  }
};

// Combine all extensions and mime types for ALL type
MEDIA_TYPES.ALL.extensions = [
  ...MEDIA_TYPES.IMAGE.extensions,
  ...MEDIA_TYPES.VIDEO.extensions,
  ...MEDIA_TYPES.AUDIO.extensions
];
MEDIA_TYPES.ALL.mimeTypes = [
  ...MEDIA_TYPES.IMAGE.mimeTypes,
  ...MEDIA_TYPES.VIDEO.mimeTypes,
  ...MEDIA_TYPES.AUDIO.mimeTypes
];

// Get media type from file
export const getMediaType = (file) => {
  const mimeType = file.type;
  
  if (MEDIA_TYPES.IMAGE.mimeTypes.includes(mimeType)) return 'IMAGE';
  if (MEDIA_TYPES.VIDEO.mimeTypes.includes(mimeType)) return 'VIDEO';
  if (MEDIA_TYPES.AUDIO.mimeTypes.includes(mimeType)) return 'AUDIO';
  
  // Check by extension as fallback
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (MEDIA_TYPES.IMAGE.extensions.includes(extension)) return 'IMAGE';
  if (MEDIA_TYPES.VIDEO.extensions.includes(extension)) return 'VIDEO';
  if (MEDIA_TYPES.AUDIO.extensions.includes(extension)) return 'AUDIO';
  
  return null;
};

// Validate file
export const validateFile = (file, allowedTypes = ['IMAGE', 'VIDEO', 'AUDIO']) => {
  const mediaType = getMediaType(file);
  
  if (!mediaType) {
    return { valid: false, error: 'Unsupported file type' };
  }
  
  if (!allowedTypes.includes(mediaType)) {
    return { valid: false, error: `${mediaType} files are not allowed` };
  }
  
  const typeConfig = MEDIA_TYPES[mediaType];
  if (file.size > typeConfig.maxSize) {
    const maxSizeMB = typeConfig.maxSize / (1024 * 1024);
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }
  
  return { valid: true, mediaType };
};

// Upload media file to Supabase Storage
export const uploadMediaFile = async (file, bucket, path) => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `${path}/${timestamp}_${randomString}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      path: data.path,
      mediaType: validation.mediaType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

// Create thumbnail for video (returns first frame as image)
export const createVideoThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = 0;
    };

    video.onseeked = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
};

// Get duration of audio/video file
export const getMediaDuration = (file) => {
  return new Promise((resolve, reject) => {
    const media = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video');
    
    media.onloadedmetadata = () => {
      resolve(media.duration);
    };
    
    media.onerror = reject;
    media.src = URL.createObjectURL(file);
  });
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format duration
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};