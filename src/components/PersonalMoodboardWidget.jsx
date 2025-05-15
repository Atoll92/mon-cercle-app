// src/components/PersonalMoodboardWidget.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Divider,
  Chip,
  Alert,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  MoreVert as MoreVertIcon,
  CreateNewFolder as CreateNewFolderIcon
} from '@mui/icons-material';

const PersonalMoodboardWidget = ({ user }) => {
  const navigate = useNavigate();
  
  // State variables
  const [personalMoodboards, setPersonalMoodboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentMoodboard, setCurrentMoodboard] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPermissions, setNewPermissions] = useState('personal'); // Default to personal
  const [newBackgroundColor, setNewBackgroundColor] = useState('#f0f7ff'); // Light blue default
  
  // Fetch user's personal moodboards
  useEffect(() => {
    const fetchPersonalMoodboards = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get the user's profile first to get their network_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('network_id')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Then fetch the personal moodboards
        const { data, error } = await supabase
          .from('moodboards')
          .select('*')
          .eq('created_by', user.id)
          .eq('is_personal', true)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setPersonalMoodboards(data || []);
      } catch (err) {
        console.error('Error fetching personal moodboards:', err);
        setError('Failed to load your personal moodboards');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPersonalMoodboards();
  }, [user]);
  
  // Handle creating a new personal moodboard
  const handleCreateMoodboard = async () => {
    if (!newTitle.trim()) return;
    
    try {
      setProcessing(true);
      
      // Get the user's network_id from their profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('network_id')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      const networkId = profileData.network_id;
      
      const { data, error } = await supabase
        .from('moodboards')
        .insert([{
          network_id: networkId,
          title: newTitle,
          description: newDescription,
          permissions: newPermissions,
          background_color: newBackgroundColor,
          created_by: user.id,
          is_personal: true
        }])
        .select();
      
      if (error) throw error;
      
      // Add the new moodboard to state
      setPersonalMoodboards([data[0], ...personalMoodboards]);
      
      // Reset form and close dialog
      setNewTitle('');
      setNewDescription('');
      setNewPermissions('personal');
      setNewBackgroundColor('#f0f7ff');
      setCreateDialogOpen(false);
      
      setSuccess('Personal moodboard created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating personal moodboard:', err);
      setError('Failed to create personal moodboard');
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle deleting a moodboard
  const handleDeleteMoodboard = async (moodboardId) => {
    if (!confirm('Are you sure you want to delete this moodboard?')) return;
    
    try {
      setProcessing(true);
      
      // First delete all moodboard items
      const { error: itemsError } = await supabase
        .from('moodboard_items')
        .delete()
        .eq('moodboard_id', moodboardId);
      
      if (itemsError) throw itemsError;
      
      // Then delete the moodboard itself
      const { error } = await supabase
        .from('moodboards')
        .delete()
        .eq('id', moodboardId);
      
      if (error) throw error;
      
      // Update local state
      setPersonalMoodboards(personalMoodboards.filter(mb => mb.id !== moodboardId));
      
      setSuccess('Moodboard deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting moodboard:', err);
      setError('Failed to delete moodboard');
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}
    >
      <CardContent sx={{ p: 0, flexGrow: 1 }}>
        {/* Widget Header */}
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: theme => alpha(theme.palette.primary.main, 0.05)
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5
              }}
            >
              <DashboardIcon />
            </Box>
            <Typography variant="h6">
              My Moodboards
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create
          </Button>
        </Box>
        
        {/* Widget content */}
        <Box sx={{ p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          
          {personalMoodboards.length === 0 ? (
            <Paper 
              elevation={0}
              variant="outlined"
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderStyle: 'dashed',
                bgcolor: 'background.default'
              }}
            >
              <CreateNewFolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                You don't have any personal moodboards yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{ mt: 1 }}
              >
                Create Your First Moodboard
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {personalMoodboards.slice(0, 4).map(moodboard => (
                <Grid item xs={12} sm={6} key={moodboard.id}>
                  <Card 
                    elevation={1}
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      borderRadius: 2,
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
                      }
                    }}
                  >
                    {/* Moodboard color block */}
                    <Box 
                      sx={{ 
                        height: 80,
                        bgcolor: moodboard.background_color || '#f5f5f5',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {/* Permission chip */}
                      <Chip
                        icon={
                          moodboard.permissions === 'personal' ? <PersonIcon fontSize="small" /> :
                          moodboard.permissions === 'private' ? <LockIcon fontSize="small" /> :
                          <PublicIcon fontSize="small" />
                        }
                        label={
                          moodboard.permissions === 'personal' ? 'Personal' :
                          moodboard.permissions === 'private' ? 'Private' :
                          moodboard.permissions === 'public' ? 'Public' : 'Collaborative'
                        }
                        size="small"
                        sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8
                        }}
                      />
                      
                      <DashboardIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, py: 1.5 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom noWrap>
                        {moodboard.title}
                      </Typography>
                      
                      {moodboard.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            height: '2.5em'
                          }}
                        >
                          {moodboard.description}
                        </Typography>
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ p: 1.5, pt: 0 }}>
                      <Button 
                        variant="outlined"
                        size="small"
                        component={Link}
                        to={`/moodboard/${moodboard.id}`}
                        sx={{ borderRadius: 1 }}
                      >
                        Open
                      </Button>
                      
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteMoodboard(moodboard.id)}
                        sx={{ ml: 'auto' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </CardContent>
      
      {personalMoodboards.length > 4 && (
        <CardActions sx={{ p: 2, pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            fullWidth
            component={Link}
            to="/dashboard/moodboards"
            variant="outlined"
          >
            View All ({personalMoodboards.length})
          </Button>
        </CardActions>
      )}
      
      {/* Create Moodboard Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Personal Moodboard</DialogTitle>
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
            startIcon={processing && <CircularProgress size={20} />}
          >
            {processing ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default PersonalMoodboardWidget;