import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  TextSnippet as TextIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon,
  Article as DocIcon,
  Archive as ZipIcon,
  Download as DownloadIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { Attachment } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// Component to display file icon based on file type
const FileTypeIcon = ({ fileType }) => {
  if (!fileType) return <FileIcon />;
  
  const type = fileType.toLowerCase();
  
  if (type.includes('image')) return <ImageIcon color="primary" />;
  if (type.includes('pdf')) return <PdfIcon color="error" />;
  if (type.includes('text')) return <TextIcon color="info" />;
  if (type.includes('audio')) return <AudioIcon color="success" />;
  if (type.includes('video')) return <VideoIcon color="warning" />;
  if (type.includes('word') || type.includes('document')) return <DocIcon color="primary" />;
  if (type.includes('zip') || type.includes('compressed')) return <ZipIcon color="action" />;
  if (type.includes('javascript') || type.includes('json') || type.includes('html') || type.includes('css')) 
    return <CodeIcon color="secondary" />;
  
  return <FileIcon />;
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Files Tab Component
const FilesTab = ({ networkId, isUserMember }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchFiles = async () => {
      if (!networkId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch only the 5 most recent files
        const { data, error } = await supabase
          .from('network_files')
          .select('*')
          .eq('network_id', networkId)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        
        // Enhance file data with uploader information
        const filesWithUploaders = await Promise.all(data.map(async (file) => {
          const { data: uploaderData } = await supabase
            .from('profiles')
            .select('full_name, profile_picture_url')
            .eq('id', file.uploaded_by)
            .single();
            
          return {
            ...file,
            uploader: uploaderData || { full_name: 'Unknown User' }
          };
        }));
        
        setFiles(filesWithUploaders);
      } catch (error) {
        console.error('Error fetching files:', error);
        setError('Failed to load network files.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFiles();
  }, [networkId]);
  
  // Handle file download
  const handleDownloadFile = async (file) => {
    try {
      // Increment the download count in the database
      const { error: updateError } = await supabase
        .from('network_files')
        .update({ download_count: (file.download_count || 0) + 1 })
        .eq('id', file.id);
        
      if (updateError) console.error('Error updating download count:', updateError);
      
      // Update the local state
      setFiles(files.map(f => 
        f.id === file.id 
          ? { ...f, download_count: (f.download_count || 0) + 1 } 
          : f
      ));
      
      // Trigger the download
      window.open(file.file_url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file.');
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Network Files
        </Typography>
        
        <Button
          component={Link}
          to={`/network/${networkId}/files`}
          variant="contained"
          color="primary"
          endIcon={<ArrowForwardIcon />}
        >
          Go to Files Page
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {!isUserMember ? (
        <Alert severity="info">
          You need to be a member of this network to access shared files.
        </Alert>
      ) : files.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom>
            No files shared yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Be the first to share files with this network!
          </Typography>
          <Button
            component={Link}
            to={`/network/${networkId}/files`}
            variant="contained"
            startIcon={<CloudUploadIcon />}
          >
            Upload Files
          </Button>
        </Paper>
      ) : (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Recently Shared Files
          </Typography>
          
          <List sx={{ bgcolor: 'background.paper' }}>
            {files.map((file, index) => (
              <React.Fragment key={file.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    p: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ListItemIcon>
                    <FileTypeIcon fileType={file.file_type} />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                        {file.filename}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={formatFileSize(file.file_size)} 
                            size="small" 
                            variant="outlined"
                          />
                          <Chip 
                            label={`Uploaded ${formatDistanceToNow(new Date(file.created_at))} ago`} 
                            size="small" 
                            variant="outlined"
                          />
                          <Chip 
                            label={`By: ${file.uploader.full_name}`} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Tooltip title="Download">
                      <IconButton 
                        edge="end" 
                        aria-label="download"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button 
              component={Link}
              to={`/network/${networkId}/files`}
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
            >
              View All Files
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default FilesTab;