import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Button,
  Avatar,
  Chip,
  alpha,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Article as PostsIcon,
  Comment as CommentsIcon,
  Mail as SubscribersIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
  Palette as ThemeIcon,
  ArrowBack as ArrowBackIcon,
  ChevronLeft as ChevronLeftIcon,
  Public as PublicIcon,
  RssFeed as BlogIcon,
  Add as AddIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAuth } from '../../../context/authcontext';

const drawerWidth = 240;

const BlogAdminLayout = ({
  children,
  activeTab,
  setActiveTab,
  network,
  pendingCommentsCount = 0
}) => {
  const muiTheme = useMuiTheme();
  const darkMode = muiTheme.palette.mode === 'dark';
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const themeColor = network?.theme_color || muiTheme.palette.primary.main;

  // Simplified nav items for blog admin
  const navItems = [
    {
      name: t('admin.blog.tabs.posts', 'Posts'),
      icon: <PostsIcon />,
      index: 0
    },
    {
      name: t('admin.blog.tabs.comments', 'Comments'),
      icon: <CommentsIcon />,
      index: 1,
      badge: pendingCommentsCount > 0 ? pendingCommentsCount : null
    },
    {
      name: t('admin.blog.tabs.subscribers', 'Subscribers'),
      icon: <SubscribersIcon />,
      index: 2
    },
    {
      name: t('admin.blog.tabs.analytics', 'Analytics'),
      icon: <AnalyticsIcon />,
      index: 3
    },
    {
      name: t('admin.blog.tabs.theme', 'Theme'),
      icon: <ThemeIcon />,
      index: 4
    },
    {
      name: t('admin.blog.tabs.settings', 'Settings'),
      icon: <SettingsIcon />,
      index: 5
    }
  ];

  const blogUrl = network?.subdomain
    ? `https://${network.subdomain}.conclav.club`
    : network?.custom_domain
      ? `https://${network.custom_domain}`
      : null;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar
        sx={{
          px: 2,
          bgcolor: alpha(themeColor, 0.05)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
          {network?.logo_url ? (
            <Avatar
              src={network.logo_url}
              alt={network.name}
              sx={{ width: 36, height: 36 }}
            />
          ) : (
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: themeColor,
                fontSize: '1rem'
              }}
            >
              <BlogIcon />
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              noWrap
              sx={{ lineHeight: 1.2 }}
            >
              {network?.name || 'Blog Admin'}
            </Typography>
            <Chip
              label="Blog"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                bgcolor: alpha(themeColor, 0.1),
                color: themeColor
              }}
            />
          </Box>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>

      <Divider />

      {/* Quick Actions */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Create Post Button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setActiveTab(0); // Switch to Posts tab
            // Trigger new post dialog via custom event
            window.dispatchEvent(new CustomEvent('blog-create-post'));
          }}
          size="small"
          sx={{
            bgcolor: themeColor,
            '&:hover': {
              bgcolor: alpha(themeColor, 0.9)
            }
          }}
        >
          {t('admin.blog.createPost', 'Create Post')}
        </Button>

        {/* View Blog Button */}
        {blogUrl && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<PublicIcon />}
            component="a"
            href={`/blog/${network?.subdomain}`}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              borderColor: themeColor,
              color: themeColor,
              '&:hover': {
                borderColor: themeColor,
                bgcolor: alpha(themeColor, 0.05)
              }
            }}
          >
            {t('admin.blog.viewBlog', 'View Blog')}
          </Button>
        )}
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, py: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.index} disablePadding>
            <ListItemButton
              selected={activeTab === item.index}
              onClick={() => handleTabChange(item.index)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: alpha(themeColor, 0.1),
                  '&:hover': {
                    bgcolor: alpha(themeColor, 0.15)
                  },
                  '& .MuiListItemIcon-root': {
                    color: themeColor
                  },
                  '& .MuiListItemText-primary': {
                    color: themeColor,
                    fontWeight: 600
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  color="error"
                  sx={{ height: 20, minWidth: 20 }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Back to Dashboard & Logout */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ color: 'text.secondary' }}
        >
          {t('admin.backToDashboard', 'Back to Dashboard')}
        </Button>
        <Button
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={signOut}
          sx={{ color: 'error.main' }}
        >
          {t('networkHeader.logout', 'Logout')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar (Mobile only) */}
      <AppBar
        position="fixed"
        sx={{
          display: { md: 'none' },
          bgcolor: darkMode ? 'background.paper' : 'white',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {network?.name || 'Blog Admin'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth
            }
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider'
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '64px', md: 0 },
          minHeight: '100vh',
          bgcolor: darkMode ? 'background.default' : 'grey.50'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default BlogAdminLayout;
