// NewLandingPage2.jsx - Improved version with all suggested fixes
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Stack,
  useTheme,
  Card,
  CardContent,
  CardMedia,
  Tabs,
  Tab,
  Fade,
  Paper,
  alpha,
  Zoom,
  useMediaQuery,
  Collapse,
  IconButton,
  Avatar,
  Rating,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grow,
  Slide,
} from '@mui/material';
import {
  Security,
  People,
  Settings,
  ExpandMore,
  CheckCircle,
  ArrowForward,
  TrendingUp,
  Visibility,
  Speed,
  Lock,
  CloudOff,
  Block,
  Analytics,
  GroupAdd,
  Dashboard,
  Forum,
  Description,
  FolderShared,
  Event,
  Message,
  AdminPanelSettings,
  Timer,
  Star,
  FormatQuote,
  PlayArrow,
  KeyboardArrowDown,
  LightMode,
  DarkMode,
} from '@mui/icons-material';

// Import screenshots
import socialWallImg from '../assets/screenshots/socialwall.png';
import wikiImg from '../assets/screenshots/wiki.png';
import filesSharingImg from '../assets/screenshots/filessharing.png';
import eventsImg from '../assets/screenshots/events.png';
import chatImg from '../assets/screenshots/chat.png';
import membersImg from '../assets/screenshots/members.png';
import moderationImg from '../assets/screenshots/moderation.png';

// Custom hook for intersection observer
const useIntersectionObserver = (ref, options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isIntersecting;
};

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const isVisible = useIntersectionObserver(countRef, { threshold: 0.5 });

  useEffect(() => {
    if (isVisible) {
      let startTime = null;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isVisible, end, duration]);

  return (
    <span ref={countRef}>
      {prefix}{count}{suffix}
    </span>
  );
};

