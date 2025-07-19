// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container,
  useTheme
} from '@mui/material';

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        py: 3,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(245, 245, 245, 0.9)',
        backdropFilter: 'blur(5px)',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
            <Box sx={{ mr: 1.5 }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="32" 
                height="32" 
                viewBox="-125 -125 250 250"
              >
                <defs>
                  <linearGradient id="footer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="1" />
                    <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                
                {/* Central big disk */}
                <circle cx="0" cy="0" r="35" fill="url(#footer-gradient)"/>
                
                {/* Medium disks */}
                <g fill="url(#footer-gradient)">
                  <circle cx="70.00" cy="0.00" r="25" opacity="0.9"/>
                  <circle cx="43.64" cy="54.72" r="25" opacity="0.9"/>
                  <circle cx="-15.57" cy="68.24" r="25" opacity="0.9"/>
                  <circle cx="-63.06" cy="30.37" r="25" opacity="0.9"/>
                  <circle cx="-63.06" cy="-30.37" r="25" opacity="0.9"/>
                  <circle cx="-15.57" cy="-68.24" r="25" opacity="0.9"/>
                  <circle cx="43.64" cy="-54.72" r="25" opacity="0.9"/>
                </g>
                
                {/* Small disks */}
                <g fill={theme.palette.primary.main}>
                  <circle cx="85.59" cy="41.21" r="12" opacity="0.7"/>
                  <circle cx="21.13" cy="92.61" r="12" opacity="0.7"/>
                  <circle cx="-59.23" cy="74.27" r="12" opacity="0.7"/>
                  <circle cx="-95.00" cy="0" r="12" opacity="0.7"/>
                  <circle cx="-59.23" cy="-74.27" r="12" opacity="0.7"/>
                  <circle cx="21.13" cy="-92.61" r="12" opacity="0.7"/>
                  <circle cx="85.59" cy="-41.21" r="12" opacity="0.7"/>
                </g>
              </svg>
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                letterSpacing: 1,
                backgroundImage: 'linear-gradient(120deg, #2196f3, #3f51b5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: 16, sm: 20 }
              }}
            >
              CONCLAV
            </Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: { xs: 1, sm: 0 },
              textAlign: { xs: 'center', sm: 'right' }
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {currentYear} Conclav Networks. All rights reserved.
            </Typography>
            <Box 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                mx: 1.5,
                color: 'text.secondary'
              }}
            >
              |
            </Box>
            <Box 
              sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 1,
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              <Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link>
              <Box component="span">•</Box>
              <Link to="/documentation" style={{ color: 'inherit', textDecoration: 'none' }}>Documentation</Link>
              <Box component="span">•</Box>
              <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>CGU</Link>
              <Box component="span">•</Box>
              <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Confidentialité</Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;