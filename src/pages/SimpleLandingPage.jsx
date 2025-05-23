import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Stack,
  Chip,
  Avatar,
  AvatarGroup,
  useMediaQuery,
  useTheme,
  alpha,
  Fade,
  Zoom
} from '@mui/material';
import ThreeJSBackground from '../components/ThreeJSBackground';
import {
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Palette as PaletteIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  GroupAdd as GroupAddIcon,
  Chat as ChatIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  CloudUpload as CloudUploadIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const SimpleLandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Sample user avatars for the preview
  const sampleUsers = [
    { name: 'Alice', avatar: '/api/placeholder/32/32' },
    { name: 'Bob', avatar: '/api/placeholder/32/32' },
    { name: 'Carol', avatar: '/api/placeholder/32/32' },
    { name: 'David', avatar: '/api/placeholder/32/32' },
    { name: 'Eve', avatar: '/api/placeholder/32/32' }
  ];

  const features = [
    {
      id: 'simple',
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      title: 'Simply Powerful',
      description: 'Set up in minutes, not hours. Intuitive design that anyone can master without training.',
      color: theme.palette.primary.main
    },
    {
      id: 'secret',
      icon: <LockIcon sx={{ fontSize: 40 }} />,
      title: 'Your Secret Circle',
      description: 'Invite-only networks. Your conversations, files, and creativity stay within your trusted circle.',
      color: theme.palette.success.main
    },
    {
      id: 'customizable',
      icon: <PaletteIcon sx={{ fontSize: 40 }} />,
      title: 'Make It Yours',
      description: 'Your brand, your colors, your design. Customize everything to match your vision.',
      color: theme.palette.secondary.main
    },
    {
      id: 'creative',
      icon: <ImageIcon sx={{ fontSize: 40 }} />,
      title: 'Visual Collaboration',
      description: 'Moodboards, wikis, and portfolios. Express ideas visually with your team.',
      color: theme.palette.error.main
    }
  ];

  const useCases = [
    { title: 'Creative Teams', icon: <PaletteIcon />, users: '50+ members' },
    { title: 'Family Networks', icon: <GroupAddIcon />, users: '10-20 members' },
    { title: 'Student Groups', icon: <DescriptionIcon />, users: '25+ members' },
    { title: 'Professional Communities', icon: <SecurityIcon />, users: '100+ members' }
  ];

  const tools = [
    { name: 'Moodboards', icon: <ImageIcon />, description: 'Visual collaboration' },
    { name: 'Secure Chat', icon: <ChatIcon />, description: 'Private messaging' },
    { name: 'File Sharing', icon: <CloudUploadIcon />, description: 'Safe document sharing' },
    { name: 'Event Planning', icon: <EventIcon />, description: 'Organize gatherings' },
    { name: 'Wiki Pages', icon: <DescriptionIcon />, description: 'Knowledge sharing' },
    { name: 'Member Profiles', icon: <GroupAddIcon />, description: 'Professional portfolios' }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Three.js Background */}
      <ThreeJSBackground />
      
      {/* Overlay for better text readability */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.background.default, 0.85)} 0%, 
            ${alpha(theme.palette.background.default, 0.75)} 50%, 
            ${alpha(theme.palette.background.default, 0.85)} 100%)`,
          backdropFilter: 'blur(1px)',
          zIndex: 1
        }}
      />

      {/* Navigation */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            Conclav
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button 
              component={RouterLink} 
              to="/login" 
              variant="outlined"
              size="small"
            >
              Sign In
            </Button>
            <Button 
              component={RouterLink} 
              to="/signup" 
              variant="contained"
              size="small"
            >
              Get Started
            </Button>
          </Stack>
        </Box>
      </Container>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
          <Fade in timeout={1000}>
            <Typography 
              variant={isMobile ? "h3" : "h1"} 
              sx={{ 
                fontWeight: 900,
                mb: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Your Network,
              <br />
              Your Way
            </Typography>
          </Fade>

          <Fade in timeout={1200}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4, 
                color: theme.palette.text.secondary,
                maxWidth: 600,
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              Build and customize your perfect private community with simple setup. Complete control over design, privacy, and collaboration—exactly as you envision it.
            </Typography>
          </Fade>

          <Zoom in timeout={1400}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mb: 6 }}
            >
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`
                  },
                  transition: 'all 0.3s ease'
                }}
                endIcon={<ArrowForwardIcon />}
              >
                Create Your Circle
              </Button>
              <Button
                component={RouterLink}
                to="/demo"
                variant="outlined"
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                See Demo
              </Button>
            </Stack>
          </Zoom>

          {/* Social Proof */}
          <Fade in timeout={1600}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
              <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                {sampleUsers.map((user, index) => (
                  <Avatar key={index} alt={user.name} sx={{ bgcolor: theme.palette.primary.light }}>
                    {user.name[0]}
                  </Avatar>
                ))}
              </AvatarGroup>
              <Typography variant="body2" color="text.secondary">
                Join 1,000+ networks already building in private
              </Typography>
            </Box>
          </Fade>
        </Box>
      </Container>

      {/* Core Features */}
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, pb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Why Choose Simple?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Four pillars that make your network work
          </Typography>
        </Box>
        
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mb: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} lg={3} key={feature.id}>
              <Zoom in timeout={800 + index * 200}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: { xs: 3, md: 4 },
                    border: `2px solid transparent`,
                    background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${alpha(feature.color, 0.2)}, ${alpha(feature.color, 0.05)}) border-box`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, ${alpha(feature.color, 0.03)}, transparent)`,
                      opacity: hoveredFeature === feature.id ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                      borderRadius: 3
                    },
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: `0 20px 60px ${alpha(feature.color, 0.15)}, 0 8px 20px ${alpha(feature.color, 0.1)}`,
                      border: `2px solid ${alpha(feature.color, 0.2)}`
                    }
                  }}
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <Box 
                    sx={{ 
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <Box 
                      sx={{ 
                        color: feature.color, 
                        mb: 3,
                        p: 2,
                        borderRadius: '50%',
                        backgroundColor: alpha(feature.color, 0.08),
                        transition: 'all 0.3s ease',
                        transform: hoveredFeature === feature.id ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 2,
                        color: theme.palette.text.primary,
                        fontSize: { xs: '1.25rem', md: '1.4rem' }
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.6,
                        fontSize: { xs: '0.95rem', md: '1rem' },
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Use Cases */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.98)}, ${alpha(theme.palette.primary.main, 0.02)})`,
          py: { xs: 6, md: 10 },
          position: 'relative',
          zIndex: 2 
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography 
              variant="h3" 
              sx={{ 
                mb: 3, 
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Perfect For Every Circle
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              From intimate family groups to thriving creative communities
            </Typography>
          </Box>
          
          <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
            {useCases.map((useCase, index) => (
              <Grid item xs={12} sm={6} lg={3} key={index}>
                <Card 
                  elevation={0}
                  sx={{ 
                    p: { xs: 3, md: 4 }, 
                    textAlign: 'center',
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                    borderRadius: 3,
                    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.12)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      color: theme.palette.primary.main, 
                      mb: 3,
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {React.cloneElement(useCase.icon, { sx: { fontSize: 32 } })}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: '1.3rem' }}>
                    {useCase.title}
                  </Typography>
                  <Chip 
                    label={useCase.users} 
                    size="medium" 
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      border: 'none'
                    }}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Tools Overview */}
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Everything You Need
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            All the tools for private collaboration, beautifully simple
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ maxWidth: 1000, mx: 'auto' }}>
          {tools.map((tool, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Zoom in timeout={600 + index * 100}>
                <Card 
                  elevation={0}
                  sx={{ 
                    p: { xs: 3, md: 3.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 2,
                    height: '100%',
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      borderColor: alpha(theme.palette.primary.main, 0.15),
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.08)}`
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      color: theme.palette.primary.main,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    }}
                  >
                    {React.cloneElement(tool.icon, { sx: { fontSize: 26 } })}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        fontSize: '1.1rem',
                        color: theme.palette.text.primary
                      }}
                    >
                      {tool.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        lineHeight: 1.5,
                        fontSize: '0.9rem'
                      }}
                    >
                      {tool.description}
                    </Typography>
                  </Box>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Security Promise */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.secondary.main, 0.03)})`,
          py: { xs: 6, md: 10 },
          position: 'relative',
          zIndex: 2
        }}
      >
        <Container maxWidth="lg">
          <Card 
            elevation={0}
            sx={{ 
              p: { xs: 4, md: 8 }, 
              textAlign: 'center',
              background: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))`,
              backdropFilter: 'blur(20px)',
              border: `2px solid ${alpha(theme.palette.primary.main, 0.08)}`,
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `conic-gradient(from 0deg at 50% 50%, ${alpha(theme.palette.primary.main, 0.1)}, transparent, ${alpha(theme.palette.secondary.main, 0.1)}, transparent)`,
                opacity: 0.3
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box 
                sx={{ 
                  color: theme.palette.primary.main, 
                  mb: 4,
                  p: 3,
                  borderRadius: '50%',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 72 }} />
              </Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 4,
                  background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: { xs: '2rem', md: '2.5rem' }
                }}
              >
                Complexity-Free Collaboration
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  mb: 6, 
                  maxWidth: 700, 
                  mx: 'auto',
                  lineHeight: 1.6,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                Everything you need, nothing you don't. Clean interfaces and smart defaults that just work.
              </Typography>
              
              <Grid container spacing={4} justifyContent="center" sx={{ maxWidth: 800, mx: 'auto' }}>
                {[
                  { text: 'Setup in 2 Minutes', icon: '⚡' },
                  { text: 'Zero Learning Curve', icon: '🎯' },
                  { text: 'Works Out of the Box', icon: '✨' }
                ].map((item, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Box 
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`
                      }}
                    >
                      <Typography 
                        sx={{ 
                          fontSize: '2rem',
                          mb: 1,
                          display: 'block'
                        }}
                      >
                        {item.icon}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: theme.palette.primary.main,
                          fontSize: { xs: '1rem', md: '1.1rem' }
                        }}
                      >
                        {item.text}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Card>
        </Container>
      </Box>

      {/* Final CTA */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: { xs: 8, md: 12 } }}>
        <Box 
          sx={{ 
            textAlign: 'center',
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`
          }}
        >
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Ready to Keep It Simple?
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              mb: 6,
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}
          >
            Launch your private network in under 2 minutes. No setup headaches, no credit card required.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, justifyContent: 'center', alignItems: 'center' }}>
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              size="large"
              sx={{
                py: 2.5,
                px: 8,
                borderRadius: 50,
                fontSize: { xs: '1rem', md: '1.2rem' },
                fontWeight: 700,
                textTransform: 'none',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.4)}`,
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                },
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
              endIcon={<ArrowForwardIcon sx={{ ml: 1 }} />}
            >
              Start Building Your Network
            </Button>
            
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Free forever • No credit card needed
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* Simple Footer */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, pb: 4 }}>
        <Box sx={{ 
          textAlign: 'center', 
          pt: 4, 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` 
        }}>
          <Typography variant="body2" color="text.secondary">
            © 2024 Conclav. Built for privacy, designed for simplicity.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default SimpleLandingPage;