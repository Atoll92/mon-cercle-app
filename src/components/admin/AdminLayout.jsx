import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  alpha,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  AdminPanelSettings as AdminIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  Event as EventIcon,
  Palette as PaletteIcon,
  Article as ArticleIcon,
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon,
  ChevronLeft as ChevronLeftIcon,
  Security as SecurityIcon,
  Poll as PollIcon,
  Link as LinkIcon,
  MonetizationOn as MonetizationIcon,
  CreditCard as CreditCardIcon,
  EmojiEvents as BadgeIcon
} from '@mui/icons-material';

// Drawer width for desktop view
const drawerWidth = 260;

// AdminLayout component that provides a responsive drawer and app bar
const AdminLayout = ({ 
  children, 
  darkMode, 
  activeTab, 
  setActiveTab, 
  network, 
  message,
  clearMessage 
}) => {
  const muiTheme = useMuiTheme();
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

  // Navigation items for the drawer
  const navItems = [
    { 
      name: 'Network Settings', 
      icon: <SettingsIcon />, 
      index: 0 
    },
    { 
      name: 'Members', 
      icon: <PersonAddIcon />, 
      index: 1 
    },
    { 
      name: 'News', 
      icon: <ArticleIcon />, 
      index: 2 
    },
    { 
      name: 'Events', 
      icon: <EventIcon />, 
      index: 3 
    },
    { 
      name: 'Polls', 
      icon: <PollIcon />, 
      index: 4 
    },
    { 
      name: 'Theme & Branding', 
      icon: <PaletteIcon />, 
      index: 5 
    },
    { 
      name: 'Moderation', 
      icon: <SecurityIcon />, 
      index: 6 
    },
    { 
      name: 'Monetization', 
      icon: <MonetizationIcon />, 
      index: 7 
    },
    { 
      name: 'Billing & Plan', 
      icon: <CreditCardIcon />, 
      index: 8 
    },
    { 
      name: 'Badges & Engagement', 
      icon: <BadgeIcon />, 
      index: 9 
    }
  ];

  // Drawer content
  const drawer = (
    <>
      <Toolbar 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          px: [1, 2],
          bgcolor: darkMode ? alpha(muiTheme.palette.primary.main, 0.15) : alpha(muiTheme.palette.primary.light, 0.1), 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AdminIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
            Admin Panel
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      
      {network && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Network:
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 'medium',
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {network.name}
          </Typography>
          <Button 
            component={Link} 
            to={`/network/${network.id}`}
            size="small"
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 1 }}
            fullWidth
            variant="outlined"
          >
            View Network
          </Button>
          <Button 
            component={Link} 
            to="/dashboard"
            size="small"
            startIcon={<DashboardIcon />}
            sx={{ mt: 1 }}
            fullWidth
          >
            Dashboard
          </Button>
        </Box>
      )}
      
      <Divider />
      
      <List>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton
              selected={activeTab === item.index}
              onClick={() => handleTabChange(item.index)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: darkMode 
                    ? alpha(muiTheme.palette.primary.main, 0.15)
                    : alpha(muiTheme.palette.primary.light, 0.2),
                  borderLeft: `4px solid ${muiTheme.palette.primary.main}`,
                  '&:hover': {
                    backgroundColor: darkMode 
                      ? alpha(muiTheme.palette.primary.main, 0.25)
                      : alpha(muiTheme.palette.primary.light, 0.3),
                  }
                },
                '&:hover': {
                  backgroundColor: darkMode 
                    ? alpha(muiTheme.palette.primary.main, 0.1)
                    : alpha(muiTheme.palette.primary.light, 0.1),
                },
                pl: activeTab === item.index ? 1.75 : 2,
              }}
            >
              <ListItemIcon sx={{ 
                color: activeTab === item.index ? 'primary.main' : 'inherit',
                minWidth: '40px'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.name} 
                primaryTypographyProps={{
                  fontWeight: activeTab === item.index ? 'medium' : 'regular',
                  color: activeTab === item.index 
                    ? muiTheme.palette.primary.main 
                    : muiTheme.palette.custom.lightText
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile app bar - only visible on mobile */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'block', md: 'none' },
          width: '100%',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: darkMode 
            ? muiTheme.palette.background.default 
            : muiTheme.palette.primary.main,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {navItems.find(item => item.index === activeTab)?.name || 'Admin Panel'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* The sidebar drawer - permanent for desktop */}
      <Box
        component="nav"
        sx={{ 
          width: { md: drawerWidth }, 
          flexShrink: { md: 0 } 
        }}
      >
        {/* Mobile drawer (temporary) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: darkMode 
                ? muiTheme.palette.background.paper 
                : muiTheme.palette.background.default,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer (permanent) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
             position: 'sticky',
              top: 0,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
               position: 'sticky',
              
              width: drawerWidth,
              borderRight: `1px solid ${muiTheme.palette.custom.border}`,
              backgroundColor: darkMode 
                ? muiTheme.palette.background.paper 
                : muiTheme.palette.background.default,
              boxShadow: darkMode 
                ? '0 4px 20px rgba(0,0,0,0.3)' 
                : '0 1px 3px rgba(0,0,0,0.1)',
              height: 'calc(100vh - 80px)', // Adjust for NetworkHeader height (80px min-height)
              top: 80, // Positioned below NetworkHeader
              borderTop: `1px solid ${muiTheme.palette.custom.border}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          // pt: { xs: 2, md: 3 },
          mt: { xs: 8, md: 0 }, // Account for app bar on mobile
          // ml: { md: `${drawerWidth}px` },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;