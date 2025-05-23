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
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, pb: 8 }}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={feature.id}>
              <Zoom in timeout={800 + index * 200}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    border: `1px solid ${alpha(feature.color, 0.1)}`,
                    backgroundColor: alpha(feature.color, 0.02),
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 16px 40px ${alpha(feature.color, 0.15)}`,
                      backgroundColor: alpha(feature.color, 0.05)
                    }
                  }}
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <Box sx={{ color: feature.color, mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Use Cases */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: 8 }}>
        <Typography 
          variant="h3" 
          textAlign="center" 
          sx={{ mb: 6, fontWeight: 700 }}
        >
          Perfect For
        </Typography>
        <Grid container spacing={3}>
          {useCases.map((useCase, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  height: '100%',
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                  {React.cloneElement(useCase.icon, { sx: { fontSize: 32 } })}
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  {useCase.title}
                </Typography>
                <Chip 
                  label={useCase.users} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Tools Overview */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Everything You Need
          </Typography>
          <Typography variant="h6" color="text.secondary">
            All the tools for private collaboration, beautifully simple
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {tools.map((tool, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.03),
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Box sx={{ color: theme.palette.primary.main }}>
                  {React.cloneElement(tool.icon, { sx: { fontSize: 24 } })}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {tool.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tool.description}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Security Promise */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: 8 }}>
        <Card 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          <Box sx={{ color: theme.palette.primary.main, mb: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 64 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            Complexity-Free Collaboration
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Everything you need, nothing you don't. Clean interfaces and smart defaults that just work.
          </Typography>
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                ✓ Setup in 2 Minutes
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                ✓ Zero Learning Curve
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                ✓ Works Out of the Box
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Container>

      {/* Final CTA */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
            Ready to Keep It Simple?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Launch your private network in under 2 minutes. No setup headaches, no credit card required.
          </Typography>
          
          <Button
            component={RouterLink}
            to="/signup"
            variant="contained"
            size="large"
            sx={{
              py: 2,
              px: 6,
              borderRadius: 4,
              fontSize: '1.1rem',
              fontWeight: 600,
              boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 16px 50px ${alpha(theme.palette.primary.main, 0.4)}`
              },
              transition: 'all 0.3s ease'
            }}
            endIcon={<ArrowForwardIcon />}
          >
            Start Building Your Network
          </Button>
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