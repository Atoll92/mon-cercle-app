 // src/pages/DemoPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  Dashboard,
  People,
  Person,
  Event,
  Shield,
  VerifiedUser,
  AdminPanelSettings,
  ArrowForward,
  Menu as MenuIcon
} from '@mui/icons-material';

// Mock data for the demo
import mockDashboard from '../assets/mock-dashboard.png';
import mockProfiles from '../assets/mock-profiles.png';
import mockAdmin from '../assets/mock-admin.png';
import mockEvents from '../assets/mock-events.png';
import Logo from '../assets/logo.svg';

const DemoPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Demo users for the network showcase
  const demoUsers = [
    { id: 1, name: 'Sarah Johnson', role: 'admin', avatar: '/api/placeholder/40/40', expertise: 'Project Management' },
    { id: 2, name: 'Michael Chen', role: 'member', avatar: '/api/placeholder/40/40', expertise: 'Web Development' },
    { id: 3, name: 'Aisha Patel', role: 'member', avatar: '/api/placeholder/40/40', expertise: 'UX Design' },
    { id: 4, name: 'Carlos Rodriguez', role: 'member', avatar: '/api/placeholder/40/40', expertise: 'Marketing' },
  ];

  // Demo events
  const demoEvents = [
    { id: 1, title: 'Monthly Network Meeting', date: '2025-04-20', location: 'Virtual', attendees: 15 },
    { id: 2, title: 'Skills Workshop', date: '2025-05-05', location: 'Main Office', attendees: 8 },
    { id: 3, title: 'Industry Conference', date: '2025-05-15', location: 'Convention Center', attendees: 25 },
  ];

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" color="primary">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={toggleMobileMenu}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            <Box 
              component="img"
              src={Logo}
              alt="ÜNI Logo"
              sx={{ height: 40, mr: 1 }}
            />
            ÜNI Demo
          </Typography>
          
          <Button 
            component={Link} 
            to="/" 
            color="inherit" 
            startIcon={<ArrowBack />}
          >
            Back to Home
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {/* Introduction Banner */}
        <Paper 
          elevation={3}
          sx={{ 
            p: 4, 
            mb: 4, 
            backgroundColor: '#001428',
            color: 'white',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              opacity: 0.1,
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} 
          />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to the ÜNI Interactive Demo
          </Typography>
          
          <Typography variant="subtitle1" paragraph>
            Explore the key features of our private network platform designed for professionals, 
            unions, associations, and closed communities. See how ÜNI can help you create a secure 
            space for your members to connect and collaborate.
          </Typography>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="secondary" 
              component={Link}
              to="/signup"
              sx={{ borderRadius: 2 }}
            >
              Try It For Free
            </Button>
            
            <Button 
              variant="outlined" 
              sx={{ 
                borderColor: 'white', 
                color: 'white',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'white',
                }
              }}
              component={Link}
              to="/login"
            >
              Live Demo Access
            </Button>
          </Box>
        </Paper>
        
        {/* Feature Navigation Tabs */}
        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            indicatorColor="primary"
            textColor="primary"
            centered={!isMobile}
          >
            <Tab icon={<Dashboard />} label="Dashboard" />
            <Tab icon={<People />} label="Member Network" />
            <Tab icon={<Person />} label="Member Profiles" />
            <Tab icon={<Event />} label="Event Coordination" />
            <Tab icon={<AdminPanelSettings />} label="Admin Controls" />
            <Tab icon={<Shield />} label="Privacy Features" />
          </Tabs>
        </Paper>
        
        {/* Tab Content */}
        <Box sx={{ py: 2 }}>
          {/* Dashboard Tab */}
          {activeTab === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Your Network Hub
                </Typography>
                <Typography paragraph>
                  The ÜNI dashboard gives you a complete overview of your network at a glance.
                  View your profile information, see recent updates from network members, and
                  access all key features from one central location.
                </Typography>
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>1</Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Personal Profile Summary" 
                      secondary="Quick access to your own information and details" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>2</Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Network Member Directory" 
                      secondary="Easily find and connect with other members" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>3</Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Quick Navigation" 
                      secondary="One-click access to all major platform features" 
                    />
                  </ListItem>
                </List>
                <Button 
                  variant="contained" 
                  endIcon={<ArrowForward />}
                  onClick={() => setActiveTab(1)}
                  sx={{ mt: 2 }}
                >
                  Explore Network Features
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f0f4f8'
                  }}
                >
                  <Box 
                    component="img"
                    src="/api/placeholder/500/300"
                    alt="Dashboard Preview"
                    sx={{ 
                      maxWidth: '100%',
                      maxHeight: '400px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      borderRadius: 1
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Member Network Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h5" component="h2" gutterBottom>
                Your Private Member Network
              </Typography>
              <Typography paragraph>
                ÜNI creates a secure, closed network environment where your members can connect
                and collaborate without the distractions and privacy concerns of public social platforms.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Network Members
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <List>
                        {demoUsers.map(user => (
                          <ListItem key={user.id}>
                            <ListItemAvatar>
                              <Avatar src={user.avatar} alt={user.name} />
                            </ListItemAvatar>
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {user.name}
                                  {user.role === 'admin' && (
                                    <Chip 
                                      label="Admin" 
                                      size="small" 
                                      color="primary" 
                                      sx={{ ml: 1 }} 
                                    />
                                  )}
                                </Box>
                              }
                              secondary={user.expertise} 
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Network Features
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Invite-Only Access
                            </Typography>
                            <Typography variant="body2">
                              Complete control over who joins your network through secure invitations
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Member Directory
                            </Typography>
                            <Typography variant="body2">
                              Easily find and connect with other network members
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Zero Tracking
                            </Typography>
                            <Typography variant="body2">
                              No analytics or data collection - your network's privacy comes first
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Custom Branding
                            </Typography>
                            <Typography variant="body2">
                              White-label solution that can be personalized for your organization
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Paper>
                  
                  <Button 
                    variant="contained" 
                    endIcon={<ArrowForward />}
                    onClick={() => setActiveTab(2)}
                    sx={{ mt: 2 }}
                  >
                    Explore Member Profiles
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Member Profiles Tab */}
          {activeTab === 2 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Professional Member Profiles
                </Typography>
                <Typography paragraph>
                  ÜNI provides customizable professional profiles for your members, allowing them
                  to showcase their expertise, work history, and portfolios in a protected environment.
                </Typography>
                
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Profile Features
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Personal Information" 
                          secondary="Name, role, contact details, and professional summary" 
                        />
                      </ListItem>
                      <Divider component="li" />
                      <ListItem>
                        <ListItemText 
                          primary="Skills & Expertise" 
                          secondary="Highlight professional competencies and specializations" 
                        />
                      </ListItem>
                      <Divider component="li" />
                      <ListItem>
                        <ListItemText 
                          primary="Work Portfolio" 
                          secondary="Showcase projects, achievements, and relevant work samples" 
                        />
                      </ListItem>
                      <Divider component="li" />
                      <ListItem>
                        <ListItemText 
                          primary="Privacy Controls" 
                          secondary="Members control exactly what information is visible" 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
                
                <Button 
                  variant="contained" 
                  endIcon={<ArrowForward />}
                  onClick={() => setActiveTab(3)}
                  sx={{ mt: 2 }}
                >
                  Explore Event Features
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    bgcolor: '#f0f4f8',
                    height: '100%'
                  }}
                >
                  <Typography variant="h6" gutterBottom align="center">
                    Example Member Profile
                  </Typography>
                  
                  <Card sx={{ mb: 3 }}>
                    <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src="/api/placeholder/80/80"
                        alt="Profile Avatar"
                        sx={{ width: 80, height: 80 }}
                      />
                      <Box sx={{ ml: 3 }}>
                        <Typography variant="h6">Sarah Johnson</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Project Manager & Team Lead
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label="Admin" 
                            size="small" 
                            color="primary" 
                            sx={{ mr: 1 }} 
                          />
                          <Chip 
                            label="Available for Projects" 
                            size="small" 
                            color="success" 
                          />
                        </Box>
                      </Box>
                    </Box>
                    
                    <Divider />
                    
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        About
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Project manager with 8+ years of experience leading cross-functional teams 
                        and delivering complex initiatives for clients in technology and finance sectors.
                      </Typography>
                      
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Skills
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Chip label="Project Management" size="small" sx={{ m: 0.5 }} />
                        <Chip label="Agile Methodologies" size="small" sx={{ m: 0.5 }} />
                        <Chip label="Team Leadership" size="small" sx={{ m: 0.5 }} />
                        <Chip label="Stakeholder Communication" size="small" sx={{ m: 0.5 }} />
                        <Chip label="Risk Management" size="small" sx={{ m: 0.5 }} />
                      </Box>
                      
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Contact Information
                      </Typography>
                      <Typography variant="body2">
                        Email: sarah.johnson@example.com
                      </Typography>
                      <Typography variant="body2">
                        Phone: (555) 123-4567
                      </Typography>
                    </CardContent>
                  </Card>
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {/* Event Coordination Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h5" component="h2" gutterBottom>
                Event Coordination
              </Typography>
              <Typography paragraph>
                Organize and manage events for your network with ÜNI's integrated event management 
                features. Schedule meetings, workshops, conferences, and social gatherings with ease.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Upcoming Events
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      {demoEvents.map(event => (
                        <Paper 
                          key={event.id} 
                          elevation={1} 
                          sx={{ p: 2, mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {event.title}
                          </Typography>
                          <Grid container spacing={1} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Date:</strong> {event.date}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Location:</strong> {event.location}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Attendees:</strong> {event.attendees} registered
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={7}>
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Event Management Features
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Event Creation
                            </Typography>
                            <Typography variant="body2">
                              Easily create and customize events with all necessary details
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Attendee Management
                            </Typography>
                            <Typography variant="body2">
                              Track RSVPs, manage capacity, and communicate with attendees
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Calendar Integration
                            </Typography>
                            <Typography variant="body2">
                              Sync with personal calendars for better scheduling coordination
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Private Event Spaces
                            </Typography>
                            <Typography variant="body2">
                              Dedicated areas for discussions and resources related to each event
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Paper>
                  
                  <Box 
                    component="img"
                    src="/api/placeholder/600/250"
                    alt="Events Calendar View"
                    sx={{ 
                      maxWidth: '100%',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  
                  <Button 
                    variant="contained" 
                    endIcon={<ArrowForward />}
                    onClick={() => setActiveTab(4)}
                    sx={{ mt: 3 }}
                  >
                    Explore Admin Features
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Admin Controls Tab */}
          {activeTab === 4 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Powerful Admin Controls
                </Typography>
                <Typography paragraph>
                  ÜNI provides comprehensive administrative tools to manage your network,
                  members, and content. Keep complete control over your private community.
                </Typography>
                
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Admin Features
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <PersonAddIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Member Management" 
                          secondary="Invite, approve, and manage network members" 
                        />
                      </ListItem>
                      <Divider component="li" />
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <VerifiedUser />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Role Assignment" 
                          secondary="Designate admins and assign specialized roles" 
                        />
                      </ListItem>
                      <Divider component="li" />
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <AdminPanelSettings />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Network Settings" 
                          secondary="Customize your network's appearance and functionality" 
                        />
                      </ListItem>
                      <Divider component="li" />
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <Shield />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Privacy Controls" 
                          secondary="Set network-wide privacy and security policies" 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
                
                <Button 
                  variant="contained" 
                  endIcon={<ArrowForward />}
                  onClick={() => setActiveTab(5)}
                  sx={{ mt: 2 }}
                >
                  Explore Privacy Features
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: '#f0f4f8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}
                >
                  <Typography variant="h6" gutterBottom align="center">
                    Admin Dashboard Preview
                  </Typography>
                  
                  <Box 
                    component="img"
                    src="/api/placeholder/500/350"
                    alt="Admin Dashboard"
                    sx={{ 
                      maxWidth: '100%',
                      borderRadius: 1,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      mb: 3
                    }}
                  />
                  
                  <Typography variant="body2" sx={{ maxWidth: '90%', textAlign: 'center' }}>
                    The admin panel gives you complete control over your network settings,
                    member management, and security preferences in one intuitive interface.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
      
 {/* Privacy Features Tab */}
 {activeTab === 5 && (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Privacy-First Platform
      </Typography>
      <Typography paragraph>
        ÜNI was built with privacy at its core. Unlike public social networks, we never track, 
        analyze, or monetize your data. Your network remains private, secure, and under your control.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4, backgroundColor: '#e8f5e9', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
          Zero Tracking by Design
        </Typography>
        <Typography variant="body1">
          We've built ÜNI with a strict commitment to privacy. There are no analytics
          tracking your members' behavior, no data mining, and no third-party cookies.
          Your network's information stays within your network.
        </Typography>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Closed Network
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" paragraph>
                Complete network isolation ensures your members' profiles and activities 
                are only visible to other authorized network members.
              </Typography>
              <Box 
                component="img"
                src={mockAdmin}
                alt="Admin Controls"
                sx={{ width: '100%', borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Control
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" paragraph>
                Your organization maintains ownership of all network data, with full
                export capabilities and the right to delete information at any time.
              </Typography>
              <Box 
                component="img"
                src={mockProfiles}
                alt="Profile Privacy"
                sx={{ width: '100%', borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Encryption
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" paragraph>
                All data is encrypted both in transit and at rest using enterprise-grade
                encryption protocols. Regular security audits ensure compliance.
              </Typography>
              <Box 
                component="img"
                src={mockDashboard}
                alt="Secure Dashboard"
                sx={{ width: '100%', borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#fffde7' }}>
        <Typography variant="h6" gutterBottom>
          Compliance & Certifications
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <VerifiedUser />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="GDPR Compliant" 
                  secondary="Full compliance with EU data protection regulations"
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <Shield />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="SOC 2 Certified" 
                  secondary="Enterprise-grade security protocols"
                />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box 
              component="img"
              src={mockEvents}
              alt="Security Badges"
              sx={{ width: '100%', borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          color="success"
          component={Link}
          to="/signup"
          sx={{ px: 6, py: 2 }}
        >
          Start Your Secure Network
        </Button>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Ready to experience truly private networking?<br/>
          Get started with a 30-day free trial.
        </Typography>
      </Box>
    </Box>
  )}
</Box>
</Container>
</Box>
);
}

export default DemoPage;