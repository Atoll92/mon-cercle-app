import React, { useEffect, useState } from 'react';
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
  EmojiEvents as BadgeIcon,
  Support as SupportIcon,
  Category as CategoryIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Store as StoreIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import LanguageSwitcher from '../LanguageSwitcher';
import { useTranslation } from '../../hooks/useTranslation.jsx';

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
  const { t } = useTranslation();
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

  // Parse features config from network
  const featuresConfig = React.useMemo(() => {
    if (!network?.features_config) return {};
    try {
      return typeof network.features_config === 'string' 
        ? JSON.parse(network.features_config) 
        : network.features_config;
    } catch (e) {
      console.error('Error parsing features config:', e);
      return {};
    }
  }, [network?.features_config]);

  // Special network ID for rezoprospect
  const REZOPROSPECT_NETWORK_ID = 'b4e51e21-de8f-4f5b-b35d-f98f6df27508';
  const isRezoprospect = network?.id === REZOPROSPECT_NETWORK_ID;

  // Navigation items for the drawer
  const navItems = [
    {
      name: t('admin.tabs.settings'),
      icon: <SettingsIcon />,
      index: 0
    },
    {
      name: t('admin.tabs.members'),
      icon: <PersonAddIcon />,
      index: 1,
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.categories'),
      icon: <CategoryIcon />,
      index: 2,
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.news'),
      icon: <ArticleIcon />,
      index: 3,
      feature: 'news', // Feature flag
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.events'),
      icon: <EventIcon />,
      index: 4,
      feature: 'events', // Feature flag
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.polls'),
      icon: <PollIcon />,
      index: 5,
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.courses'),
      icon: <SchoolIcon />,
      index: 6,
      feature: 'courses', // Feature flag
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.crm'),
      icon: <EmailIcon />,
      index: 7,
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.theme'),
      icon: <PaletteIcon />,
      index: 8,
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.moderation'),
      icon: <SecurityIcon />,
      index: 9,
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: 'Modération Annonces',
      icon: <CampaignIcon />,
      index: 10,
      networkId: REZOPROSPECT_NETWORK_ID // Only for rezoprospect network
    },
    {
      name: 'Modération Utilisateurs',
      icon: <PeopleIcon />,
      index: 16,
      networkId: REZOPROSPECT_NETWORK_ID // Only for rezoprospect network
    },
    {
      name: t('admin.tabs.monetization'),
      icon: <MonetizationIcon />,
      index: 11,
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.billing'),
      icon: <CreditCardIcon />,
      index: 12,
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.badges'),
      icon: <BadgeIcon />,
      index: 13,
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.support'),
      icon: <SupportIcon />,
      index: 14,
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    },
    {
      name: t('admin.tabs.marketplace'),
      icon: <StoreIcon />,
      index: 15,
      feature: 'marketplace', // Feature flag
      excludeNetworks: [REZOPROSPECT_NETWORK_ID] // Hide for rezoprospect
    }
  ].filter(item => {
    // Filter out items that require a feature that is disabled
    if (item.feature && featuresConfig[item.feature] === false) {
      return false;
    }
    // Filter out items that are excluded for current network
    if (item.excludeNetworks && network?.id && item.excludeNetworks.includes(network.id)) {
      return false;
    }
    // Filter out items that are network-specific (only show if on that network)
    if (item.networkId && network?.id !== item.networkId) {
      return false;
    }
    return true;
  });

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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isMobile && <LanguageSwitcher />}
          {isMobile && (
            <IconButton onClick={handleDrawerToggle} size="small">
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Box>
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
            to="/network"
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

  const heightScrolled = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    return scrollTop;
  };
  const [desktopNavTopOffset, setDesktopNavTopOffset] = useState(Math.max(0, 80 - heightScrolled())); // Adjust for NetworkHeader height
  const handleScroll = () => {
    const newOffset = Math.max(0, 80 - heightScrolled()); // Adjust for NetworkHeader height
    if (newOffset !== desktopNavTopOffset) {
      setDesktopNavTopOffset(newOffset);
    }
  };
  const handleResize = () => {
    const newOffset = Math.max(0, 80 - heightScrolled()); // Adjust for NetworkHeader height
    if (newOffset !== desktopNavTopOffset) {
      setDesktopNavTopOffset(newOffset);
    }
  };
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [desktopNavTopOffset]);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile app bar - only visible on mobile */}
      <AppBar
        position="fixed"
        sx={{
          top: '77px',
          display: { xs: 'block', md: 'none' },
          width: '100%',
          zIndex: (theme) => theme.zIndex.drawer - 1,
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navItems.find(item => item.index === activeTab)?.name || 'Admin Panel'}
          </Typography>
          <LanguageSwitcher />
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
            zIndex: (theme) => theme.zIndex.drawer - 2,
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
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${muiTheme.palette.custom.border}`,
              backgroundColor: darkMode 
                ? "black" 
                : "white",
              boxShadow: darkMode 
                ? '0 4px 20px rgba(0,0,0,0.3)' 
                : '0 1px 3px rgba(0,0,0,0.1)',
              height: `calc(100vh - ${desktopNavTopOffset}px)`, // Adjust for NetworkHeader height (${desktopNavTopOffset}px min-height)
              marginTop: `${desktopNavTopOffset}px`, // Positioned below NetworkHeader
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
          pt: { xs: 2, md: 3 },
          mt: { xs: 8, md: 0 }, // Account for app bar on mobile
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