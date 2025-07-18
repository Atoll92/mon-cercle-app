import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { supabase } from '../supabaseclient';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import Spinner from '../components/Spinner';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Description as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  TextSnippet as TextIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon,
  Article as DocIcon,
  Archive as ZipIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Search as SearchIcon
} from '@mui/icons-material';
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

// Main component
function SharedFilesPage() {
  const { networkId } = useParams();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileDescription, setFileDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [filterOption, setFilterOption] = useState('all');
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedFileMenu, setSelectedFileMenu] = useState(null);
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState(null);
  
  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!networkId || !user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is part of this network by getting their profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeProfile.id)
          .single();
          
        if (profileError) throw profileError;
        setUserProfile(profileData);
        
        // Get network details
        const { data: networkData, error: networkError } = await supabase
          .from('networks')
          .select('*')
          .eq('id', networkId)
          .single();
          
        if (networkError) throw networkError;
        setNetwork(networkData);
        
        // Verify user belongs to this network
        if (profileData.network_id !== networkId) {
          setError('You do not have access to this network.');
          setLoading(false);
          return;
        }
        
        // Fetch files from this network
        await fetchNetworkFiles();
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load network information.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [networkId, user]);
  
  // Function to fetch network files
  const fetchNetworkFiles = async () => {
    try {
      // Fetch files from the database table
      const { data, error } = await supabase
        .from('network_files')
        .select('*')
        .eq('network_id', networkId)
        .order('created_at', { ascending: false });
        
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
    }
  };
  
  // Handle file selection for upload
  const handleFileSelected = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }
    
    const file = e.target.files[0];
    
    // Check file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB.');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
  };
  
  // Handle file upload
  const handleUploadFile = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      setError(null);
      
      // Sanitize filename to avoid issues with special characters
      const sanitizedFileName = selectedFile.name
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      
      // Create a unique file path in the 'shared' bucket
      const filePath = `${networkId}/${Date.now()}_${sanitizedFileName}`;
      
      // Upload the file to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('shared')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shared')
        .getPublicUrl(filePath);
      
      // Add a record to the network_files table
      const { error: dbError, data: fileData } = await supabase
        .from('network_files')
        .insert([{ 
          network_id: networkId,
          uploaded_by: activeProfile.id,
          filename: selectedFile.name,
          filepath: filePath,
          file_url: publicUrl,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          description: fileDescription || null
        }])
        .select();
        
      if (dbError) throw dbError;
      
      // Close the dialog and refresh the file list
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setFileDescription('');
      setMessage('File uploaded successfully!');
      
      // Add the new file to the file list with uploader info
      const { data: uploaderData } = await supabase
        .from('profiles')
        .select('full_name, profile_picture_url')
        .eq('id', activeProfile.id)
        .single();
        
      const newFile = {
        ...fileData[0],
        uploader: uploaderData
      };
      
      setFiles([newFile, ...files]);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
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
  
  // Handle file deletion
  const handleDeleteFile = async (file) => {
    if (file.uploaded_by !== activeProfile.id && userProfile.role !== 'admin') {
      setError('You can only delete files that you uploaded.');
      return;
    }
    
    try {
      // First delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('shared')
        .remove([file.filepath]);
      
      if (storageError) throw storageError;
      
      // Then delete the database record
      const { error: dbError } = await supabase
        .from('network_files')
        .delete()
        .eq('id', file.id);
        
      if (dbError) throw dbError;
      
      // Update the file list
      setFiles(files.filter(f => f.id !== file.id));
      setMessage('File deleted successfully!');
      setFileMenuAnchorEl(null);
      
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file. Please try again.');
    }
  };
  
  // Handle file menu open
  const handleFileMenuOpen = (event, file) => {
    setFileMenuAnchorEl(event.currentTarget);
    setSelectedFileMenu(file);
  };
  
  // Handle file menu close
  const handleFileMenuClose = () => {
    setFileMenuAnchorEl(null);
    setSelectedFileMenu(null);
  };
  
  // Filter and sort files based on current options
  const getFilteredAndSortedFiles = () => {
    // First, filter the files based on search and file type
    let filteredFiles = files.filter(file => {
      // Search filter
      const searchMatch = !searchTerm || 
        file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        file.uploader.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      let typeMatch = true;
      if (filterOption !== 'all') {
        const fileType = file.file_type || '';
        
        switch (filterOption) {
          case 'images':
            typeMatch = fileType.includes('image');
            break;
          case 'documents':
            typeMatch = fileType.includes('pdf') || 
                      fileType.includes('doc') || 
                      fileType.includes('text') ||
                      fileType.includes('sheet');
            break;
          case 'audio':
            typeMatch = fileType.includes('audio');
            break;
          case 'video':
            typeMatch = fileType.includes('video');
            break;
          case 'archives':
            typeMatch = fileType.includes('zip') || 
                      fileType.includes('rar') || 
                      fileType.includes('tar') || 
                      fileType.includes('compressed');
            break;
          default:
            typeMatch = true;
        }
      }
      
      return searchMatch && typeMatch;
    });
    
    // Then, sort the filtered files
    switch (sortOption) {
      case 'newest':
        filteredFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filteredFiles.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'largest':
        filteredFiles.sort((a, b) => b.file_size - a.file_size);
        break;
      case 'smallest':
        filteredFiles.sort((a, b) => a.file_size - b.file_size);
        break;
      case 'name_asc':
        filteredFiles.sort((a, b) => a.filename.localeCompare(b.filename));
        break;
      case 'name_desc':
        filteredFiles.sort((a, b) => b.filename.localeCompare(a.filename));
        break;
      case 'most_downloaded':
        filteredFiles.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
        break;
      default:
        break;
    }
    
    return filteredFiles;
  };
  
  const filteredFiles = getFilteredAndSortedFiles();
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '50vh' 
        }}
      >
        <Spinner size={120} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading files...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            component={Link}
            to={`/network/${networkId}`}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Network
          </Button>
          <Typography variant="h4" component="h1">
            Shared Files
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {message && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setMessage(null)}
          >
            {message}
          </Alert>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' }, 
          mb: 3, 
          flexWrap: 'wrap', 
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 },
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' }
          }}>
            <TextField
              placeholder="Search files..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ 
                minWidth: { xs: '100%', sm: 200 },
                flexGrow: { xs: 1, sm: 0 }
              }}
            />
            
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={(e) => setFilterMenuOpen(true)}
              size="small"
              sx={{ 
                minWidth: { xs: 'auto', sm: 'auto' },
                flex: { xs: '1 1 auto', sm: '0 0 auto' }
              }}
            >
              {filterOption === 'all' ? 'All Files' : 
                filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Button>
            
            <Menu
              anchorEl={anchorEl}
              open={filterMenuOpen}
              onClose={() => setFilterMenuOpen(false)}
            >
              <MenuItem onClick={() => { setFilterOption('all'); setFilterMenuOpen(false); }}>
                All Files
              </MenuItem>
              <MenuItem onClick={() => { setFilterOption('images'); setFilterMenuOpen(false); }}>
                Images
              </MenuItem>
              <MenuItem onClick={() => { setFilterOption('documents'); setFilterMenuOpen(false); }}>
                Documents
              </MenuItem>
              <MenuItem onClick={() => { setFilterOption('audio'); setFilterMenuOpen(false); }}>
                Audio
              </MenuItem>
              <MenuItem onClick={() => { setFilterOption('video'); setFilterMenuOpen(false); }}>
                Video
              </MenuItem>
              <MenuItem onClick={() => { setFilterOption('archives'); setFilterMenuOpen(false); }}>
                Archives
              </MenuItem>
            </Menu>
            
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={(e) => setSortMenuOpen(true)}
              size="small"
              sx={{ 
                minWidth: { xs: 'auto', sm: 'auto' },
                flex: { xs: '1 1 auto', sm: '0 0 auto' }
              }}
            >
              Sort: {sortOption === 'newest' ? 'Newest' : 
                     sortOption === 'oldest' ? 'Oldest' : 
                     sortOption === 'largest' ? 'Largest' : 
                     sortOption === 'smallest' ? 'Smallest' : 
                     sortOption === 'name_asc' ? 'Name (A-Z)' : 
                     sortOption === 'name_desc' ? 'Name (Z-A)' : 
                     sortOption === 'most_downloaded' ? 'Most Downloaded' : 'Newest'}
            </Button>
            
            <Menu
              anchorEl={anchorEl}
              open={sortMenuOpen}
              onClose={() => setSortMenuOpen(false)}
            >
              <MenuItem onClick={() => { setSortOption('newest'); setSortMenuOpen(false); }}>
                Newest
              </MenuItem>
              <MenuItem onClick={() => { setSortOption('oldest'); setSortMenuOpen(false); }}>
                Oldest
              </MenuItem>
              <MenuItem onClick={() => { setSortOption('largest'); setSortMenuOpen(false); }}>
                Largest
              </MenuItem>
              <MenuItem onClick={() => { setSortOption('smallest'); setSortMenuOpen(false); }}>
                Smallest
              </MenuItem>
              <MenuItem onClick={() => { setSortOption('name_asc'); setSortMenuOpen(false); }}>
                Name (A-Z)
              </MenuItem>
              <MenuItem onClick={() => { setSortOption('name_desc'); setSortMenuOpen(false); }}>
                Name (Z-A)
              </MenuItem>
              <MenuItem onClick={() => { setSortOption('most_downloaded'); setSortMenuOpen(false); }}>
                Most Downloaded
              </MenuItem>
            </Menu>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              mt: { xs: 1, sm: 0 }
            }}
          >
            Upload File
          </Button>
        </Box>
        
        {filteredFiles.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom>
              No files found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {files.length === 0 
                ? 'Be the first to upload a file to this network!' 
                : 'No files match your current filters.'}
            </Typography>
          </Paper>
        ) : (
          <List sx={{ bgcolor: 'background.paper' }}>
            {filteredFiles.map((file, index) => (
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
                  secondaryAction={<><Tooltip title="Download">
                      <IconButton 
                        edge="end" 
                        aria-label="download"
                        onClick={() => handleDownloadFile(file)}
                        sx={{ mr: 1 }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <IconButton 
                      edge="end" 
                      aria-label="file options"
                      onClick={(e) => handleFileMenuOpen(e, file)}
                    >
                      <MoreVertIcon />
                    </IconButton></>}
                >
                  <ListItemIcon>
                    <FileTypeIcon fileType={file.file_type} />
                  </ListItemIcon>
                  
                  <ListItemText
                    style={{ marginRight: '70px' }}
                    primary={
                      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                        {file.filename}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: { xs: 0.5, sm: 1 }, 
                          mt: 0.5,
                          maxWidth: { xs: 'calc(100vw - 120px)', sm: 'none' }
                        }}>
                          <Chip 
                            label={formatFileSize(file.file_size)} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                          />
                          <Chip 
                            label={`Uploaded ${formatDistanceToNow(new Date(file.created_at))} ago`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                          />
                          <Chip 
                            label={`Downloads: ${file.download_count || 0}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                          />
                          <Chip 
                            label={`By: ${file.uploader.full_name}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                          />
                        </Box>
                        {file.description && (
                          <Typography 
                            variant="body2" 
                            sx={{ mt: 1, color: 'text.primary' }}
                          >
                            {file.description}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <input
              accept="*/*"
              style={{ display: 'none' }}
              id="upload-file-button"
              type="file"
              onChange={handleFileSelected}
            />
            <label htmlFor="upload-file-button">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ py: 5, border: '1px dashed', borderColor: 'divider' }}
              >
                {selectedFile ? selectedFile.name : 'Select a file to upload'}
              </Button>
            </label>
            
            {selectedFile && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  File size: {formatFileSize(selectedFile.size)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  File type: {selectedFile.type || 'Unknown'}
                </Typography>
              </Box>
            )}
          </Box>
          
          <TextField
            label="File Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={fileDescription}
            onChange={(e) => setFileDescription(e.target.value)}
            placeholder="Add a description for this file..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUploadFile} 
            variant="contained" 
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <Spinner size={40} /> : <CloudUploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* File Menu */}
      <Menu
        anchorEl={fileMenuAnchorEl}
        open={Boolean(fileMenuAnchorEl)}
        onClose={handleFileMenuClose}
      >
        <MenuItem onClick={() => { 
          handleDownloadFile(selectedFileMenu);
          handleFileMenuClose();
        }}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        
        {(selectedFileMenu && (selectedFileMenu.uploaded_by === user?.id || userProfile?.role === 'admin')) && (
          <MenuItem onClick={() => {
            handleDeleteFile(selectedFileMenu);
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Container>
  );
}

export default SharedFilesPage;