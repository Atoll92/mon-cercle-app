import React from 'react';
import { Link } from 'react-router-dom';
import UserBadges from './UserBadges';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import {
  Mail as MailIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const MemberCard = ({ 
  member, 
  activeProfile, 
  darkMode = false, 
  onMemberSelect,
  isLastMember,
  lastMemberRef 
}) => {
  const theme = useTheme();
  
  // Theme colors
  const customLightText = theme.palette.custom?.lightText || (darkMode ? '#ffffff' : '#000000');
  const customFadedText = theme.palette.custom?.fadedText || (darkMode ? alpha('#ffffff', 0.7) : alpha('#000000', 0.7));
  const customBorder = theme.palette.custom?.border || (darkMode ? alpha('#ffffff', 0.12) : alpha('#000000', 0.12));
  
  // Extract social media links
  const socialMedia = {
    facebook: member.facebook_url || null,
    twitter: member.twitter_url || null,
    linkedin: member.linkedin_url || null,
    website: member.website_url || null
  };
  
  const hasSocialMedia = Object.values(socialMedia).some(url => url);
  
  return (
    <Box
      ref={isLastMember ? lastMemberRef : null}
      sx={{ width: '100%', height: '100%' }}
    >
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'visible',
          bgcolor: darkMode ? alpha('#1a1a1a', 0.8) : '#ffffff',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          border: `1px solid ${customBorder}`,
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
            boxShadow: darkMode 
              ? '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(66, 165, 245, 0.1)' 
              : '0 20px 40px rgba(0,0,0,0.08)',
            borderColor: darkMode ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.2),
            '& .member-avatar': {
              transform: 'scale(1.05)',
            },
            '& .hover-glow': {
              opacity: 1
            }
          }
        }}
        onClick={() => onMemberSelect && onMemberSelect(member)}
        elevation={0}
      >
        {/* Gradient background effect */}
        <Box
          className="hover-glow"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: member.role === 'admin' 
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 100%)`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            borderRadius: '16px 16px 0 0'
          }}
        />
        
        <CardContent 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            p: 3,
            pb: 2
          }}
        >
          {/* Profile Picture Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 2
          }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              {/* Role badge */}
              {member.role === 'admin' && (
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  badgeContent={
                    <Box sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${darkMode ? '#1a1a1a' : '#ffffff'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      <AdminIcon sx={{ fontSize: 16, color: '#ffffff' }} />
                    </Box>
                  }
                >
                  <Avatar
                    className="member-avatar"
                    src={member.profile_picture_url}
                    sx={{ 
                      width: 120, 
                      height: 120,
                      border: `3px solid ${member.role === 'admin' ? theme.palette.primary.main : customBorder}`,
                      boxShadow: darkMode 
                        ? '0 8px 24px rgba(0,0,0,0.5)' 
                        : '0 8px 24px rgba(0,0,0,0.1)',
                      transition: 'transform 0.3s ease',
                      fontSize: '2.5rem',
                      bgcolor: member.role === 'admin' 
                        ? alpha(theme.palette.primary.main, 0.1) 
                        : alpha(theme.palette.secondary.main, 0.1)
                    }}
                  >
                    {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                  </Avatar>
                </Badge>
              )}
              
              {member.role !== 'admin' && (
                <Avatar
                  className="member-avatar"
                  src={member.profile_picture_url}
                  sx={{ 
                    width: 120, 
                    height: 120,
                    border: `3px solid ${customBorder}`,
                    boxShadow: darkMode 
                      ? '0 8px 24px rgba(0,0,0,0.5)' 
                      : '0 8px 24px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease',
                    fontSize: '2.5rem',
                    bgcolor: alpha(theme.palette.secondary.main, 0.1)
                  }}
                >
                  {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                </Avatar>
              )}
              
              {/* Message button */}
              {member.id !== activeProfile?.id && (
                <Tooltip title="Send Message" placement="bottom">
                  <IconButton
                    component={Link}
                    to={`/messages/${member.id}`}
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      right: -8,
                      bgcolor: darkMode ? theme.palette.primary.dark : theme.palette.primary.main,
                      color: '#ffffff',
                      '&:hover': { 
                        bgcolor: darkMode ? theme.palette.primary.main : theme.palette.primary.dark,
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease',
                      width: 36,
                      height: 36,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  >
                    <MailIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            {/* Name */}
            <Typography 
              variant="h6" 
              component="h3"
              sx={{ 
                fontWeight: 700,
                color: customLightText,
                textAlign: 'center',
                mb: 0.5,
                fontSize: '1.1rem',
                letterSpacing: '-0.02em'
              }}
            >
              {member.full_name || 'Unnamed User'}
              {member.id === activeProfile?.id && (
                <Typography 
                  component="span" 
                  sx={{ 
                    ml: 1, 
                    fontSize: '0.75rem', 
                    color: theme.palette.primary.main,
                    fontWeight: 500
                  }}
                >
                  (You)
                </Typography>
              )}
            </Typography>
            
            {/* Role Chip */}
            <Chip
              icon={member.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
              label={member.role === 'admin' ? 'Admin' : 'Member'}
              size="small"
              sx={{
                mb: 1,
                bgcolor: member.role === 'admin' 
                  ? alpha(theme.palette.primary.main, darkMode ? 0.2 : 0.1)
                  : alpha(theme.palette.secondary.main, darkMode ? 0.2 : 0.1),
                color: member.role === 'admin' 
                  ? (darkMode ? theme.palette.primary.light : theme.palette.primary.main)
                  : (darkMode ? theme.palette.secondary.light : theme.palette.secondary.main),
                borderColor: member.role === 'admin' 
                  ? alpha(theme.palette.primary.main, 0.3)
                  : alpha(theme.palette.secondary.main, 0.3),
                border: '1px solid',
                fontWeight: 600,
                '& .MuiChip-icon': {
                  fontSize: '1rem'
                }
              }}
            />
          </Box>
          
          {/* Tagline */}
          {member.tagline && (
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                color: theme.palette.primary.main,
                textAlign: 'center',
                fontStyle: 'italic',
                mb: 2,
                px: 2,
                fontSize: '0.875rem',
                lineHeight: 1.4,
                minHeight: '1.2em'
              }}
            >
              "{member.tagline}"
            </Typography>
          )}
          
          {/* User Badges */}
          {member.badge_count > 0 && (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <UserBadges 
                userId={member.id} 
                displayMode="icons"
                maxDisplay={3}
                showTotal={true}
              />
            </Box>
          )}
          
          {/* Skills */}
          {member.skills && member.skills.length > 0 && (
            <Box sx={{ 
              mb: 2, 
              display: 'flex', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 0.75,
              minHeight: '32px'
            }}>
              {member.skills.slice(0, 4).map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  sx={{
                    fontSize: '0.75rem',
                    height: 24,
                    bgcolor: darkMode 
                      ? alpha('#42a5f5', 0.15) 
                      : alpha('#2196f3', 0.08),
                    color: darkMode ? '#90caf9' : '#1565c0',
                    border: `1px solid ${darkMode ? alpha('#42a5f5', 0.3) : alpha('#2196f3', 0.2)}`,
                    '& .MuiChip-label': {
                      px: 1.5,
                      fontWeight: 500
                    },
                    '&:hover': {
                      bgcolor: darkMode 
                        ? alpha('#42a5f5', 0.25) 
                        : alpha('#2196f3', 0.15),
                    }
                  }}
                />
              ))}
              {member.skills.length > 4 && (
                <Tooltip title={member.skills.slice(4).join(', ')}>
                  <Chip
                    label={`+${member.skills.length - 4}`}
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      height: 24,
                      bgcolor: darkMode 
                        ? alpha('#ab47bc', 0.15) 
                        : alpha('#9c27b0', 0.08),
                      color: darkMode ? '#ce93d8' : '#6a1b9a',
                      border: `1px solid ${darkMode ? alpha('#ab47bc', 0.3) : alpha('#9c27b0', 0.2)}`,
                      fontWeight: 700,
                      '& .MuiChip-label': {
                        px: 1.5
                      }
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          )}
          
          {/* Bio */}
          <Box sx={{ 
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '80px',
            mb: hasSocialMedia ? 1 : 0
          }}>
            <Typography 
              variant="body2" 
              color={customFadedText} 
              align="center" 
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.6,
                fontSize: '0.875rem',
                px: 1,
                fontStyle: member.bio ? 'normal' : 'italic'
              }}
            >
              {member.bio || 'No bio available'}
            </Typography>
          </Box>
          
          {/* Social Media Links */}
          {hasSocialMedia && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 1,
              pt: 2,
              borderTop: `1px solid ${customBorder}`,
              mt: 'auto'
            }}>
              {socialMedia.facebook && (
                <Tooltip title="Facebook">
                  <IconButton 
                    size="small" 
                    component="a" 
                    href={socialMedia.facebook} 
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ 
                      bgcolor: darkMode ? alpha('#1877f2', 0.15) : alpha('#1877f2', 0.08),
                      color: '#1877f2',
                      '&:hover': { 
                        bgcolor: darkMode ? alpha('#1877f2', 0.25) : alpha('#1877f2', 0.15),
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FacebookIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {socialMedia.twitter && (
                <Tooltip title="Twitter">
                  <IconButton 
                    size="small" 
                    component="a" 
                    href={socialMedia.twitter} 
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ 
                      bgcolor: darkMode ? alpha('#1DA1F2', 0.15) : alpha('#1DA1F2', 0.08),
                      color: '#1DA1F2',
                      '&:hover': { 
                        bgcolor: darkMode ? alpha('#1DA1F2', 0.25) : alpha('#1DA1F2', 0.15),
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <TwitterIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {socialMedia.linkedin && (
                <Tooltip title="LinkedIn">
                  <IconButton 
                    size="small" 
                    component="a" 
                    href={socialMedia.linkedin} 
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ 
                      bgcolor: darkMode ? alpha('#0A66C2', 0.15) : alpha('#0A66C2', 0.08),
                      color: '#0A66C2',
                      '&:hover': { 
                        bgcolor: darkMode ? alpha('#0A66C2', 0.25) : alpha('#0A66C2', 0.15),
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <LinkedInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {socialMedia.website && (
                <Tooltip title="Website">
                  <IconButton 
                    size="small" 
                    component="a" 
                    href={socialMedia.website} 
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ 
                      bgcolor: darkMode ? alpha('#00c853', 0.15) : alpha('#00c853', 0.08),
                      color: '#00c853',
                      '&:hover': { 
                        bgcolor: darkMode ? alpha('#00c853', 0.25) : alpha('#00c853', 0.15),
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <LanguageIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MemberCard;