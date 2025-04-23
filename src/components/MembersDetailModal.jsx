import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
  Grid,
  alpha,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Mail as MailIcon,
  Language as LanguageIcon,
  LinkedIn as LinkedInIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  EventNote as EventNoteIcon,
  Label as LabelIcon
} from '@mui/icons-material';

const MemberDetailsModal = ({ 
  open, 
  onClose, 
  member, 
  isCurrentUser,
  darkMode = false
}) => {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPortfolioItems = async () => {
      if (!member || !open) return;

      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('profile_id', member.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setPortfolioItems(data || []);
      } catch (err) {
        console.error('Error fetching portfolio items:', err);
        setError('Failed to load portfolio items');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolioItems();
  }, [member, open]);

  if (!member) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: darkMode ? '#121212' : 'background.paper',
          backgroundImage: darkMode ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))' : 'none',
          boxShadow: 24,
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: darkMode ? alpha('#000', 0.3) : alpha('#f5f5f5', 0.5),
        color: darkMode ? 'white' : 'text.primary',
        borderBottom: '1px solid',
        borderColor: darkMode ? alpha('#fff', 0.1) : 'divider'
      }}>
        <Typography variant="h6" component="div">
          Member Profile
        </Typography>
        <IconButton 
          edge="end" 
          onClick={onClose} 
          aria-label="close"
          sx={{ color: darkMode ? 'white' : undefined }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent 
        dividers
        sx={{ 
          p: 0, 
          bgcolor: darkMode ? '#121212' : 'background.paper',
          color: darkMode ? 'white' : 'text.primary'
        }}
      >
        {/* Header with avatar and basic info */}
        <Box sx={{ 
          p: 3, 
          position: 'relative',
          bgcolor: darkMode ? alpha('#000', 0.2) : alpha('#f5f5f5', 0.5),
          borderBottom: '1px solid',
          borderColor: darkMode ? alpha('#fff', 0.1) : 'divider'
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm="auto" sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar
                src={member.profile_picture_url}
                sx={{ 
                  width: 120, 
                  height: 120,
                  border: `4px solid ${darkMode ? alpha('#fff', 0.2) : '#f0f0f0'}`,
                  boxShadow: darkMode ? '0 8px 16px rgba(0,0,0,0.5)' : '0 8px 16px rgba(0,0,0,0.1)'
                }}
              >
                {member.full_name ? member.full_name.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 60 }} />}
              </Avatar>
            </Grid>

            <Grid item xs={12} sm>
              <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {member.full_name || 'Unnamed User'}
                  {isCurrentUser && ' (You)'}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip 
                    label={member.role === 'admin' ? 'Admin' : 'Member'} 
                    color={member.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                    sx={{ 
                      bgcolor: darkMode ? 
                        (member.role === 'admin' ? alpha('#1976d2', 0.8) : alpha('#333', 0.8)) : 
                        undefined
                    }}
                  />
                  
                  {member.created_at && (
                    <Chip
                      icon={<EventNoteIcon fontSize="small" />}
                      label={`Joined: ${new Date(member.created_at).toLocaleDateString()}`}
                      size="small"
                      sx={{ 
                        bgcolor: darkMode ? alpha('#555', 0.8) : undefined,
                        color: darkMode ? 'white' : undefined
                      }}
                    />
                  )}
                </Box>
                
                {member.bio && (
                  <Typography 
                    variant="body1" 
                    paragraph
                    sx={{ 
                      color: darkMode ? alpha('white', 0.7) : 'text.secondary',
                      maxWidth: '600px'
                    }}
                  >
                    {member.bio}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm="auto">
              <Stack direction="column" spacing={1}>
                {!isCurrentUser && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<MailIcon />}
                    component={Link}
                    to={`/messages/${member.id}`}
                    fullWidth
                  >
                    Message
                  </Button>
                )}

                <Button
                  variant={darkMode ? "outlined" : "contained"}
                  color={darkMode ? "inherit" : "primary"}
                  component={Link}
                  to={`/profile/${member.id}`}
                  fullWidth
                  sx={{ 
                    color: darkMode ? 'white' : undefined,
                    borderColor: darkMode ? alpha('white', 0.3) : undefined,
                    '&:hover': {
                      borderColor: darkMode ? 'white' : undefined
                    }
                  }}
                >
                  Full Profile
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
        
        {/* Contact and Links */}
        {(member.contact_email || member.portfolio_url || member.linkedin_url) && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ 
                display: 'inline-flex', 
                mr: 1, 
                bgcolor: darkMode ? alpha('#1976d2', 0.2) : alpha('#1976d2', 0.1),
                color: darkMode ? '#90caf9' : '#1976d2',
                p: 0.5,
                borderRadius: '50%'
              }}>
                <MailIcon fontSize="small" />
              </Box>
              Contact & Links
            </Typography>
            
            <Grid container spacing={2} sx={{ ml: 1 }}>
              {member.contact_email && (
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: darkMode ? alpha('#000', 0.3) : alpha('#f5f5f5', 0.8),
                      border: '1px solid',
                      borderColor: darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1),
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: darkMode ? alpha('#000', 0.4) : alpha('#f5f5f5', 1)
                      }
                    }}
                  >
                    <MailIcon sx={{ mr: 1, color: darkMode ? '#90caf9' : '#1976d2' }} />
                    <Typography 
                      variant="body2" 
                      component="a" 
                      href={`mailto:${member.contact_email}`}
                      sx={{ 
                        textDecoration: 'none',
                        color: darkMode ? alpha('white', 0.9) : 'text.primary',
                        wordBreak: 'break-all'
                      }}
                    >
                      {member.contact_email}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {member.portfolio_url && (
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: darkMode ? alpha('#000', 0.3) : alpha('#f5f5f5', 0.8),
                      border: '1px solid',
                      borderColor: darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1),
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: darkMode ? alpha('#000', 0.4) : alpha('#f5f5f5', 1)
                      }
                    }}
                  >
                    <LanguageIcon sx={{ mr: 1, color: darkMode ? '#90caf9' : '#1976d2' }} />
                    <Typography 
                      variant="body2" 
                      component="a" 
                      href={member.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        textDecoration: 'none',
                        color: darkMode ? alpha('white', 0.9) : 'text.primary',
                        wordBreak: 'break-all'
                      }}
                    >
                      Portfolio Website
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {member.linkedin_url && (
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: darkMode ? alpha('#000', 0.3) : alpha('#f5f5f5', 0.8),
                      border: '1px solid',
                      borderColor: darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1),
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: darkMode ? alpha('#000', 0.4) : alpha('#f5f5f5', 1)
                      }
                    }}
                  >
                    <LinkedInIcon sx={{ mr: 1, color: darkMode ? '#90caf9' : '#1976d2' }} />
                    <Typography 
                      variant="body2" 
                      component="a" 
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        textDecoration: 'none',
                        color: darkMode ? alpha('white', 0.9) : 'text.primary',
                        wordBreak: 'break-all'
                      }}
                    >
                      LinkedIn Profile
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
        
        <Divider sx={{ mx: 3 }} />
        
        {/* Skills */}
        {member.skills && member.skills.length > 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ 
                display: 'inline-flex', 
                mr: 1, 
                bgcolor: darkMode ? alpha('#9c27b0', 0.2) : alpha('#9c27b0', 0.1),
                color: darkMode ? '#ce93d8' : '#9c27b0',
                p: 0.5,
                borderRadius: '50%'
              }}>
                <LabelIcon fontSize="small" />
              </Box>
              Skills & Expertise
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 1 }}>
              {member.skills.map((skill, index) => (
                <Chip 
                  key={`${skill}-${index}`} 
                  label={skill} 
                  sx={{ 
                    bgcolor: darkMode ? alpha('#9c27b0', 0.2) : alpha('#9c27b0', 0.1),
                    color: darkMode ? '#ce93d8' : '#9c27b0',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: darkMode ? alpha('#9c27b0', 0.3) : alpha('#9c27b0', 0.2),
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Portfolio preview */}
        <Divider sx={{ mx: 3 }} />
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{ 
              display: 'inline-flex', 
              mr: 1, 
              bgcolor: darkMode ? alpha('#ff9800', 0.2) : alpha('#ff9800', 0.1),
              color: darkMode ? '#ffb74d' : '#ff9800',
              p: 0.5,
              borderRadius: '50%'
            }}>
              <WorkIcon fontSize="small" />
            </Box>
            Portfolio Items {portfolioItems.length > 0 && `(${portfolioItems.length})`}
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : error ? (
            <Typography color="error" sx={{ p: 2 }}>
              {error}
            </Typography>
          ) : portfolioItems.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {portfolioItems.slice(0, 3).map(item => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: darkMode ? alpha('#000', 0.3) : 'background.paper',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      {item.image_url && (
                        <Box sx={{ 
                          width: '100%', 
                          height: 140, 
                          overflow: 'hidden'
                        }}>
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover'
                            }} 
                          />
                        </Box>
                      )}
                      
                      <Box sx={{ p: 2, flexGrow: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ fontWeight: 'medium' }}
                        >
                          {item.title}
                        </Typography>
                        
                        {item.description && (
                          <Typography 
                            variant="body2"
                            color={darkMode ? alpha('white', 0.7) : 'text.secondary'}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              mb: 1
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                      
                      {item.url && (
                        <Box sx={{ p: 1, pt: 0, borderTop: '1px solid', borderColor: darkMode ? alpha('#fff', 0.05) : 'divider' }}>
                          <Button
                            size="small"
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                              color: darkMode ? '#90caf9' : '#1976d2',
                              '&:hover': {
                                bgcolor: darkMode ? alpha('#1976d2', 0.1) : undefined
                              }
                            }}
                          >
                            View Project
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              
              {portfolioItems.length > 3 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    component={Link}
                    to={`/profile/${member.id}`}
                    color={darkMode ? "inherit" : "primary"}
                    sx={{ 
                      color: darkMode ? '#90caf9' : undefined 
                    }}
                  >
                    View All {portfolioItems.length} Portfolio Items
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography 
              variant="body2" 
              color={darkMode ? alpha('white', 0.5) : "text.secondary"}
              sx={{ p: 1, fontStyle: 'italic' }}
            >
              No portfolio items yet
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailsModal;