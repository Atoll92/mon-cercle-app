// src/components/PersonalMoodboardWidget.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useProfile } from '../context/profileContext';
import MoodboardSettingsDialog from './Moodboard/MoodboardSettingsDialog';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Spinner,
  Grid,
  Paper,
  Divider,
  Chip,
  Alert,
  IconButton,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  CreateNewFolder as CreateNewFolderIcon
} from '@mui/icons-material';
import FlexFlowBox from './FlexFlowBox';

const PersonalMoodboardWidget = ({ user }) => {
  const { activeProfile, isLoadingProfiles } = useProfile();
  
  // State variables
  const [personalMoodboards, setPersonalMoodboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Fetch user's personal moodboards
  useEffect(() => {
    const fetchPersonalMoodboards = async () => {
      if (!user || isLoadingProfiles) return;
      
      // If no active profile after loading, show appropriate message
      if (!isLoadingProfiles && !activeProfile) {
        setError('No active profile selected');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the personal moodboards using the active profile ID
        const { data, error } = await supabase
          .from('moodboards')
          .select('*')
          .eq('created_by', activeProfile.id)
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
  }, [user, activeProfile, isLoadingProfiles]);
  
  // Handle creating a new personal moodboard
  const handleCreateMoodboard = async (formData) => {
    if (!activeProfile) return;
    
    try {
      setProcessing(true);
      
      const { data, error } = await supabase
        .from('moodboards')
        .insert([{
          network_id: activeProfile.network_id,
          title: formData.title,
          description: formData.description,
          permissions: formData.permissions,
          background_color: formData.background_color,
          created_by: activeProfile.id,
          is_personal: true
        }])
        .select();
      
      if (error) throw error;
      
      // Add the new moodboard to state
      setPersonalMoodboards([data[0], ...personalMoodboards]);
      
      // Close dialog
      setCreateDialogOpen(false);
      
      setSuccess('Personal moodboard created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating personal moodboard:', err);
      setError('Failed to create personal moodboard');
      throw err; // Re-throw to let dialog handle the error
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
  
  if (loading || isLoadingProfiles) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Spinner size={30} />
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
            p: 1.5, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(25, 118, 210, 0.05)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon color="primary" sx={{ mr: 1.5 }} />
            <Typography variant="subtitle1">
              My Moodboards
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setError(null);
              setCreateDialogOpen(true);
            }}
          >
            Create
          </Button>
        </Box>
        
        {/* Widget content */}
        <Box sx={{ p: 2 }}>
          {error && !createDialogOpen && (
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
            <FlexFlowBox>
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
                          moodboard.permissions === 'private' ? <LockIcon fontSize="small" /> :
                          <PublicIcon fontSize="small" />
                        }
                        label={
                          moodboard.permissions === 'private' ? 'Private' :
                          moodboard.permissions === 'public' ? 'Public' : 'Private'
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
            </FlexFlowBox>
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
      <MoodboardSettingsDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setError(null);
        }}
        onSave={handleCreateMoodboard}
        processing={processing}
        mode="create"
      />
    </Card>
  );
};

export default PersonalMoodboardWidget;