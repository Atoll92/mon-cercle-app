import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Language as WebsiteIcon,
  RssFeed as RssIcon
} from '@mui/icons-material';

const BlogHeader = ({ blog, themeColor, compact = false }) => {
  const theme = useTheme();
  const blogSettings = blog?.blog_settings || {};
  const socialLinks = blogSettings.social_links || {};

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'twitter':
        return <TwitterIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
      case 'instagram':
        return <InstagramIcon />;
      case 'website':
        return <WebsiteIcon />;
      default:
        return null;
    }
  };

  const hasSocialLinks = Object.values(socialLinks).some(v => v);

  if (compact) {
    return (
      <Box
        sx={{
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Container maxWidth="lg">
          <Box
            component={RouterLink}
            to={`/blog/${blog?.subdomain}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            {blog?.logo_url ? (
              <Avatar
                src={blog.logo_url}
                alt={blog.name}
                sx={{ width: 40, height: 40 }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: themeColor,
                  fontSize: '1rem'
                }}
              >
                {blog?.name?.[0] || 'B'}
              </Avatar>
            )}
            <Typography variant="h6" fontWeight={600}>
              {blog?.name || 'Blog'}
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 6,
        bgcolor: alpha(themeColor, 0.03),
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundImage: blog?.background_image_url
          ? `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.95)), url(${blog.background_image_url})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          {/* Logo */}
          {blog?.logo_url ? (
            <Avatar
              src={blog.logo_url}
              alt={blog.name}
              sx={{
                width: 100,
                height: 100,
                mb: 2,
                border: '4px solid',
                borderColor: 'background.paper',
                boxShadow: 2
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mb: 2,
                bgcolor: themeColor,
                fontSize: '2.5rem',
                fontWeight: 600,
                border: '4px solid',
                borderColor: 'background.paper',
                boxShadow: 2
              }}
            >
              {blog?.name?.[0] || 'B'}
            </Avatar>
          )}

          {/* Blog Name */}
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 1
            }}
          >
            {blog?.name || 'Blog'}
          </Typography>

          {/* Description */}
          {blog?.description && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: 600,
                mb: 3
              }}
            >
              {blog.description}
            </Typography>
          )}

          {/* Social Links */}
          {hasSocialLinks && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return null;
                const icon = getSocialIcon(platform);
                if (!icon) return null;

                return (
                  <Tooltip key={platform} title={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                    <IconButton
                      component="a"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: themeColor,
                          bgcolor: alpha(themeColor, 0.1)
                        }
                      }}
                    >
                      {icon}
                    </IconButton>
                  </Tooltip>
                );
              })}

              {blogSettings.rss_enabled && (
                <Tooltip title="RSS Feed">
                  <IconButton
                    component="a"
                    href={`/api/blog/${blog?.subdomain}/rss`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: themeColor,
                        bgcolor: alpha(themeColor, 0.1)
                      }
                    }}
                  >
                    <RssIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default BlogHeader;
