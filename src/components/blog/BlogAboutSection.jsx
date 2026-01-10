import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Language as WebsiteIcon
} from '@mui/icons-material';
import UserContent from '../UserContent';

const BlogAboutSection = ({ blog, themeColor }) => {
  const blogSettings = blog?.blog_settings || {};
  const socialLinks = blogSettings.social_links || {};
  const aboutContent = blogSettings.about_page_content;

  if (!aboutContent) return null;

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

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 4,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: alpha(themeColor, 0.02)
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: 3,
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        {/* Avatar */}
        {blog?.logo_url ? (
          <Avatar
            src={blog.logo_url}
            alt={blog.name}
            sx={{
              width: 80,
              height: 80,
              flexShrink: 0
            }}
          />
        ) : (
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: themeColor,
              fontSize: '2rem',
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            {blog?.name?.[0] || 'B'}
          </Avatar>
        )}

        {/* Content */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            About the Author
          </Typography>

          <Box sx={{ mb: 2, color: 'text.secondary' }}>
            <UserContent
              content={aboutContent}
              html={false}
            />
          </Box>

          {/* Social Links */}
          {hasSocialLinks && (
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
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
                      size="small"
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
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default BlogAboutSection;
