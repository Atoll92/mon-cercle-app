import { supabase } from '../supabaseclient';
import imageCompression from 'browser-image-compression';

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
  PDF: {
    accept: 'application/pdf',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  ALL: {
    accept: 'image/*,video/*,audio/*,application/pdf',
    extensions: [], // Combined from above
    mimeTypes: [], // Combined from above
    maxSize: 100 * 1024 * 1024, // 100MB
  }
};

// Combine all extensions and mime types for ALL type
MEDIA_TYPES.ALL.extensions = [
  ...MEDIA_TYPES.IMAGE.extensions,
  ...MEDIA_TYPES.VIDEO.extensions,
  ...MEDIA_TYPES.AUDIO.extensions,
  ...MEDIA_TYPES.PDF.extensions
];
MEDIA_TYPES.ALL.mimeTypes = [
  ...MEDIA_TYPES.IMAGE.mimeTypes,
  ...MEDIA_TYPES.VIDEO.mimeTypes,
  ...MEDIA_TYPES.AUDIO.mimeTypes,
  ...MEDIA_TYPES.PDF.mimeTypes
];

// Get media type from file
export const getMediaType = (file) => {
  const mimeType = file.type;
  
  if (MEDIA_TYPES.IMAGE.mimeTypes.includes(mimeType)) return 'IMAGE';
  if (MEDIA_TYPES.VIDEO.mimeTypes.includes(mimeType)) return 'VIDEO';
  if (MEDIA_TYPES.AUDIO.mimeTypes.includes(mimeType)) return 'AUDIO';
  if (MEDIA_TYPES.PDF.mimeTypes.includes(mimeType)) return 'PDF';
  
  // Check by extension as fallback
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (MEDIA_TYPES.IMAGE.extensions.includes(extension)) return 'IMAGE';
  if (MEDIA_TYPES.VIDEO.extensions.includes(extension)) return 'VIDEO';
  if (MEDIA_TYPES.AUDIO.extensions.includes(extension)) return 'AUDIO';
  if (MEDIA_TYPES.PDF.extensions.includes(extension)) return 'PDF';
  
  return null;
};

// Validate file
export const validateFile = (file, allowedTypes = ['IMAGE', 'VIDEO', 'AUDIO']) => {
  console.log('validateFile: file=', file.name, 'type=', file.type, 'allowedTypes=', allowedTypes);
  console.log('validateFile: Called from:', new Error().stack.split('\n')[2]);
  const mediaType = getMediaType(file);
  console.log('validateFile: detected mediaType=', mediaType);
  
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

// Generate PDF preview/thumbnail using PDF.js
export const generatePDFThumbnail = async (file) => {
  try {
    // For now, skip PDF thumbnail generation due to worker issues
    // This can be re-enabled once PDF.js worker is properly configured
    console.log('PDF thumbnail generation skipped (worker configuration needed)');
    return null;
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    return null;
  }
};

// Get PDF metadata
export const getPDFMetadata = async (file) => {
  try {
    // For now, return basic metadata due to worker issues
    // Full metadata extraction can be re-enabled once PDF.js worker is properly configured
    console.log('PDF metadata extraction limited (worker configuration needed)');
    return {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      // Placeholder values
      numPages: null,
      title: file.name,
      author: null,
      subject: null,
      creator: null,
      producer: null,
      creationDate: null,
      modificationDate: null
    };
  } catch (error) {
    console.error('Error extracting PDF metadata:', error);
    return {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      numPages: 1
    };
  }
};

// Compress image file
export const compressImage = async (file, options = {}) => {
  const defaultOptions = {
    maxSizeMB: 1, // Max file size in MB
    maxWidthOrHeight: 1920, // Max width or height
    useWebWorker: true,
    initialQuality: 0.8,
    ...options
  };

  try {
    // Only compress if file is larger than target size
    if (file.size <= defaultOptions.maxSizeMB * 1024 * 1024) {
      return file;
    }

    const compressedFile = await imageCompression(file, defaultOptions);
    
    // Log compression results
    console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original file if compression fails
    return file;
  }
};

// Upload media file to Supabase Storage
export const uploadMediaFile = async (file, bucket, path, options = {}) => {
  try {
    // Validate file
    const validation = validateFile(file, options.allowedTypes);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    let fileToUpload = file;

    // Compress image if enabled and file is an image
    if (options.compress !== false && validation.mediaType === 'IMAGE') {
      fileToUpload = await compressImage(file, options.compressionOptions);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = fileToUpload.name.split('.').pop();
    const fileName = `${path}/${timestamp}_${randomString}.${extension}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileToUpload);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      path: fileName,
      mediaType: validation.mediaType,
      fileName: file.name,
      originalSize: file.size,
      uploadedSize: fileToUpload.size,
      mimeType: fileToUpload.type,
      wasCompressed: fileToUpload !== file
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

// Upload album art from blob URL
export const uploadAlbumArt = async (blobUrl, bucket, path) => {
  try {
    // Fetch blob from URL
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // Convert blob to file
    const file = new File([blob], 'album-art.jpg', { type: blob.type || 'image/jpeg' });
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${path}/album-art-${timestamp}_${randomString}.jpg`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading album art:', error);
    return null;
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

// Extract audio metadata including album art
export const extractAudioMetadata = async (file) => {
  try {
    // Provide Buffer polyfill for music-metadata-browser
    if (typeof global === 'undefined') {
      globalThis.global = globalThis;
    }
    if (typeof Buffer === 'undefined') {
      const { Buffer } = await import('buffer');
      globalThis.Buffer = Buffer;
    }
    
    // Use music-metadata-browser to extract full metadata
    const { parseBuffer } = await import('music-metadata-browser');
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          // Convert ArrayBuffer to Buffer for music-metadata-browser
          const arrayBuffer = event.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          const buffer = Buffer.from(uint8Array);
          
          const metadata = await parseBuffer(buffer);
          
          const result = {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            duration: metadata.format.duration,
            title: metadata.common.title,
            artist: metadata.common.artist,
            album: metadata.common.album,
            year: metadata.common.year,
            genre: metadata.common.genre ? metadata.common.genre.join(', ') : undefined
          };
          
          // Extract album art if available
          if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            const blob = new Blob([picture.data], { type: picture.format });
            result.albumArt = URL.createObjectURL(blob);
            result.thumbnail = result.albumArt; // Also set as thumbnail for consistency
          }
          
          resolve(result);
        } catch (error) {
          console.error('Error parsing audio metadata:', error);
          // Fallback to basic audio element for duration
          const audio = document.createElement('audio');
          audio.onloadedmetadata = () => {
            resolve({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              duration: audio.duration
            });
          };
          audio.onerror = () => {
            resolve({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type
            });
          };
          audio.src = URL.createObjectURL(file);
        }
      };
      
      reader.onerror = () => {
        resolve({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type
        });
      };
      
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error('Error importing music-metadata-browser:', error);
    // Fallback implementation with audio element for duration
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.onloadedmetadata = () => {
        resolve({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          duration: audio.duration
        });
      };
      audio.onerror = () => {
        resolve({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type
        });
      };
      audio.src = URL.createObjectURL(file);
    });
  }
};