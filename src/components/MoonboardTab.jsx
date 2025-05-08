// src/components/MoodboardsTab.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Chip,
  alpha,
  Stack,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  LockOutlined as LockOutlinedIcon,
  GroupWork as GroupWorkIcon,
  Person as PersonIcon,
  Public as PublicIcon,
  ContentCopy as ContentCopyIcon,
  MoreVert as MoreVertIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

const MoodboardsTab = ({ 
  networkId, 
  isUserMember = false, 
  isUserAdmin = false 
}) => {
  const navigate = useNavigate();
  
  // State variables
  const [moodboards, setMoodboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentMoodboard, setCurrentMoodboard] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPermissions, setNewPermissions] = useState('private');
  const [newBackgroundColor, setNewBackgroundColor] = useState('#f5f5f5');
  
  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterPermission, setFilterPermission] = useState('all');
  
  // Function to fetch moodboards
  const fetchMoodboards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('moodboards')
        .select(`
          *,
          profiles:created_by (full_name, profile_picture_url)
        `)
        .eq('network_id', networkId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setMoodboards(data || []);
    } catch (err) {
      console.error('Error fetching moodboards:', err);
      setError('Failed to load moodboards');
    } finally {
      setLoading(false);
    }
  };
  
  // Load moodboards on component mount
  useEffect(() => {
    if (networkId) {
      fetchMoodboards();
    }
  }, [networkId]);
  
  // Handle creating a new moodboard
  const handleCreateMoodboard = async () => {
    if (!newTitle.trim()) return;
    
    try {
      setProcessing(true);
      
      const { data, error } = await supabase
        .from('moodboards')
        .insert([{
          network_id: networkId,
          title: newTitle,
          description: newDescription,
          permissions: newPermissions,
          background_color: newBackgroundColor,
          created_by: supabase.auth.user().id
        }])
        .select();
      
      if (error) throw error;
      
      // Add the new moodboard to state
      const newMoodboard = data[0];
      
      // Fetch creator info
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('full_name, profile_picture_url')
        .eq('id', supabase.auth.user().id)
        .single();
        
      // Add creator info to new moodboard
      newMoodboard.profiles = creatorData;
      
      setMoodboards([newMoodboard, ...moodboards]);
      
      // Reset form and close dialog
      setNewTitle('');
      setNewDescription('');
      setNewPermissions('private');
      setNewBackgroundColor('#f5f5f5');
      setCreateDialogOpen(false);
      
      // Navigate to the new moodboard
      navigate(`/moodboard/${newMoodboard.id}`);
      
    } catch (err) {
      console.error('Error creating moodboard:', err);
      setError('Failed to create moodboard');
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle editing a moodboard
  const handleOpenEditDialog = (moodboard) => {
    setCurrentMoodboard(moodboard);
    setNewTitle(moodboard.title);
    setNewDescription(moodboard.description || '');
    setNewPermissions(moodboard.permissions);
    setNewBackgroundColor(moodboard.background_color || '#f5f5f5');
    setEditDialogOpen(true);
  };
  
  const handleUpdateMoodboard = async () => {
    if (!currentMoodboard || !newTitle.trim()) return;
    
    try {
      setProcessing(true);
      
      const { error } = await supabase
        .from('moodboards')
        .update({
          title: newTitle,
          description: newDescription,
          permissions: newPermissions,
          background_color: newBackgroundColor,
          updated_at: new Date()
        })
        .eq('id', currentMoodboard.id);
      
      if (error) throw error;
      
      // Update in local state
      setMoodboards(moodboards.map(mb => 
        mb.id === currentMoodboard.id 
          ? { 
              ...mb, 
              title: newTitle,
              description: newDescription,
              permissions: newPermissions,
              background_color: newBackgroundColor,
              updated_at: new Date()
            } 
          : mb
      ));
      
      // Reset form and close dialog
      setCurrentMoodboard(null);
      setEditDialogOpen(false);
      
    } catch (err) {
      console.error('Error updating moodboard:', err);
      setError('Failed to update moodboard');
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle deleting a moodboard
  const handleOpenDeleteDialog = (moodboard) => {
    setCurrentMoodboard(moodboard);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteMoodboard = async () => {
    if (!currentMoodboard) return;
    
    try {
      setProcessing(true);
      
      // First delete all moodboard items
      const { error: itemsError } = await supabase
        .from('moodboard_items')
        .delete()
        .eq('moodboard_id', currentMoodboard.id);
      
      if (itemsError) throw itemsError;
      
      // Then delete the moodboard itself
      const { error } = await supabase
        .from('moodboards')
        .delete()
        .eq('id', currentMoodboard.id);
      
      if (error) throw error;
      
      // Update local state
      setMoodboards(moodboards.filter(mb => mb.id !== currentMoodboard.id));
      
      // Reset and close dialog
      setCurrentMoodboard(null);
      setDeleteDialogOpen(false);
      
    } catch (err) {
      console.error('Error deleting moodboard:', err);
      setError('Failed to delete moodboard');
    } finally {
      setProcessing(false);
    }
  };
  
  // Apply filters and sorting
  const getFilteredAndSortedMoodboards = () => {
    let filtered = [...moodboards];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(mb => 
        mb.title.toLowerCase().includes(term) ||
        (mb.description && mb.description.toLowerCase().includes(term)) ||
        (mb.profiles?.full_name && mb.profiles.full_name.toLowerCase().includes(term))
      );
    }
    
    // Apply permission filter
    if (filterPermission !== 'all') {
      filtered = filtered.filter(mb => mb.permissions === filterPermission);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'reverseAlphabetical':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    
    return filtered;
  };
  
  const filteredMoodboards = getFilteredAndSortedMoodboards();
  
  // Check if user can view a moodboard
  const canViewMoodboard = (moodboard) => {
    if (moodboard.permissions === 'public') return true;
    if (!isUserMember) return false;
    if (moodboard.permissions === 'private' && moodboard.created_by !== supabase.auth.user()?.id && !isUserAdmin) return false;
    return true;
  };
  
  // Get appropriate icon for permissions
  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'private':
        return <LockOutlinedIcon fontSize="small" />;
      case 'collaborative':
        return <GroupWorkIcon fontSize="small" />;
      case 'public':
        return <PublicIcon fontSize="small" />;
      default:
        return <VisibilityIcon fontSize="small" />;
    }
  };
  
  // Get color for permission chip
  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'private':
        return 'default';
      case 'collaborative':
        return 'success';
      case 'public':
        return 'primary';
      default:
        return 'default';
    }
  };
  
  // Get text for permission
  const getPermissionText = (permission) => {
    switch (permission) {
      case 'private':
        return 'Private';
      case 'collaborative':
        return 'Collaborative';
      case 'public':
        return 'Public';
      default:
        return 'Unknown';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Header with title and create button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography 
          variant="h5" 
          component="h2"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 600
          }}
        >
          <Box 
            component="span" 
            sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: alpha('#2196f3', 0.1),
              color: '#2196f3',
              borderRadius: '50%',
              width: 40,
              height: 40,
              mr: 1.5
            }}
          >
            <DashboardIcon />
          </Box>
          Moodboards
        </Typography>
        
        {isUserMember && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Moodboard
          </Button>
        )}
      </Box>
      
      {/* Search and filters */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2
        }}
      >
        <TextField
          placeholder="Search moodboards..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            )
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="sort-by-label">Sort By</InputLabel>
          <Select
            labelId="sort-by-label"
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
            startAdornment={<SortIcon color="action" fontSize="small" sx={{ mr: 1 }} />}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="alphabetical">A-Z</MenuItem>
            <MenuItem value="reverseAlphabetical">Z-A</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="filter-permission-label">Visibility</InputLabel>
          <Select
            labelId="filter-permission-label"
            value={filterPermission}
            label="Visibility"
            onChange={(e) => setFilterPermission(e.target.value)}
            startAdornment={<FilterListIcon color="action" fontSize="small" sx={{ mr: 1 }} />}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="public">Public Only</MenuItem>
            <MenuItem value="collaborative">Collaborative</MenuItem>
            <MenuItem value="private">Private Only</MenuItem>
          </Select>
        </FormControl>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Moodboards grid */}
      {filteredMoodboards.length === 0 ? (
        <Paper 
          elevation={0} 
          variant="outlined"
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderStyle: 'dashed'
          }}
        >
          <VisibilityOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No moodboards found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm || filterPermission !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first moodboard'}
          </Typography>
          
          {isUserMember && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Create Moodboard
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredMoodboards.map(moodboard => (
            <Grid item xs={12} sm={6} md={4} key={moodboard.id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderRadius: 2,
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }
                }}
              >
                {/* Moodboard background - colored block or image */}
                <CardMedia
                  component="div"
                  sx={{ 
                    height: 140,
                    bgcolor: moodboard.background_color || '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {/* Permission icon and text overlay */}
                  <Chip
                    icon={getPermissionIcon(moodboard.permissions)}
                    label={getPermissionText(moodboard.permissions)}
                    color={getPermissionColor(moodboard.permissions)}
                    size="small"
                    sx={{ 
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontWeight: 500
                    }}
                  />
                  
                  {/* Title overlay on hover */}
                  <Box sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    p: 1
                  }}>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                      {moodboard.title}
                    </Typography>
                  </Box>
                  
                  {/* Preview icon */}
                  <DashboardIcon sx={{ fontSize: 48, color: 'white', opacity: 0.7 }} />
                </CardMedia>
                
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {/* Creator info */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      flexGrow: 1,
                      overflow: 'hidden'
                    }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        noWrap
                      >
                        Created by: {moodboard.profiles?.full_name || 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {moodboard.description && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        height: '2.5em'
                      }}
                    >
                      {moodboard.description}
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  {canViewMoodboard(moodboard) ? (
                    <Button 
                      variant="contained"
                      color="primary"
                      size="small"
                      component={Link}
                      to={`/moodboard/${moodboard.id}`}
                      sx={{ borderRadius: 1 }}
                    >
                      Open
                    </Button>
                  ) : (
                    <Button 
                      variant="outlined"
                      color="primary"
                      size="small"
                      disabled
                      startIcon={<LockOutlinedIcon />}
                      sx={{ borderRadius: 1 }}
                    >
                      Private
                    </Button>
                  )}
                  
                  {/* Edit/Delete buttons if user is creator or admin */}
                  {(isUserAdmin || moodboard.created_by === supabase.auth.user()?.id) && (
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenEditDialog(moodboard)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDeleteDialog(moodboard)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Create Moodboard Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Moodboard</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          
          <TextField
            label="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="permissions-label">Visibility</InputLabel>
            <Select
              labelId="permissions-label"
              value={newPermissions}
              label="Visibility"
              onChange={(e) => setNewPermissions(e.target.value)}
            >
              <MenuItem value="private">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LockOutlinedIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Private</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only you and network admins can view and edit
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
              <MenuItem value="collaborative">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <GroupWorkIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Collaborative</Typography>
                    <Typography variant="caption" color="text.secondary">
                      All network members can view and edit
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
              <MenuItem value="public">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PublicIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Public</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Anyone can view, only you can edit
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Background Color
            </Typography>
            <TextField
              type="color"
              value={newBackgroundColor}
              onChange={(e) => setNewBackgroundColor(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                sx: { height: 50 }
              }}
            />
            
            <Box 
              sx={{ 
                height: 100, 
                bgcolor: newBackgroundColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography 
                variant="body2" 
                color={
                  // Determine text color based on background brightness
                  parseInt(newBackgroundColor.replace('#', ''), 16) > 0xffffff / 2 
                    ? 'rgba(0,0,0,0.8)' 
                    : 'rgba(255,255,255,0.8)'
                }
              >
                Background Preview
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateMoodboard} 
            variant="contained" 
            disabled={!newTitle.trim() || processing}
            startIcon={processing && <CircularProgress size={20} />}
          >
            {processing ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Moodboard Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Moodboard</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          
          <TextField
            label="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="edit-permissions-label">Visibility</InputLabel>
            <Select
              labelId="edit-permissions-label"
              value={newPermissions}
              label="Visibility"
              onChange={(e) => setNewPermissions(e.target.value)}
            >
              <MenuItem value="private">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LockOutlinedIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Private</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only you and network admins can view and edit
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
              <MenuItem value="collaborative">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <GroupWorkIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Collaborative</Typography>
                    <Typography variant="caption" color="text.secondary">
                      All network members can view and edit
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
              <MenuItem value="public">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PublicIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Public</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Anyone can view, only you can edit
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Background Color
            </Typography>
            <TextField
              type="color"
              value={newBackgroundColor}
              onChange={(e) => setNewBackgroundColor(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                sx: { height: 50 }
              }}
            />
            
            <Box 
              sx={{ 
                height: 100, 
                bgcolor: newBackgroundColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography 
                variant="body2" 
                color={
                  // Determine text color based on background brightness
                  parseInt(newBackgroundColor.replace('#', ''), 16) > 0xffffff / 2 
                    ? 'rgba(0,0,0,0.8)' 
                    : 'rgba(255,255,255,0.8)'
                }
              >
                Background Preview
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateMoodboard} 
            variant="contained" 
            disabled={!newTitle.trim() || processing}
            startIcon={processing && <CircularProgress size={20} />}
          >
            {processing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Moodboard</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the moodboard "{currentMoodboard?.title}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action cannot be undone. All content within this moodboard will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteMoodboard} 
            variant="contained" 
            color="error"
            disabled={processing}
            startIcon={processing && <CircularProgress size={20} color="inherit" />}
          >
            {processing ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MoodboardsTab;