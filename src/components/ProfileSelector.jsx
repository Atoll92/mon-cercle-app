import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Avatar,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Container,
  Fade,
  Grow
} from '@mui/material';
import {
  Groups as GroupsIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useProfile } from '../context/profileContext';
import { useNavigate } from 'react-router-dom';

const ProfileSelector = ({ onProfileSelected }) => {
  const navigate = useNavigate();
  const { 
    userProfiles, 
    isLoadingProfiles, 
    profileError, 
    setActiveProfile,
    activeProfile 
  } = useProfile();
  
  const [selectedProfileId, setSelectedProfileId] = useState(activeProfile?.id || null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleProfileSelect = (profile) => {
    setSelectedProfileId(profile.id);
  };

  const handleContinue = async () => {
    if (!selectedProfileId) return;
    
    setIsSelecting(true);
    const profile = userProfiles.find(p => p.id === selectedProfileId);
    
    if (profile) {
      const result = await setActiveProfile(profile);
      
      if (result.success) {
        if (onProfileSelected) {
          onProfileSelected(profile);
        } else {
          // Navigate to dashboard by default
          navigate('/dashboard');
        }
      } else {
        console.error('Failed to set active profile:', result.error);
      }
    }
    
    setIsSelecting(false);
  };

  const handleCreateNewProfile = () => {
    navigate('/create-network');
  };

  if (isLoadingProfiles) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (profileError) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error" sx={{ mt: 4 }}>
          Error loading profiles: {profileError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Fade in timeout={600}>
        <Box sx={{ py: 4 }}>
          <Typography 
            variant="h4" 
            align="center" 
            gutterBottom 
            sx={{ mb: 4, fontWeight: 600 }}
          >
            Choose Your Profile
          </Typography>
          
          <Typography 
            variant="body1" 
            align="center" 
            color="text.secondary" 
            sx={{ mb: 4 }}
          >
            Select which network profile you'd like to use
          </Typography>

          <Grid container spacing={3}>
            {userProfiles.map((profile, index) => (
              <Grow 
                key={profile.id} 
                in 
                timeout={800 + index * 100}
                style={{ transformOrigin: '0 0 0' }}
              >
                <Grid item xs={12} sm={6} md={4}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      border: selectedProfileId === profile.id ? 2 : 1,
                      borderColor: selectedProfileId === profile.id 
                        ? 'primary.main' 
                        : 'divider',
                      transform: selectedProfileId === profile.id 
                        ? 'scale(1.02)' 
                        : 'scale(1)',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleProfileSelect(profile)}
                      sx={{ height: '100%' }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        {selectedProfileId === profile.id && (
                          <CheckCircleIcon 
                            sx={{ 
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              color: 'primary.main'
                            }}
                          />
                        )}
                        
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Avatar
                            src={profile.profile_picture_url}
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              mb: 2,
                              bgcolor: profile.network?.theme_color || 'primary.main'
                            }}
                          >
                            {profile.full_name?.charAt(0)}
                          </Avatar>
                          
                          <Typography variant="h6" gutterBottom align="center">
                            {profile.full_name}
                          </Typography>
                          
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <GroupsIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {profile.network?.name}
                            </Typography>
                          </Box>
                          
                          <Chip
                            label={profile.role}
                            size="small"
                            color={profile.role === 'admin' ? 'primary' : 'default'}
                            sx={{ mb: 1 }}
                          />
                          
                          {profile.bio && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              align="center"
                              sx={{ 
                                mt: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {profile.bio}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grow>
            ))}
            
            {/* Add new profile card */}
            <Grow 
              in 
              timeout={800 + userProfiles.length * 100}
              style={{ transformOrigin: '0 0 0' }}
            >
              <Grid item xs={12} sm={6} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: 1,
                    borderColor: 'divider',
                    borderStyle: 'dashed',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 2
                    }
                  }}
                >
                  <CardActionArea
                    onClick={handleCreateNewProfile}
                    sx={{ 
                      height: '100%',
                      minHeight: 250,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <AddIcon sx={{ fontSize: 48, color: 'action.main', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Join New Network
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grow>
          </Grid>

          <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              disabled={!selectedProfileId || isSelecting}
              sx={{ 
                minWidth: 200,
                py: 1.5
              }}
            >
              {isSelecting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Continue'
              )}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Container>
  );
};

export default ProfileSelector;