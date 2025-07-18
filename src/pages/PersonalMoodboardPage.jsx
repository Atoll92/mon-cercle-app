// src/pages/PersonalMoodboardsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { supabase } from '../supabaseclient';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Stack,
  Tabs,
  Tab,
  alpha
} from '@mui/material';
import Spinner from '../components/Spinner';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

function PersonalMoodboardsPage() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  
  // State variables
  const [moodboards, setMoodboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentMoodboard, setCurrentMoodboard] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPermissions, setNewPermissions] = useState('personal');
  const [newBackgroundColor, setNewBackgroundColor] = useState('#f0f7ff');
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0 = Personal, 1 = Network Moodboards
  const [sortBy, setSortBy] = useState('newest');
  
  // Fetch moodboards
  useEffect(() => {
    const fetchMoodboards = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Get user's profile to get network_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('network_id')
          .eq('id', activeProfile.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Fetch personal moodboards
        const personalQuery = supabase
          .from('moodboards')
          .select('*')
          .eq('created_by', activeProfile.id)
          .eq('is_personal', true);
        
        // Fetch network moodboards
        const networkQuery = supabase
          .from('moodboards')
          .select('*')
          .eq('network_id', profileData.network_id)
          .eq('is_personal', false);
        
        // Execute both queries
        const [personalResult, networkResult] = await Promise.all([
          personalQuery,
          networkQuery
        ]);
        
        if (personalResult.error) throw personalResult.error;
        if (networkResult.error) throw networkResult.error;
        
        // Combine and sort by created_at (newest first)
        const allMoodboards = [
          ...(personalResult.data || []).map(mb => ({ ...mb, type: 'personal' })),
          ...(networkResult.data || []).map(mb => ({ ...mb, type: 'network' }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setMoodboards(allMoodboards);
      } catch (err) {
        console.error('Error fetching moodboards:', err);
        setError('Failed to load moodboards');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMoodboards();
  }, [user, navigate, activeProfile]);
  
  // Create new moodboard
  const handleCreateMoodboard = async () => {
    if (!newTitle.trim()) return;
    
    try {
      setProcessing(true);
      
      // Get user's network_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('network_id')
        .eq('id', activeProfile.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Create new moodboard
      const { data, error } = await supabase
        .from('moodboards')
        .insert([{
          network_id: profileData.network_id,
          title: newTitle,
          description: newDescription,
          permissions: newPermissions,
          background_color: newBackgroundColor,
          created_by: activeProfile.id,
          is_personal: true
        }])
        .select();
      
      if (error) throw error;
      
      // Add to local state
      const newMoodboard = { ...data[0], type: 'personal' };
      setMoodboards([newMoodboard, ...moodboards]);
      
      // Reset form and close dialog
      setNewTitle('');
      setNewDescription('');
      setNewPermissions('personal');
      setNewBackgroundColor('#f0f7ff');
      setCreateDialogOpen(false);
      
      setSuccess('Moodboard created successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Navigate to the new moodboard
      navigate(`/moodboard/${newMoodboard.id}`);
    } catch (err) {
      console.error('Error creating moodboard:', err);
      setError('Failed to create moodboard');
    } finally {
      setProcessing(false);
    }
  };
  
  // Edit moodboard
  const handleOpenEditDialog = (moodboard) => {
    setCurrentMoodboard(moodboard);
    setNewTitle(moodboard.title);
    setNewDescription(moodboard.description || '');
    setNewPermissions(moodboard.permissions);
    setNewBackgroundColor(moodboard.background_color || '#f0f7ff');
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
      
      setSuccess('Moodboard updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating moodboard:', err);
      setError('Failed to update moodboard');
    } finally {
      setProcessing(false);
    }
  };
  
  // Delete moodboard
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
      
      setSuccess('Moodboard deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting moodboard:', err);
      setError('Failed to delete moodboard');
    } finally {
      setProcessing(false);
    }
  };
  
  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Filter and sort moodboards
  const getFilteredMoodboards = () => {
    let filtered = [...moodboards];
    
    // Filter by type
    if (activeTab === 0) {
      filtered = filtered.filter(mb => mb.type === 'personal');
    } else {
      filtered = filtered.filter(mb => mb.type === 'network');
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(mb => 
        mb.title.toLowerCase().includes(term) || 
        (mb.description && mb.description.toLowerCase().includes(term))
      );
    }
    
    // Sort
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
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    return filtered;
  };
  
  const filteredMoodboards = getFilteredMoodboards();
  
  // Get permission icon
  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'personal':
        return <PersonIcon fontSize="small" />;
      case 'private':
        return <LockIcon fontSize="small" />;
      case 'public':
        return <PublicIcon fontSize="small" />;
      default:
        return <PublicIcon fontSize="small" />;
    }
  };
  
  // Get permission text
  const getPermissionText = (permission) => {
    switch (permission) {
      case 'personal':
        return 'Personal';
      case 'private':
        return 'Private';
      case 'public':
        return 'Public';
      case 'collaborative':
        return 'Collaborative';
      default:
        return 'Unknown';
    }
  };
  
  // Get permission color
  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'personal':
        return 'default';
      case 'private':
        return 'error';
      case 'public':
        return 'primary';
      case 'collaborative':
        return 'success';
      default:
        return 'default';
    }
  };
  
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
          Loading your moodboards...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              component={Link}
              to="/dashboard"
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              Back to Dashboard
            </Button>
            
            <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
              My Moodboards
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Moodboard
          </Button>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Tabs and Search Filters */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ minHeight: 48 }}
          >
            <Tab 
              label="Personal Moodboards" 
              icon={<PersonIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Network Moodboards" 
              icon={<DashboardIcon />} 
              iconPosition="start"
            />
          </Tabs>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ width: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="sort-label">Sort By</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                startAdornment={<SortIcon color="action" fontSize="small" sx={{ mr: 1 }} />}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="alphabetical">Alphabetical</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>
      
      {/* Messages */}
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
      
      {/* Moodboards Grid */}
      {filteredMoodboards.length === 0 ? (
        <Paper 
          elevation={0}
          variant="outlined"
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: 2,
            borderStyle: 'dashed'
          }}
        >
          <VisibilityOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No {activeTab === 0 ? 'personal' : 'network'} moodboards found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : activeTab === 0 
                ? 'Create your first personal moodboard' 
                : 'No network moodboards available'}
          </Typography>
          
          {activeTab === 0 && (
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
                elevation={2}
              >
                {/* Moodboard color header */}
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
                  {/* Permission badge */}
                  <Chip
                    icon={getPermissionIcon(moodboard.permissions)}
                    label={getPermissionText(moodboard.permissions)}
                    color={getPermissionColor(moodboard.permissions)}
                    size="small"
                    sx={{ 
                      position: 'absolute',
                      top: 8,
                      right: 8,
                    }}
                  />
                  
                  <DashboardIcon 
                    sx={{ 
                      fontSize: 64, 
                      color: parseInt(moodboard.background_color?.replace('#', ''), 16) > 0xffffff / 2 
                        ? 'rgba(0,0,0,0.3)' 
                        : 'rgba(255,255,255,0.3)' 
                    }} 
                  />
                  
                  {/* Title overlay */}
                  <Box sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    p: 1.5
                  }}>
                    <Typography variant="h6" fontWeight="medium" noWrap>
                      {moodboard.title}
                    </Typography>
                  </Box>
                </CardMedia>
                
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" component="div">
                      Created {new Date(moodboard.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  {moodboard.description && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '4.5em'
                      }}
                    >
                      {moodboard.description}
                    </Typography>
                  )}
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ p: 1.5 }}>
                  <Button 
                    variant="contained"
                    size="small"
                    component={Link}
                    to={`/moodboard/${moodboard.id}`}
                    sx={{ borderRadius: 1 }}
                  >
                    Open
                  </Button>
                  
                  {moodboard.created_by === user?.id && (
                    <Box sx={{ display: 'flex', ml: 'auto' }}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenEditDialog(moodboard)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleOpenDeleteDialog(moodboard)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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
              <MenuItem value="personal">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Personal</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only you can view and edit
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
              <MenuItem value="private">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LockIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Private</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only you and admins can view
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
            startIcon={processing && <Spinner size={40} />}
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
              <MenuItem value="personal">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Personal</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only you can view and edit
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
              <MenuItem value="private">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LockIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Private</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only you and admins can view
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
            startIcon={processing && <Spinner size={40} />}
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
            startIcon={processing && <Spinner size={40} color="inherit" />}
          >
            {processing ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PersonalMoodboardsPage;