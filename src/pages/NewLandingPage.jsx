// NewLandingPage.jsx - Conceptual Outline for a simple and convincing landing page
// Retargeted for Network Creators of Private Micro Social Networks, with functionalities listed.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Stack,
  useTheme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardMedia,
  CardContent,
  Tabs,
  Tab,
  Fade,
  Paper,
  alpha,
  Zoom,
  useMediaQuery,
} from '@mui/material';
import {
  Shield,
  Euro,
  Block,
  CheckCircle,
  ArrowForward,
  Warning,
  Groups,
  Handshake,
  AdminPanelSettings,
  Settings,
  PersonAdd,
  Message,
  AccountCircle,
  Visibility,
  Lock,
  Category,
  AddPhotoAlternate,
  Event,
  Notifications,
  Dashboard,
  ReportProblem,
  Gavel,
  BarChart,
  DataUsage,
  Campaign,
  Forum,
  FolderShared,
  Description,
  GroupWork,
  SupervisedUserCircle,
  ManageAccounts,
  Palette, // Added for the new customization card icon
} from '@mui/icons-material';

// Import screenshots
import socialWallImg from '../assets/screenshots/socialwall.png';
import wikiImg from '../assets/screenshots/wiki.png';
import filesSharingImg from '../assets/screenshots/filessharing.png';
import eventsImg from '../assets/screenshots/events.png';
import chatImg from '../assets/screenshots/chat.png';
import membersImg from '../assets/screenshots/members.png';
import moderationImg from '../assets/screenshots/moderation.png';

// Import Three.js background for visual consistency
import ThreeJSBackground from '../components/ThreeJSBackground';

const NewLandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);

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
          zIndex: 1,
          height: '100%',
        }}
      />

      {/* Main Content Wrapper */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {/* 1. Hero Section: Direct, Creator-Focused Headline */}
        <Box
          sx={{
            py: { xs: 8, md: 12 },
            textAlign: 'center',
            background: 'transparent',
            position: 'relative',
          }}
        >
          <Container maxWidth="md">
            <Fade in timeout={1000}>
              <Typography
                variant={isMobile ? "h3" : "h2"}
                component="h1"
                gutterBottom
                sx={{ 
                  fontWeight: 900,
                  mb: 3,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2
                }}
              >
                Empower Your Community. <br /> Create Your Own Private Network.
              </Typography>
            </Fade>
            
            <Fade in timeout={1200}>
              <Typography
                variant="h5"
                sx={{ 
                  mb: 4, 
                  color: theme.palette.text.secondary,
                  maxWidth: 800,
                  mx: 'auto',
                  fontWeight: 400,
                  lineHeight: 1.6
                }}
              >
                Tired of mainstream platforms dictating your community's rules and monetizing its data? Build a dedicated, private space, fully under your control.
              </Typography>
            </Fade>
            
            <Zoom in timeout={1400}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/signup')}
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
                >
                  Start Building Your Network
                </Button>
                <Button
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
                  onClick={() => navigate('/demo')}
                  >
                  How It Works for Creators
                </Button>
              </Stack>
            </Zoom>
          </Container>
        </Box>

        {/* 2. Problem Section: The "Challenges" for Community Builders on Mainstream Platforms */}
        <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: alpha(theme.palette.background.paper, 0.8) }}>
          <Container maxWidth="lg">
            <Fade in timeout={1600}>
              <Typography variant="h3" align="center" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
                The Limitations of Generic Social Platforms for Your Community
              </Typography>
            </Fade>
            <Fade in timeout={1700}>
              <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6, maxWidth: 700, mx: 'auto' }}>
                Mainstream platforms prioritize their growth over your community's needs
              </Typography>
            </Fade>
            <Grid container spacing={4} justifyContent="center">
              {[
                {
                  icon: <DataUsage sx={{ fontSize: 60 }} />,
                  color: theme.palette.error.main,
                  title: 'Loss of Control & Data Ownership',
                  description: 'Your community\'s data is a valuable asset. On mainstream platforms, it\'s harvested, analyzed, and monetized by others, leaving you with no control or direct insight.',
                  delay: 1800
                },
                {
                  icon: <Campaign sx={{ fontSize: 60 }} />,
                  color: theme.palette.warning.main,
                  title: 'Algorithmic Interference & Distractions',
                  description: 'Ads, irrelevant content, and opaque algorithms stifle genuine interaction. Your community\'s messages get lost, and engagement suffers from constant external noise.',
                  delay: 1900
                },
                {
                  icon: <Warning sx={{ fontSize: 60 }} />,
                  color: theme.palette.info.main,
                  title: 'Compromised Trust & Brand Consistency',
                  description: 'Building trust is paramount for any community. When your interactions happen on platforms known for privacy breaches and misinformation, your brand\'s integrity is at risk.',
                  delay: 2000
                }
              ].map((problem, index) => (
                <Grid item key={index}>
                  <Zoom in timeout={problem.delay}>
                    <Card
                      elevation={0}
                      sx={{
                        width: { xs: '100%', sm: 350 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 4,
                        textAlign: 'center',
                        border: `2px solid transparent`,
                        background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${alpha(problem.color, 0.2)}, ${alpha(problem.color, 0.05)}) border-box`,
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
                          background: `linear-gradient(135deg, ${alpha(problem.color, 0.03)}, transparent)`,
                          opacity: hoveredCard === index ? 1 : 0,
                          transition: 'opacity 0.3s ease',
                          borderRadius: 3
                        },
                        '&:hover': {
                          transform: 'translateY(-12px) scale(1.02)',
                          boxShadow: `0 20px 60px ${alpha(problem.color, 0.15)}, 0 8px 20px ${alpha(problem.color, 0.1)}`,
                          border: `2px solid ${alpha(problem.color, 0.2)}`
                        }
                      }}
                      onMouseEnter={() => setHoveredCard(index)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <Box 
                        sx={{ 
                          mb: 3,
                          color: problem.color,
                          transform: hoveredCard === index ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        {problem.icon}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                          {problem.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {problem.description}
                        </Typography>
                      </Box>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* 3. Solution Section: Your Platform's Unique Value Proposition for Creators */}
        <Box sx={{ py: { xs: 8, md: 10 }, background: 'transparent' }}>
          <Container maxWidth="lg">
            <Fade in timeout={2100}>
              <Typography variant="h3" align="center" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
                The Solution: Your Dedicated, Private Social Network
              </Typography>
            </Fade>
            <Fade in timeout={2200}>
              <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 8, maxWidth: 700, mx: 'auto' }}>
                Everything you need to build, grow, and monetize your community
              </Typography>
            </Fade>
          <Grid container spacing={4} justifyContent="center" sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {/* Solution 1: Empowering Ownership & Uncompromised Privacy */}
              <Grid item>
                <Zoom in timeout={2300}>
                  <Card
                    elevation={0}
                    sx={{
                      width: { xs: '100%', sm: 380 },
                      minHeight: 450,
                      display: 'flex',
                      flexDirection: 'column',
                      p: 4,
                      background: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      {/* Using Shield icon to represent both control and privacy */}
                      <Shield sx={{ fontSize: 60, color: theme.palette.primary.main }} />
                    </Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                      Empowering Ownership & Uncompromised Privacy
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', lineHeight: 1.6 }}>
                      Gain full control over your network's data, content, and rules. Our platform ensures your community's privacy by design, with no ads, tracking, or data exploitation.
                    </Typography>
                    <List sx={{ mt: 'auto' }}>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <ManageAccounts fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Comprehensive Network Management"
                          secondary="General settings, member roles, content moderation"
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <DataUsage fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Absolute Data Sovereignty"
                          secondary="You own your data, hosted within the EU"
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Euro fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="GDPR Compliant by Design"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Block fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Ad-free & Tracking-free Environment"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    </List>
                  </Card>
                </Zoom>
              </Grid>

              {/* Solution 2: Flexible Customization & Brand Identity */}
              <Grid item>
                <Zoom in timeout={2400}>
                  <Card
                    elevation={0}
                    sx={{
                      width: { xs: '100%', sm: 380 },
                      minHeight: 450,
                      display: 'flex',
                      flexDirection: 'column',
                      p: 4,
                      background: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${alpha(theme.palette.success.main, 0.15)}`,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      {/* Using Settings icon for customization */}
                      <Settings sx={{ fontSize: 60, color: theme.palette.success.main }} />
                    </Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                      Flexible Customization & Brand Identity
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', lineHeight: 1.6 }}>
                      Tailor every aspect of your network to reflect your brand and community's unique identity, fostering a strong and recognizable online presence.
                    </Typography>
                    <List sx={{ mt: 'auto' }}>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Palette fontSize="small" color="success" /> {/* Using Palette for visual customization */}
                        </ListItemIcon>
                        <ListItemText
                          primary="Personalized Branding & Themes"
                          secondary="Logo, colors, layout, and visual styles"
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <AccountCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Customizable Member Profiles"
                          secondary="Define fields and profile visibility"
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <SupervisedUserCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Granular Role-Based Permissions"
                          secondary="Define what each user role can access and do"
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Category fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Themed Content Categories"
                          secondary="Organize discussions, wikis, and files with custom labels"
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    </List>
                  </Card>
                </Zoom>
              </Grid>

              {/* Solution 3: Foster Deeper Engagement & Authentic Connections (UNCHANGED) */}
              <Grid item>
                <Zoom in timeout={2500}>
                  <Card
                    elevation={0}
                    sx={{
                      width: { xs: '100%', sm: 380 },
                      minHeight: 450,
                      display: 'flex',
                      flexDirection: 'column',
                      p: 4,
                      background: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${alpha(theme.palette.secondary.main, 0.15)}`,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Groups sx={{ fontSize: 60, color: theme.palette.secondary.main }} />
                    </Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                      Foster Authentic Community & Engagement
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', lineHeight: 1.6 }}>
                      Provide a clean, focused environment free from distractions. Empower your members to connect genuinely, fostering stronger bonds and more meaningful interactions.
                    </Typography>
                    <List sx={{ mt: 'auto' }}>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Message fontSize="small" color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Direct Messaging & Group Chat"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <AddPhotoAlternate fontSize="small" color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Rich Media Posts"
                          secondary="Text, images, and videos"
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Event fontSize="small" color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Event Creation & Management"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Notifications fontSize="small" color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Activity Feed & Notifications"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <AccountCircle fontSize="small" color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Customizable User Profiles"
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Category fontSize="small" color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Content Organization"
                          secondary="Categories, topics, and wikis"
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    </List>
                  </Card>
                </Zoom>
              </Grid>
          </Grid>
        </Container>
      </Box>

        {/* 4. Features Showcase with Screenshots */}
        <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: alpha(theme.palette.background.paper, 0.8) }}>
          <Container maxWidth="lg">
            <Fade in timeout={2600}>
              <Typography variant="h3" align="center" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
                See Your Platform in Action
              </Typography>
            </Fade>
            <Fade in timeout={2700}>
              <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6, maxWidth: 700, mx: 'auto' }}>
                Explore the powerful features that will help you build and manage your private community
              </Typography>
            </Fade>

            {/* Tabs for different feature categories */}
            <Fade in timeout={2800}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  centered
                  sx={{
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      '&.Mui-selected': {
                        fontWeight: 600
                      }
                    }
                  }}
                >
              <Tab label="Social Wall" icon={<Forum />} iconPosition="start" />
              <Tab label="Wiki & Knowledge" icon={<Description />} iconPosition="start" />
              <Tab label="File Sharing" icon={<FolderShared />} iconPosition="start" />
              <Tab label="Events" icon={<Event />} iconPosition="start" />
              <Tab label="Chat" icon={<Message />} iconPosition="start" />
              <Tab label="Members" icon={<Groups />} iconPosition="start" />
                  <Tab label="Admin Tools" icon={<AdminPanelSettings />} iconPosition="start" />
                </Tabs>
              </Box>
            </Fade>

          {/* Tab Panels */}
          <Box sx={{ minHeight: 500 }}>
            {/* Social Wall Tab */}
            <Fade in={activeTab === 0} timeout={500}>
              <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card 
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 15px 40px ${alpha(theme.palette.common.black, 0.15)}`
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={socialWallImg}
                        alt="Social Wall Feature"
                        sx={{ width: '100%', height: 'auto' }}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Dynamic Social Wall
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Create a vibrant community hub where members can share updates, photos, videos, and engage with each other's content.
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Rich media posts with images and videos" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Like, comment, and share functionality" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Real-time updates and notifications" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Content moderation tools" />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Box>
            </Fade>

            {/* Wiki Tab */}
            <Fade in={activeTab === 1} timeout={500}>
              <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card 
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 15px 40px ${alpha(theme.palette.common.black, 0.15)}`
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={wikiImg}
                        alt="Wiki Feature"
                        sx={{ width: '100%', height: 'auto' }}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Collaborative Wiki System
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Build a comprehensive knowledge base for your community. Perfect for documentation, guides, FAQs, and shared resources.
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Easy-to-use wiki editor with rich formatting" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Version control and revision history" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Categories and tags for organization" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Search functionality across all pages" />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Box>
            </Fade>

            {/* File Sharing Tab */}
            <Fade in={activeTab === 2} timeout={500}>
              <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card 
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 15px 40px ${alpha(theme.palette.common.black, 0.15)}`
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={filesSharingImg}
                        alt="File Sharing Feature"
                        sx={{ width: '100%', height: 'auto' }}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Secure File Sharing
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Share documents, images, and resources securely within your community. Control access and track downloads.
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Drag-and-drop file uploads" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Folder organization and search" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Download tracking and analytics" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Up to 5TB storage capacity" />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Box>
            </Fade>

            {/* Events Tab */}
            <Fade in={activeTab === 3} timeout={500}>
              <Box sx={{ display: activeTab === 3 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card 
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 15px 40px ${alpha(theme.palette.common.black, 0.15)}`
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={eventsImg}
                        alt="Events Feature"
                        sx={{ width: '100%', height: 'auto' }}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Event Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Organize and promote events within your community. From workshops to meetups, manage everything in one place.
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Create and manage events with RSVP" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Calendar integration and reminders" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Location mapping and directions" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Attendee management and analytics" />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Box>
            </Fade>

            {/* Chat Tab */}
            <Fade in={activeTab === 4} timeout={500}>
              <Box sx={{ display: activeTab === 4 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card 
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 15px 40px ${alpha(theme.palette.common.black, 0.15)}`
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={chatImg}
                        alt="Chat Feature"
                        sx={{ width: '100%', height: 'auto' }}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Real-time Chat & Messaging
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Enable instant communication with group chat and direct messaging. Keep conversations organized and accessible.
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Real-time group chat with mentions" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Private direct messaging" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Media sharing in conversations" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Message history and search" />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Box>
            </Fade>

            {/* Members Tab */}
            <Fade in={activeTab === 5} timeout={500}>
              <Box sx={{ display: activeTab === 5 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card 
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 15px 40px ${alpha(theme.palette.common.black, 0.15)}`
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={membersImg}
                        alt="Members Feature"
                        sx={{ width: '100%', height: 'auto' }}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Member Directory & Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Build a thriving community with comprehensive member management tools and engagement features.
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Searchable member directory" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Custom member profiles and badges" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Role-based permissions" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Invitation system with tracking" />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Box>
            </Fade>

            {/* Admin Tools Tab */}
            <Fade in={activeTab === 6} timeout={500}>
              <Box sx={{ display: activeTab === 6 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card 
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 15px 40px ${alpha(theme.palette.common.black, 0.15)}`
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={moderationImg}
                        alt="Admin Tools Feature"
                        sx={{ width: '100%', height: 'auto' }}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Powerful Admin Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Take full control of your community with comprehensive administration and moderation tools.
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Content moderation and reporting" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Member management and permissions" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Analytics and engagement metrics" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                        <ListItemText primary="Customization and branding options" />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          </Box>

          {/* Additional Features Grid */}
          <Box sx={{ mt: 8 }}>
            <Fade in timeout={2900}>
              <Typography variant="h5" align="center" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
                And Much More...
              </Typography>
            </Fade>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Zoom in timeout={3000}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 10px 25px ${alpha(theme.palette.primary.main, 0.1)}`
                      }
                    }}
                  >
                  <GroupWork sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Polls & Surveys</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gather feedback and make decisions together with interactive polls
                  </Typography>
                  </Paper>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Zoom in timeout={3100}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 10px 25px ${alpha(theme.palette.primary.main, 0.1)}`
                      }
                    }}
                  >
                  <AddPhotoAlternate sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Moodboards</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create visual collections and inspiration boards for your community
                  </Typography>
                  </Paper>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Zoom in timeout={3200}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 10px 25px ${alpha(theme.palette.primary.main, 0.1)}`
                      }
                    }}
                  >
                    <Notifications sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Smart Notifications</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Keep members engaged with customizable email and in-app notifications
                    </Typography>
                  </Paper>
                </Zoom>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

        {/* 5. Call to Action Section (for Network Creators) */}
        <Box
          sx={{
            py: { xs: 8, md: 10 },
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 20%, rgba(33, 150, 243, 0.1), transparent 50%)',
              zIndex: 0
            }
          }}
        >
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
            <Fade in timeout={3000}>
              <Typography variant="h3" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
                Ready to Build the Social Network Your Community Deserves?
              </Typography>
            </Fade>
            <Fade in timeout={3100}>
              <Typography variant="h6" sx={{ mb: 5, color: theme.palette.text.secondary }}>
                Take back control and cultivate a thriving, private online space for your members.
              </Typography>
            </Fade>
            <Zoom in timeout={3200}>
              <Button
                variant="contained"
                size="large"
                color="primary"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/signup')}
                sx={{
                  py: 2,
                  px: 5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Launch Your Private Network Now
              </Button>
            </Zoom>
          </Container>
        </Box>

        {/* 6. Footer: Standard links */}
        <Box sx={{ 
          py: 6, 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)'
        }}>
          <Container maxWidth="lg">
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
            >
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} Conclav. Built with privacy in mind 🇫🇷
              </Typography>
              <Stack direction="row" spacing={3}>
                <Button
                  variant="text"
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: theme.palette.primary.main,
                      backgroundColor: 'transparent'
                    }
                  }}
                  onClick={() => navigate('/privacy')}
                >
                  Privacy Policy
                </Button>
                <Button
                  variant="text"
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: theme.palette.primary.main,
                      backgroundColor: 'transparent'
                    }
                  }}
                  onClick={() => navigate('/terms')}
                >
                  Terms of Service
                </Button>
                <Button
                  variant="text"
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: theme.palette.primary.main,
                      backgroundColor: 'transparent'
                    }
                  }}
                  onClick={() => navigate('/documentation')}
                >
                  Help Center
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default NewLandingPage;