const NewLandingPage2 = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [activeFeature, setActiveFeature] = useState(0);
  const [expandedAccordion, setExpandedAccordion] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(theme.palette.mode === 'dark');

  // Testimonials data
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Tech Startup CEO",
      company: "InnovateTech",
      avatar: "SC",
      rating: 5,
      quote: "Finally, a platform that respects our privacy. We migrated our entire community and haven't looked back.",
    },
    {
      name: "Michael Rodriguez",
      role: "Nonprofit Director",
      company: "Community First",
      avatar: "MR",
      rating: 5,
      quote: "Our community engagement increased 300% after switching. The control we have is game-changing.",
    },
    {
      name: "Emma Thompson",
      role: "Community Manager",
      company: "Creative Collective",
      avatar: "ET",
      rating: 5,
      quote: "No more worrying about algorithm changes or data breaches. This is how social networks should be.",
    },
  ];

  // Core features (simplified)
  const coreFeatures = [
    {
      icon: <Lock sx={{ fontSize: 40 }} />,
      title: "Your Data, Your Rules",
      description: "Complete ownership and control. No tracking, no ads, no data mining.",
      color: theme.palette.primary.main,
    },
    {
      icon: <People sx={{ fontSize: 40 }} />,
      title: "Built for Real Connections",
      description: "Focus on meaningful interactions, not engagement metrics.",
      color: theme.palette.secondary.main,
    },
    {
      icon: <Settings sx={{ fontSize: 40 }} />,
      title: "Fully Customizable",
      description: "Make it yours with complete control over features, design, and rules.",
      color: theme.palette.success.main,
    },
  ];

  // Feature showcase data with screenshots
  const features = [
    {
      title: "Social Wall",
      icon: <Forum />,
      description: "A vibrant community hub for sharing and engagement",
      details: ["Rich media posts with images and videos", "Like, comment, and share functionality", "Real-time updates and notifications", "Content moderation tools"],
      image: socialWallImg,
    },
    {
      title: "Real-time Chat",
      icon: <Message />,
      description: "Instant communication with group chat and direct messaging",
      details: ["Real-time group chat with mentions", "Private direct messaging", "Media sharing in conversations", "Message history and search"],
      image: chatImg,
    },
    {
      title: "Events",
      icon: <Event />,
      description: "Organize and manage community gatherings",
      details: ["Create and manage events with RSVP", "Calendar integration and reminders", "Location mapping and directions", "Attendee management and analytics"],
      image: eventsImg,
    },
    {
      title: "Wiki & Knowledge",
      icon: <Description />,
      description: "Build a comprehensive knowledge base for your community",
      details: ["Easy-to-use wiki editor with rich formatting", "Version control and revision history", "Categories and tags for organization", "Search functionality across all pages"],
      image: wikiImg,
    },
    {
      title: "File Sharing",
      icon: <FolderShared />,
      description: "Share documents, images, and resources securely",
      details: ["Drag-and-drop file uploads", "Folder organization and search", "Download tracking and analytics", "Up to 5TB storage capacity"],
      image: filesSharingImg,
    },
    {
      title: "Member Management",
      icon: <People />,
      description: "Build a thriving community with comprehensive member tools",
      details: ["Searchable member directory", "Custom member profiles and badges", "Role-based permissions", "Invitation system with tracking"],
      image: membersImg,
    },
    {
      title: "Admin Tools",
      icon: <AdminPanelSettings />,
      description: "Take full control with comprehensive administration tools",
      details: ["Content moderation and reporting", "Member management and permissions", "Analytics and engagement metrics", "Customization and branding options"],
      image: moderationImg,
    },
  ];

  // Scroll to section
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(to bottom, #0a0a0a, #1a1a1a)' 
        : 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
      overflow: 'hidden'
    }}>
      {/* Animated Background Pattern */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          background: `radial-gradient(circle at 20% 50%, ${theme.palette.primary.main} 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, ${theme.palette.secondary.main} 0%, transparent 50%),
                       radial-gradient(circle at 40% 20%, ${theme.palette.success.main} 0%, transparent 50%)`,
          animation: 'float 20s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '33%': { transform: 'translate(30px, -30px) scale(1.1)' },
            '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          },
        }}
      />

      {/* Hero Section - Improved */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 10 },
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          {/* Urgency Banner */}
          <Fade in timeout={500}>
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: 1.5,
                background: `linear-gradient(90deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.light, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Timer color="warning" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Limited Time: 50% off for the first 100 communities • 
                <Chip 
                  label={<AnimatedCounter end={37} suffix=" spots left" />}
                  size="small"
                  sx={{ ml: 1, fontWeight: 700 }}
                  color="warning"
                />
              </Typography>
            </Paper>
          </Fade>

          {/* Main Hero Content */}
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Slide direction="right" in timeout={700}>
                <Box>
                  <Typography
                    variant={isMobile ? "h3" : "h2"}
                    component="h1"
                    gutterBottom
                    sx={{ 
                      fontWeight: 900,
                      mb: 3,
                      lineHeight: 1.1,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Stop Feeding Big Tech<br />
                    Your Community's Data
                  </Typography>
                  
                  <Typography
                    variant="h5"
                    sx={{ 
                      mb: 4, 
                      color: theme.palette.text.secondary,
                      fontWeight: 400,
                      lineHeight: 1.6
                    }}
                  >
                    Build a private social network where you control everything - 
                    no ads, no tracking, no corporate overlords.
                  </Typography>

                  {/* Social Proof */}
                  <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp color="success" />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        <AnimatedCounter end={500} suffix="+" /> Active Communities
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People color="primary" />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        <AnimatedCounter end={50000} suffix="+" /> Members
                      </Typography>
                    </Box>
                  </Box>

                  {/* Single Strong CTA */}
                  <Zoom in timeout={900}>
                    <Button
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/signup')}
                      sx={{
                        py: 2,
                        px: 5,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        borderRadius: 3,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Start Your Free Trial
                    </Button>
                  </Zoom>

                  <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
                    No credit card required • Setup in 30 seconds
                  </Typography>
                </Box>
              </Slide>
            </Grid>

            {/* Hero Visual */}
            <Grid item xs={12} md={5}>
              <Fade in timeout={1000}>
                <Box
                  sx={{
                    position: 'relative',
                    height: { xs: 300, md: 400 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Animated Network Visualization */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.1)}, transparent 70%)`,
                      borderRadius: 4,
                      position: 'relative',
                      overflow: 'hidden',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    {/* Floating Elements */}
                    {[...Array(6)].map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          position: 'absolute',
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: alpha(theme.palette.primary.main, 0.1),
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: `float${i} ${10 + i * 2}s ease-in-out infinite`,
                          [`@keyframes float${i}`]: {
                            '0%, 100%': { 
                              transform: `translate(${i * 40}px, ${i * 30}px) scale(1)`,
                            },
                            '50%': { 
                              transform: `translate(${i * 40 + 20}px, ${i * 30 - 20}px) scale(1.1)`,
                            },
                          },
                        }}
                      >
                        {i === 0 && <Lock />}
                        {i === 1 && <People />}
                        {i === 2 && <Security />}
                        {i === 3 && <CloudOff />}
                        {i === 4 && <Block />}
                        {i === 5 && <Analytics />}
                      </Box>
                    ))}
                    
                    {/* Center Text */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        Your Network
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Private • Secure • Yours
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Trust Indicators */}
      <Box sx={{ py: 4, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="center" justifyContent="center">
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security color="primary" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  GDPR Compliant
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock color="primary" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  End-to-End Encrypted
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed color="primary" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  99.9% Uptime
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudOff color="primary" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Self-Hosted Option
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Core Value Props - Simplified */}
      <Box sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Fade in timeout={1200}>
            <Typography variant="h3" align="center" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
              Why Communities Choose Us
            </Typography>
          </Fade>
          <Fade in timeout={1300}>
            <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}>
              Everything you hate about social media, fixed.
            </Typography>
          </Fade>

          <Grid container spacing={4}>
            {coreFeatures.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Grow in timeout={1400 + index * 100}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      p: 4,
                      textAlign: 'center',
                      background: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(feature.color, 0.1)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at center, ${alpha(feature.color, 0.05)}, transparent 70%)`,
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${alpha(feature.color, 0.15)}`,
                        border: `1px solid ${alpha(feature.color, 0.2)}`,
                        '&::before': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <Box sx={{ color: feature.color, mb: 3 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Social Proof - Testimonials */}
      <Box 
        sx={{ 
          py: { xs: 8, md: 10 }, 
          background: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Container maxWidth="lg">
          <Fade in timeout={1500}>
            <Typography variant="h3" align="center" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
              Loved by Community Leaders
            </Typography>
          </Fade>
          <Fade in timeout={1600}>
            <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}>
              Join hundreds of communities who've taken back control
            </Typography>
          </Fade>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Zoom in timeout={1700 + index * 100}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      p: 4,
                      background: theme.palette.background.paper,
                      borderRadius: 3,
                      position: 'relative',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                      },
                    }}
                  >
                    <FormatQuote 
                      sx={{ 
                        fontSize: 40, 
                        color: alpha(theme.palette.primary.main, 0.2),
                        position: 'absolute',
                        top: 16,
                        left: 16,
                      }} 
                    />
                    <Box sx={{ mb: 3, pt: 3 }}>
                      <Rating value={testimonial.rating} readOnly size="small" />
                    </Box>
                    <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic' }}>
                      "{testimonial.quote}"
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {testimonial.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {testimonial.role}, {testimonial.company}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>

          {/* Logo Cloud */}
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Trusted by innovative organizations
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, opacity: 0.4, flexWrap: 'wrap' }}>
              {['TechCorp', 'InnovateLab', 'FutureWorks', 'NextGen', 'DataSafe'].map((name, i) => (
                <Typography key={i} variant="h6" sx={{ fontWeight: 700 }}>
                  {name}
                </Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features - Progressive Disclosure */}
      <Box sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Fade in timeout={1800}>
            <Typography variant="h3" align="center" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
              Everything You Need to Succeed
            </Typography>
          </Fade>
          <Fade in timeout={1900}>
            <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}>
              Powerful features that put you in control
            </Typography>
          </Fade>

          {/* Mobile: Accordion View */}
          {isMobile ? (
            <Box>
              {features.map((feature, index) => (
                <Accordion
                  key={index}
                  expanded={expandedAccordion === index}
                  onChange={() => setExpandedAccordion(expandedAccordion === index ? false : index)}
                  elevation={0}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    '&:before': {
                      display: 'none',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        gap: 2,
                      },
                    }}
                  >
                    <Box sx={{ color: theme.palette.primary.main }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6">{feature.title}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {feature.description}
                    </Typography>
                    {feature.details.map((detail, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CheckCircle color="success" fontSize="small" />
                        <Typography variant="body2">{detail}</Typography>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            /* Desktop: Tab View */
            <Box>
              <Tabs
                value={activeFeature}
                onChange={(e, newValue) => setActiveFeature(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                centered
                sx={{
                  mb: 4,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '1rem',
                    '&.Mui-selected': {
                      fontWeight: 600
                    }
                  },
                }}
              >
                {features.map((feature, index) => (
                  <Tab 
                    key={index}
                    label={feature.title} 
                    icon={feature.icon} 
                    iconPosition="start"
                  />
                ))}
              </Tabs>

              {features.map((feature, index) => (
                <Fade key={index} in={activeFeature === index} timeout={500}>
                  <Box sx={{ display: activeFeature === index ? 'block' : 'none' }}>
                    <Card
                      elevation={0}
                      sx={{
                        p: 6,
                        background: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      }}
                    >
                      <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" paragraph>
                            {feature.description}
                          </Typography>
                          {feature.details.map((detail, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <CheckCircle color="success" />
                              <Typography variant="body1">{detail}</Typography>
                            </Box>
                          ))}
                          <Button
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForward />}
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/signup')}
                          >
                            Get Started
                          </Button>
                        </Grid>
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
                            <Box
                              component="img"
                              src={feature.image}
                              alt={`${feature.title} Screenshot`}
                              sx={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                              }}
                            />
                          </Card>
                        </Grid>
                      </Grid>
                    </Card>
                  </Box>
                </Fade>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      {/* Clear CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Fade in timeout={2000}>
            <Typography variant="h3" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
              Ready to Take Back Control?
            </Typography>
          </Fade>
          <Fade in timeout={2100}>
            <Typography variant="h6" sx={{ mb: 5, color: theme.palette.text.secondary }}>
              Join hundreds of communities building something better
            </Typography>
          </Fade>

          {/* Onboarding Steps */}
          <Grid container spacing={2} sx={{ mb: 5 }}>
            {[
              { step: 1, text: "Sign up in 30 seconds" },
              { step: 2, text: "Customize your network" },
              { step: 3, text: "Invite your community" },
            ].map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Zoom in timeout={2200 + index * 100}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 40,
                        height: 40,
                        fontWeight: 700,
                      }}
                    >
                      {item.step}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {item.text}
                    </Typography>
                    {index < 2 && !isMobile && (
                      <ArrowForward sx={{ color: 'text.secondary' }} />
                    )}
                  </Box>
                </Zoom>
              </Grid>
            ))}
          </Grid>

          <Zoom in timeout={2500}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                py: 2.5,
                px: 6,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  transform: 'translateY(-2px) scale(1.02)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              Start Your Free Trial Now
            </Button>
          </Zoom>

          <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
            No credit card required • Free for 30 days • Cancel anytime
          </Typography>
        </Container>

        {/* Background Decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200%',
            height: '200%',
            opacity: 0.05,
            background: `radial-gradient(circle at center, ${theme.palette.primary.main}, transparent 50%)`,
          }}
        />
      </Box>

      {/* Footer */}
      <Box sx={{ 
        py: 6, 
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.8),
      }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'center', md: 'flex-start' }}
            spacing={4}
          >
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Conclav
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your community, your rules, your data.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                © {new Date().getFullYear()} Conclav. Built with ❤️ for privacy.
              </Typography>
            </Box>

            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Product
                </Typography>
                <Stack spacing={1}>
                  <Button size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/features')}>
                    Features
                  </Button>
                  <Button size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/pricing')}>
                    Pricing
                  </Button>
                  <Button size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/demo')}>
                    Demo
                  </Button>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Company
                </Typography>
                <Stack spacing={1}>
                  <Button size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/about')}>
                    About
                  </Button>
                  <Button size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/privacy')}>
                    Privacy
                  </Button>
                  <Button size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/terms')}>
                    Terms
                  </Button>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Support
                </Typography>
                <Stack spacing={1}>
                  <Button size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/documentation')}>
                    Documentation
                  </Button>
                  <Button size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/help')}>
                    Help Center
                  </Button>
                  <Button size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/contact')}>
                    Contact
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Floating CTA for Mobile */}
      {isMobile && (
        <Zoom in timeout={3000}>
          <Paper
            elevation={8}
            sx={{
              position: 'fixed',
              bottom: 16,
              left: 16,
              right: 16,
              p: 2,
              background: theme.palette.background.paper,
              borderRadius: 3,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Ready to start?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Free for 30 days
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate('/signup')}
              sx={{ fontWeight: 600 }}
            >
              Get Started
            </Button>
          </Paper>
        </Zoom>
      )}
    </Box>
  );
};

export default NewLandingPage2;