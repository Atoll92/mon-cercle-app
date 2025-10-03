import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  useTheme as useMuiTheme,
  alpha
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import {
  AdminPanelSettings as AdminIcon,
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  Article as ArticleIcon,
  Event as EventIcon,
  Palette as PaletteIcon,
  Dashboard as DashboardIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';

const AdminBreadcrumbs = ({ activeTab, networkName, darkMode }) => {
  const muiTheme = useMuiTheme();
  
  // Get the appropriate icon based on the active tab
  const getTabIcon = () => {
    switch (activeTab) {
      case 0:
        return <SettingsIcon fontSize="small" sx={{ mr: 0.5 }} />;
      case 1:
        return <PersonAddIcon fontSize="small" sx={{ mr: 0.5 }} />;
      case 2:
        return <ArticleIcon fontSize="small" sx={{ mr: 0.5 }} />;
      case 3:
        return <EventIcon fontSize="small" sx={{ mr: 0.5 }} />;
      case 4:
        return <PaletteIcon fontSize="small" sx={{ mr: 0.5 }} />;
      case 10:
        return <CampaignIcon fontSize="small" sx={{ mr: 0.5 }} />;
      default:
        return <AdminIcon fontSize="small" sx={{ mr: 0.5 }} />;
    }
  };

  // Get the tab name based on the active tab
  const getTabName = () => {
    switch (activeTab) {
      case 0:
        return "Network Settings";
      case 1:
        return "Members Management";
      case 2:
        return "News Management";
      case 3:
        return "Events Management";
      case 4:
        return "Theme & Branding";
      case 10:
        return "Modération Annonces";
      default:
        return "Admin Panel";
    }
  };

  return (
    <Box 
      sx={{ 
        mb: 3, 
        px: 1, 
        py: 1.5, 
        borderRadius: 1,
        bgcolor: darkMode ? alpha(muiTheme.palette.background.default, 0.5) : alpha(muiTheme.palette.grey[100], 0.7),
        border: `1px solid ${muiTheme.palette.custom.border}`,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}
    >
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" sx={{ color: muiTheme.palette.custom.fadedText }} />} 
        aria-label="breadcrumb"
      >
        <Link 
          underline="hover" 
          color="inherit" 
          component={RouterLink} 
          to="/dashboard"
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: muiTheme.palette.custom.fadedText, 
            fontWeight: 'medium',
            '&:hover': { color: muiTheme.palette.primary.main }
          }}
        >
          <DashboardIcon fontSize="small" sx={{ mr: 0.5 }} />
          Dashboard
        </Link>
        
        <Link
          underline="hover"
          color="inherit"
          component={RouterLink}
          to="/admin"
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: muiTheme.palette.custom.fadedText,
            fontWeight: 'medium',
            '&:hover': { color: muiTheme.palette.primary.main }
          }}
        >
          <AdminIcon fontSize="small" sx={{ mr: 0.5 }} />
          Admin Panel
        </Link>
        
        <Typography 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontWeight: 'bold',
            color: muiTheme.palette.primary.main
          }}
        >
          {getTabIcon()}
          {getTabName()}
        </Typography>
      </Breadcrumbs>
      
      {networkName && (
        <Typography 
          variant="body2" 
          sx={{ 
            ml: { xs: 0, sm: 'auto' },
            mt: { xs: 1, sm: 0 },
            color: muiTheme.palette.custom.lightText,
            bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
            px: 1.5,
            py: 0.5,
            borderRadius: 10,
            fontWeight: 'medium',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <HomeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
          {networkName}
        </Typography>
      )}
    </Box>
  );
};

export default AdminBreadcrumbs;