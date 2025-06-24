// NewLandingPage.jsx - Conceptual Outline for a simple and convincing landing page
// Retargeted for Network Creators of Private Micro Social Networks, with functionalities listed.

import React, { useState } from 'react';
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
} from '@mui/icons-material';

// Import screenshots
import socialWallImg from '../assets/screenshots/socialwall.png';
import wikiImg from '../assets/screenshots/wiki.png';
import filesSharingImg from '../assets/screenshots/filessharing.png';
import eventsImg from '../assets/screenshots/events.png';
import chatImg from '../assets/screenshots/chat.png';
import membersImg from '../assets/screenshots/members.png';
import moderationImg from '../assets/screenshots/moderation.png';

const NewLandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ flexGrow: 1 }}>

      {/* 1. Hero Section: Direct, Creator-Focused Headline */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          textAlign: 'center',
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Empower Your Community. <br /> Create Your Own Private Network.
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 4, opacity: 0.9 }}
          >
            Tired of mainstream platforms dictating your community's rules and monetizing its data? Build a dedicated, private space, fully under your control.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              color="secondary"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/signup')}
            >
              Start Building Your Network
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.7)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
              onClick={() => navigate('/demo')}
            >
              How It Works for Creators
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* 2. Problem Section: The "Challenges" for Community Builders on Mainstream Platforms */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: theme.palette.background.paper }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 6 }}>
            The Limitations of Generic Social Platforms for Your Community
          </Typography>
          <Grid container spacing={4} justifyContent="center" sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* Problem 1: Loss of Control & Data Ownership */}
            <Grid item>
              <Card
                sx={{
                  width: { xs: '100%', sm: 300 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 3,
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                <DataUsage color="error" sx={{ fontSize: 60, mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Loss of Control & Data Ownership
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your community's data is a valuable asset. On mainstream platforms, it's harvested, analyzed, and monetized by others, leaving you with no control or direct insight.
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Problem 2: Algorithmic Interference & Distractions */}
            <Grid item>
              <Card
                sx={{
                  width: { xs: '100%', sm: 300 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 3,
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                <Campaign color="warning" sx={{ fontSize: 60, mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Algorithmic Interference & Distractions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ads, irrelevant content, and opaque algorithms stifle genuine interaction. Your community's messages get lost, and engagement suffers from constant external noise.
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Problem 3: Compromised Trust & Brand Consistency */}
            <Grid item>
              <Card
                sx={{
                  width: { xs: '100%', sm: 300 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 3,
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                <Warning color="info" sx={{ fontSize: 60, mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Compromised Trust & Brand Consistency
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Building trust is paramount for any community. When your interactions happen on platforms known for privacy breaches and misinformation, your brand's integrity is at risk.
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. Solution Section: Your Platform's Unique Value Proposition for Creators */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: theme.palette.background.default }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 6 }}>
            The Solution: Your Dedicated, Private Social Network
          </Typography>
          <Grid container spacing={4} justifyContent="center" sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* Solution 1: Full Control & Ownership */}
            <Grid item>
              <Card
                sx={{
                  width: { xs: '100%', sm: 350 },
                  minHeight: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <AdminPanelSettings color="primary" sx={{ fontSize: 70 }} />
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                  Complete Control & Data Sovereignty
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                  You own your network, your data, and your rules. Customize everything from branding to moderation, ensuring a safe and tailored experience for your members.
                </Typography>
                <List sx={{ mt: 'auto' }}>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircle fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Network General Settings"
                      secondary="Name, description, logo, theme"
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Groups fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Member Management"
                      secondary="Invite, remove, manage roles"
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Gavel fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Content Moderation Tools"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <BarChart fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Network Analytics & Statistics"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Card>
            </Grid>

            {/* Solution 2: Privacy & Trust by Design (for your members) */}
            <Grid item>
              <Card
                sx={{
                  width: { xs: '100%', sm: 350 },
                  minHeight: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Shield color="primary" sx={{ fontSize: 70 }} />
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                  Built-in Privacy & GDPR Compliance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                  Attract and retain members with a platform designed for privacy. No ads, no tracking, no AI exploitation. Hosted entirely within the EU for maximum data protection.
                </Typography>
                <List sx={{ mt: 'auto' }}>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Lock fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Private Network Options"
                      secondary="Public, Private, Secret visibility"
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Block fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Ad-free & Tracking-free"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Euro fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="GDPR Compliant by Design"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Card>
            </Grid>

            {/* Solution 3: Foster Deeper Engagement & Authentic Connections */}
            <Grid item>
              <Card
                sx={{
                  width: { xs: '100%', sm: 350 },
                  minHeight: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Groups color="primary" sx={{ fontSize: 70 }} />
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                  Foster Authentic Community & Engagement
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                  Provide a clean, focused environment free from distractions. Empower your members to connect genuinely, fostering stronger bonds and more meaningful interactions.
                </Typography>
                <List sx={{ mt: 'auto' }}>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Message fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Direct Messaging & Group Chat"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AddPhotoAlternate fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Rich Media Posts"
                      secondary="Text, images, and videos"
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Event fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Event Creation & Management"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Notifications fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Activity Feed & Notifications"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AccountCircle fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Customizable User Profiles"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Category fontSize="small" color="primary" />
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
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 4. Features Showcase with Screenshots */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: theme.palette.background.paper }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 2 }}>
            See Your Platform in Action
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
            Explore the powerful features that will help you build and manage your private community
          </Typography>

          {/* Tabs for different feature categories */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              centered
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

          {/* Tab Panels */}
          <Box sx={{ minHeight: 500 }}>
            {/* Social Wall Tab */}
            <Fade in={activeTab === 0} timeout={500}>
              <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card elevation={3}>
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
                  <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
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
                  <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
                    <Card elevation={3}>
                      <CardMedia
                        component="img"
                        image={wikiImg}
                        alt="Wiki Feature"
                        sx={{ width: '100%', height: 'auto' }}
                      />
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Fade>

            {/* File Sharing Tab */}
            <Fade in={activeTab === 2} timeout={500}>
              <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card elevation={3}>
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
                  <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
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
                  <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
                    <Card elevation={3}>
                      <CardMedia
                        component="img"
                        image={eventsImg}
                        alt="Events Feature"
                        sx={{ width: '100%', height: 'auto' }}
                      />
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Fade>

            {/* Chat Tab */}
            <Fade in={activeTab === 4} timeout={500}>
              <Box sx={{ display: activeTab === 4 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card elevation={3}>
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
                  <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
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
                  <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
                    <Card elevation={3}>
                      <CardMedia
                        component="img"
                        image={membersImg}
                        alt="Members Feature"
                        sx={{ width: '100%', height: 'auto' }}
                      />
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Fade>

            {/* Admin Tools Tab */}
            <Fade in={activeTab === 6} timeout={500}>
              <Box sx={{ display: activeTab === 6 ? 'block' : 'none' }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Card elevation={3}>
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
            <Typography variant="h5" align="center" gutterBottom sx={{ mb: 4 }}>
              And Much More...
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <GroupWork sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Polls & Surveys</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gather feedback and make decisions together with interactive polls
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <AddPhotoAlternate sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Moodboards</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create visual collections and inspiration boards for your community
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <Notifications sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Smart Notifications</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Keep members engaged with customizable email and in-app notifications
                  </Typography>
                </Paper>
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
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            Ready to Build the Social Network Your Community Deserves?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Take back control and cultivate a thriving, private online space for your members.
          </Typography>
          <Button
            variant="contained"
            size="large"
            color="primary"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/signup')}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.2rem',
              fontWeight: 600,
              boxShadow: `0 8px 25px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'}`,
              '&:hover': {
                boxShadow: `0 12px 30px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)'}`,
              }
            }}
          >
            Launch Your Private Network Now
          </Button>
        </Container>
      </Box>

      {/* 6. Footer: Standard links */}
      <Box sx={{ py: 4, borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Conclav. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Button
                variant="text"
                size="small"
                color="inherit"
                onClick={() => navigate('/privacy')}
              >
                Privacy Policy
              </Button>
              <Button
                variant="text"
                size="small"
                color="inherit"
                onClick={() => navigate('/terms')}
              >
                Terms of Service
              </Button>
              <Button
                variant="text"
                size="small"
                color="inherit"
                onClick={() => navigate('/documentation')}
              >
                Help Center
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default NewLandingPage;