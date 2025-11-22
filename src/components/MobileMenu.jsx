import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Typography,
  alpha,
  Switch,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Mail as MailIcon,
  Logout as LogoutIcon,
  WbSunny as SunIcon,
  NightsStay as MoonIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { useDirectMessages } from '../context/directMessagesContext';
import { logout } from '../api/auth';
import { useProfile } from '../context/profileContext';

const MobileMenu = ({ networkLogo, networkName, networkId, user, visibleTabs = [], showDefaultHeader = false }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { unreadTotal } = useDirectMessages();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const headerRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState(null);

  // Set CSS variable for header height on mobile
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--network-header-height', `${height}px`);
      }
    };

    // Initial measurement
    updateHeaderHeight();

    // Update on resize
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleAvatarMenuOpen = (event) => {
    setAvatarMenuAnchor(event.currentTarget);
  };

  const handleAvatarMenuClose = () => {
    setAvatarMenuAnchor(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    handleAvatarMenuClose();
    logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (activeProfile?.full_name) {
      const names = activeProfile.full_name.split(' ');
      return names.map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Default header layout for non-logged-in users
  if (showDefaultHeader) {
    return (
      <Box
        ref={headerRef}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          px: 2,
          py: 1.5,
          minHeight: '64px',
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          borderBottom: `1px solid ${darkMode ? '#333333' : '#eeeeee'}`,
          position: 'sticky',
          top: 0,
          zIndex: 1300,
        }}
      >
        {/* Left: Conclav Logo + Name */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="-125 -125 250 250"
          >
            <defs>
              <linearGradient id="mobile-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" stopOpacity="1" />
                <stop offset="100%" stopColor="#764ba2" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Central big disk */}
            <circle cx="0" cy="0" r="35" fill="url(#mobile-logo-gradient)" />

            {/* Medium disks */}
            <g fill="url(#mobile-logo-gradient)" opacity="0.8">
              <circle cx="70.00" cy="0.00" r="20" />
              <circle cx="43.64" cy="54.72" r="20" />
              <circle cx="-15.57" cy="68.24" r="20" />
              <circle cx="-63.06" cy="30.37" r="20" />
              <circle cx="-63.06" cy="-30.37" r="20" />
              <circle cx="-15.57" cy="-68.24" r="20" />
              <circle cx="43.64" cy="-54.72" r="20" />
            </g>

            {/* Small disks */}
            <g fill="#667eea" opacity="0.6">
              <circle cx="85.59" cy="41.21" r="10" />
              <circle cx="21.13" cy="92.61" r="10" />
              <circle cx="-59.23" cy="74.27" r="10" />
              <circle cx="-95.00" cy="0" r="10" />
              <circle cx="-59.23" cy="-74.27" r="10" />
              <circle cx="21.13" cy="-92.61" r="10" />
              <circle cx="85.59" cy="-41.21" r="10" />
            </g>
          </svg>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '1.1rem',
            }}
          >
            Conclav
          </Typography>
        </Link>

        {/* Right: Login Icon Button */}
        <IconButton
          onClick={() => navigate('/login')}
          sx={{
            color: darkMode ? '#ffffff' : '#667eea',
            border: `1px solid ${darkMode ? '#ffffff' : '#667eea'}`,
            borderRadius: '8px',
            padding: '8px',
            '&:hover': {
              borderColor: darkMode ? '#ffffff' : '#5a6fd8',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(102, 126, 234, 0.05)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <PersonIcon sx={{ fontSize: '1.4rem' }} />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      ref={headerRef}
      sx={{
        display: { xs: 'flex', sm: 'none' },
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        px: 2,
        py: 1.5,
        minHeight: '64px',
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderBottom: `1px solid ${darkMode ? '#333333' : '#eeeeee'}`,
        position: 'sticky',
        top: 0,
        zIndex: 1300,
      }}
    >
      {/* Left: Burger Menu */}
      <IconButton
        onClick={handleDrawerToggle}
        sx={{
          color: darkMode ? '#ffffff' : '#000000',
          padding: '14px',
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Center: Network Logo/Name */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        {networkLogo ? (
          <Link to={user && networkId ? '/network' : (networkId ? `/network/${networkId}` : '/dashboard')}>
            <img
              src={networkLogo}
              alt={networkName || "Network Logo"}
              style={{
                maxHeight: '40px',
                maxWidth: '100px',
                objectFit: 'contain'
              }}
            />
          </Link>
        ) : networkName ? (
          <Typography
            component={Link}
            to={user && networkId ? '/network' : (networkId ? `/network/${networkId}` : '/dashboard')}
            variant="h6"
            sx={{
              fontWeight: 700,
              color: darkMode ? '#ffffff' : '#333333',
              textDecoration: 'none',
              fontSize: '1.1rem',
            }}
          >
            {networkName}
          </Typography>
        ) : null}
      </Box>

      {/* Right: User Avatar with Badge */}
      {user && (
        <IconButton onClick={handleAvatarMenuOpen}>
          <Badge
            badgeContent={unreadTotal}
            color="error"
            max={99}
            invisible={unreadTotal === 0}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: '18px',
                minWidth: '18px',
                fontWeight: 'bold',
              },
            }}
          >
            <Avatar
              src={activeProfile?.profile_picture_url}
              sx={{
                width: 36,
                height: 36,
                bgcolor: darkMode ? '#667eea' : '#667eea',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {!activeProfile?.profile_picture_url && getUserInitials()}
            </Avatar>
          </Badge>
        </IconButton>
      )}

      {/* Burger Menu Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          sx: {
            width: 280,
            zIndex: 9991300,
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Navigation
          </Typography>
        </Box>

        <Divider sx={{ borderColor: darkMode ? '#333333' : '#eeeeee' }} />

        <List>
          {/* Dashboard Link */}
          {user && (
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigation('/dashboard')}>
                <ListItemIcon>
                  <DashboardIcon sx={{ color: darkMode ? '#ffffff' : '#000000' }} />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
          )}

          {/* Network Tabs */}
          {visibleTabs.map((tab) => (
            <ListItem key={tab.id} disablePadding>
              <ListItemButton
                onClick={() => {
                  const path = user && networkId
                    ? `/network?tab=${tab.id}`
                    : (networkId ? `/network/${networkId}?tab=${tab.id}` : '/dashboard');
                  handleNavigation(path);
                }}
              >
                <ListItemIcon>
                  {React.cloneElement(tab.icon, {
                    sx: { color: darkMode ? '#ffffff' : '#000000' }
                  })}
                </ListItemIcon>
                <ListItemText primary={tab.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ borderColor: darkMode ? '#333333' : '#eeeeee', my: 1 }} />

        {/* Dark Mode Toggle */}
        <List>
          <ListItem>
            <ListItemIcon>
              {darkMode ? (
                <SunIcon sx={{ color: '#FFA000' }} />
              ) : (
                <MoonIcon sx={{ color: '#424242' }} />
              )}
            </ListItemIcon>
            <ListItemText primary={darkMode ? 'Light Mode' : 'Dark Mode'} />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={darkMode}
                onChange={toggleDarkMode}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#667eea',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#667eea',
                  },
                }}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Drawer>

      {/* Avatar Menu */}
      <Menu
        anchorEl={avatarMenuAnchor}
        open={Boolean(avatarMenuAnchor)}
        onClose={handleAvatarMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
            border: `1px solid ${darkMode ? '#333333' : '#eeeeee'}`,
          }
        }}
      >
        {/* Profile Info Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${darkMode ? '#333333' : '#eeeeee'}` }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {activeProfile?.full_name || user?.email}
          </Typography>
          {activeProfile?.full_name && (
            <Typography variant="caption" sx={{ color: darkMode ? '#aaaaaa' : '#666666' }}>
              {user?.email}
            </Typography>
          )}
        </Box>

        <MenuItem
          onClick={() => {
            handleAvatarMenuClose();
            navigate(`/profile/${activeProfile?.id || user?.id}`);
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" sx={{ color: darkMode ? '#ffffff' : '#000000' }} />
          </ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleAvatarMenuClose();
            navigate('/profile/edit');
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: darkMode ? '#ffffff' : '#000000' }} />
          </ListItemIcon>
          <ListItemText>Edit Profile</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleAvatarMenuClose();
            navigate('/messages');
          }}
        >
          <ListItemIcon>
            <Badge
              badgeContent={unreadTotal}
              color="error"
              max={99}
              invisible={unreadTotal === 0}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.6rem',
                  height: '16px',
                  minWidth: '16px',
                  fontWeight: 'bold',
                  right: -8,
                  top: 2,
                },
              }}
            >
              <MailIcon fontSize="small" sx={{ color: darkMode ? '#ffffff' : '#000000' }} />
            </Badge>
          </ListItemIcon>
          <ListItemText>
            Messages
          </ListItemText>
        </MenuItem>

        <Divider sx={{ borderColor: darkMode ? '#333333' : '#eeeeee' }} />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: darkMode ? '#ffffff' : '#000000' }} />
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MobileMenu;
