// src/components/FilesTab.jsx
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
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { Attachment } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { addMoodboardItem } from '../api/moodboards'; // Import the moodboards API

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
  const [success, setSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [moodboardDialogOpen, setMoodboardDialogOpen] = useState(false);
  const [createMoodboardDialogOpen, setCreateMoodboardDialogOpen] = useState(false);
  const [userMoodboards, setUserMoodboards] = useState([]);
  const [loadingMoodboards, setLoadingMoodboards] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Function to fetch user's moodboards
  const fetchUserMoodboards = async () => {
    if (!user) return;

    try {
      setLoadingMoodboards(true);
      
      const { data, error } = await supabase
        .from('moodboards')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserMoodboards(data || []);
    } catch (err) {
      console.error('Error fetching moodboards:', err);
      setError('Failed to load your moodboards');
    } finally {
      setLoadingMoodboards(false);
    }
  };
  
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

  const handleUseInMoodboard = (file) => {
    setSelectedFile(file);
    fetchUserMoodboards(); // Fetch moodboards when dialog is opened
    setMoodboardDialogOpen(true);
  };

  const handleAddToMoodboard = async (file, moodboardId) => {
    try {
      setProcessing(true);
      
      // Add the file as an image item to the moodboard
      const newItem = {
        moodboard_id: moodboardId,
        type: file.file_type.startsWith('image/') ? 'image' : 'link',
        content: file.file_url,
        title: file.filename,
        x: 100, // Default position
        y: 100,
        width: 300,
        height: 200,
        created_by: user.id
      };
      
      await addMoodboardItem(newItem);
      
      setSuccess('Added to moodboard successfully!');
      setMoodboardDialogOpen(false);
    } catch (err) {
      console.error('Error adding to moodboard:', err);
      setError('Failed to add to moodboard');
    } finally {
      setProcessing(false);
    }
  };
  
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
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
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
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                      size="small"
                      startIcon={<DashboardIcon />}
                      onClick={() => handleUseInMoodboard(file)}
                      sx={{ mr: 1 }}
                    >
                      Use in Moodboard
                    </Button>
                    
                    <Tooltip title="Download">
                      <IconButton 
                        edge="end" 
                        aria-label="download"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
          
          {/* Moodboard Selection Dialog */}
          <Dialog 
            open={moodboardDialogOpen} 
            onClose={() => setMoodboardDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Add to Moodboard</DialogTitle>
            <DialogContent>
              {loadingMoodboards ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : userMoodboards.length === 0 ? (
                <Typography>
                  You don't have any moodboards yet. Would you like to create one?
                </Typography>
              ) : (
                <List>
                  {userMoodboards.map(moodboard => (
                    <ListItem 
                      button 
                      key={moodboard.id}
                      onClick={() => handleAddToMoodboard(selectedFile, moodboard.id)}
                    >
                      <ListItemIcon>
                        <DashboardIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={moodboard.title}
                        secondary={`${moodboard.permissions} • Created ${new Date(moodboard.created_at).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMoodboardDialogOpen(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  setMoodboardDialogOpen(false);
                  navigate(`/network/${networkId}/moodboards/create`, { 
                    state: { fileToAdd: selectedFile } 
                  });
                }}
              >
                Create New Moodboard
              </Button>
            </DialogActions>
          </Dialog>
          
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