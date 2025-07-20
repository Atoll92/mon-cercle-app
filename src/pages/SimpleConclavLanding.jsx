import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  Stack,
  Paper,
  keyframes,
  alpha,
  useTheme
} from '@mui/material';
import { 
  Security, 
  Speed, 
  Group, 
  Shield, 
  Rocket,
  Block,
  Public,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Define animation keyframes
const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const SimpleConclavLanding = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Hero Section with gradient background */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }
      }}>
        <Container maxWidth="lg" sx={{ pt: 8, pb: 8 }}>
        <Box 
          textAlign="center" 
          sx={{
            animation: `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            color: 'white',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* European Badge */}
          <Chip 
            label="🇪🇺 Made in Europe • No Silicon Valley" 
            sx={{ 
              mb: 4, 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem',
              py: 1,
              px: 2,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
            }} 
          />
          
          {/* Main Title with Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Box 
              sx={{ 
                mr: 3,
                animation: 'rotate 20s linear infinite',
                '@keyframes rotate': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="80" 
                height="80" 
                viewBox="-125 -125 250 250"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(25, 118, 210, 0.3))' }}
              >
                <defs>
                  <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1976d2" stopOpacity="1" />
                    <stop offset="100%" stopColor="#42a5f5" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Central big disk */}
                <circle cx="0" cy="0" r="35" fill="url(#hero-gradient)" filter="url(#glow)">
                  <animate attributeName="r" values="35;38;35" dur="3s" repeatCount="indefinite" />
                </circle>
                
                {/* Medium disks */}
                <g fill="url(#hero-gradient)">
                  <circle cx="70.00" cy="0.00" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="43.64" cy="54.72" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-15.57" cy="68.24" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="1s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-63.06" cy="30.37" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-63.06" cy="-30.37" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-15.57" cy="-68.24" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="43.64" cy="-54.72" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="3s" repeatCount="indefinite" />
                  </circle>
                </g>
                
                {/* Small disks */}
                <g fill="#1976d2">
                  <circle cx="85.59" cy="41.21" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="21.13" cy="92.61" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="0.3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-59.23" cy="74.27" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="0.6s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-95.00" cy="0" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="0.9s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-59.23" cy="-74.27" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="21.13" cy="-92.61" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="85.59" cy="-41.21" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="1.8s" repeatCount="indefinite" />
                  </circle>
                </g>
              </svg>
            </Box>
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: { xs: '3rem', md: '5rem' },
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              Conclav
            </Typography>
          </Box>
          
          {/* Subtitle */}
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 3, 
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500,
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}
          >
            The micro social network that respects you
          </Typography>
          
          {/* Description */}
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 5, 
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.8,
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}
          >
            Create your own networks instantly. No tracking. No ads. No corporate surveillance. 
            <strong style={{ color: 'white' }}> Just authentic connections.</strong>
          </Typography>

          {/* CTA Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" mb={3}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Rocket />}
              onClick={() => navigate('/signup')}
              sx={{
                py: 2.5,
                px: 5,
                fontSize: '1.2rem',
                borderRadius: 50,
                bgcolor: 'white',
                color: '#667eea',
                fontWeight: 'bold',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                '&:hover': {
                  bgcolor: '#f8f9fa',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Start Free Trial
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/demo')}
              sx={{
                py: 2.5,
                px: 5,
                fontSize: '1.2rem',
                borderRadius: 50,
                borderWidth: 2,
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              See Demo
            </Button>
          </Stack>

          {/* Trial Info */}
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem' }}>
            30 days free • No credit card • Cancel anytime
          </Typography>
        </Box>
        </Container>
      </Box>

      {/* Anti-GAFAM Section */}
      <Box sx={{ py: 8, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box 
            sx={{
              animation: `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both`,
              textAlign: 'center',
            }}
          >
          <Box mb={8}>
            <Block sx={{ fontSize: 80, color: '#ff4757', mb: 3 }} />
            <Typography variant="h3" gutterBottom fontWeight="bold" color="#2c3e50" sx={{ mb: 3 }}>
              Break Free from Big Tech
            </Typography>
            <Typography variant="h5" sx={{ color: '#7f8c8d', maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}>
              No Google. No Meta. No Amazon. No Apple. No Microsoft tracking you.
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            <Grid 
              item 
              xs={12} 
              md={4} 
              textAlign="center"
              sx={{
                animation: `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both`,
              }}
            >
              <Box sx={{
                p: 4,
                borderRadius: 4,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                height: '100%',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  borderColor: '#667eea',
                }
              }}>
                <Shield sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" color="#2c3e50">
                  European Privacy
                </Typography>
                <Typography color="#7f8c8d" sx={{ lineHeight: 1.6 }}>
                  GDPR compliant by design. Your data stays in Europe, protected by the world's strongest privacy laws.
                </Typography>
              </Box>
            </Grid>

            <Grid 
              item 
              xs={12} 
              md={4} 
              textAlign="center"
              sx={{
                animation: `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both`,
              }}
            >
              <Box sx={{
                p: 4,
                borderRadius: 4,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                height: '100%',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  borderColor: '#667eea',
                }
              }}>
                <Speed sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" color="#2c3e50">
                  Zero Bloat
                </Typography>
                <Typography color="#7f8c8d" sx={{ lineHeight: 1.6 }}>
                  No ads, no tracking scripts, no analytics. Just pure functionality that loads instantly.
                </Typography>
              </Box>
            </Grid>

            <Grid 
              item 
              xs={12} 
              md={4} 
              textAlign="center"
              sx={{
                animation: `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both`,
              }}
            >
              <Box sx={{
                p: 4,
                borderRadius: 4,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                height: '100%',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  borderColor: '#667eea',
                }
              }}>
                <Group sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" color="#2c3e50">
                  Your Networks
                </Typography>
                <Typography color="#7f8c8d" sx={{ lineHeight: 1.6 }}>
                  Create unlimited private communities. You control who joins and what gets shared.
                </Typography>
              </Box>
            </Grid>
          </Grid>
          </Box>
        </Container>
      </Box>

      {/* Why Conclav Section */}
      <Box sx={{ py: 8, bgcolor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              animation: `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both`,
              textAlign: 'center',
            }}
          >
          <Typography variant="h3" textAlign="center" gutterBottom fontWeight="bold" mb={8} color="#2c3e50">
            Everything you need. Nothing you don't.
          </Typography>
          
          <Grid container spacing={4}>
          <Grid 
            item 
            xs={12} 
            md={6}
            sx={{
              animation: `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both`,
            }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                p: 5, 
                height: '100%',
                backgroundColor: 'white',
                borderRadius: 4,
                border: '1px solid #e9ecef',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  borderColor: '#667eea',
                },
              }}
            >
              <Security sx={{ fontSize: 48, color: '#667eea', mb: 3 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold" color="#2c3e50">
                Simple & Secure
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#7f8c8d' }}>
                Create networks in seconds. Share portfolios, organize events, message members. 
                All with bank-level security and zero corporate surveillance.
              </Typography>
            </Paper>
          </Grid>

          <Grid 
            item 
            xs={12} 
            md={6}
            sx={{
              animation: `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.6s both`,
            }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                p: 5, 
                height: '100%',
                backgroundColor: 'white',
                borderRadius: 4,
                border: '1px solid #e9ecef',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  borderColor: '#667eea',
                },
              }}
            >
              <Public sx={{ fontSize: 48, color: '#667eea', mb: 3 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold" color="#2c3e50">
                European Alternative
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#7f8c8d' }}>
                Built in France, hosted in Europe. A real alternative to Silicon Valley platforms 
                that respect your privacy and digital sovereignty.
              </Typography>
            </Paper>
          </Grid>
          </Grid>
        </Box>
        </Container>
      </Box>

      {/* Final CTA Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container maxWidth="md" textAlign="center">
          <Box
            sx={{
              animation: `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s both`,
              color: 'white',
            }}
          >
          <Typography variant="h3" gutterBottom fontWeight="bold" color="white" sx={{ mb: 3 }}>
            Ready to own your digital space?
          </Typography>
          <Typography variant="h6" sx={{ mb: 5, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6 }}>
            Join thousands creating authentic communities without Big Tech interference
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<Rocket />}
            onClick={() => navigate('/signup')}
            sx={{
              py: 3,
              px: 6,
              fontSize: '1.3rem',
              borderRadius: 50,
              bgcolor: 'white',
              color: '#667eea',
              fontWeight: 'bold',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              '&:hover': {
                bgcolor: '#f8f9fa',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Start Your Free Trial
          </Button>
          
          <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
            30 days free • Setup in under 5 minutes • Cancel anytime
          </Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default SimpleConclavLanding;