import { useState } from 'react';
import Spinner from './Spinner';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Avatar,
  Grid,
  Button,
  Alert,
  Container,
  Fade,
  Grow,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  CheckCircle as CheckCircleIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useProfile } from '../context/profileContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useTheme } from './ThemeProvider';

const NetworkSelector = ({ onProfileSelected }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { darkMode } = useTheme();
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


  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoadingProfiles) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
      >
        <Spinner />
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
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - 80px)',
        bgcolor: darkMode ? '#000000' : '#ffffff',
        position: 'relative'
      }}
    >
      <Container maxWidth="md">
        <Fade in timeout={600}>
          <Box sx={{ py: 4 }}>
          {/* Logout button in top right */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              onClick={handleLogout}
              color="inherit"
              size="large"
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary'
                }
              }}
            >
              <LogoutIcon /><Typography variant="button" sx={{ ml: 1 }}>Logout</Typography>
            </Button>
          </Box>
          
          <Typography 
            variant="h4" 
            align="center" 
            gutterBottom 
            sx={{ mb: 4, fontWeight: 600 }}
          >
            Choose Your Network
          </Typography>
          
          <Typography 
            variant="body1" 
            align="center" 
            color="text.secondary" 
            sx={{ mb: 4 }}
          >
            Select which network you'd like to access
          </Typography>

          <Grid container spacing={3} justifyContent="center">
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
                      height: 240,
                      width: 200,
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
                            src={profile.network?.logo_url}
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              mb: 2,
                              bgcolor: profile.network?.theme_color || 'primary.main'
                            }}
                          >
                            <GroupsIcon sx={{ fontSize: 40 }} />
                          </Avatar>
                          
                          <Typography variant="h6" gutterBottom align="center">
                            {profile.network?.name}
                          </Typography>
                          
                          {profile.network?.description && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              align="center"
                              sx={{ 
                                mb: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                minHeight: 60
                              }}
                            >
                              {profile.network.description}
                            </Typography>
                          )}
                          
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grow>
            ))}
            
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
                <Spinner size={24} color="inherit" />
              ) : (
                'Continue'
              )}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Container>
    </Box>
  );
};

export default NetworkSelector;