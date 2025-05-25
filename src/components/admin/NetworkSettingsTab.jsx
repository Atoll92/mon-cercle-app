import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  alpha,
  useTheme as useMuiTheme,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Grid,
  Switch,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Save as SaveIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Groups as GroupsIcon,
  ExpandMore as ExpandMoreIcon,
  Extension as FeaturesIcon,
  ViewModule as ViewModuleIcon,
  Article as ArticleIcon,
  Event as EventIcon,
  Forum as ForumIcon,
  FileCopy as FileIcon,
  MenuBook as WikiIcon,
  Image as ImageIcon,
  LocationOn as LocationIcon,
  NotificationsActive as NotificationsIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { updateNetworkDetails } from '../../api/networks';

const NetworkSettingsTab = ({ network, onNetworkUpdate, darkMode }) => {
  const muiTheme = useMuiTheme();
  
  // Basic settings
  const [networkName, setNetworkName] = useState(network ? network.name : '');
  const [networkDescription, setNetworkDescription] = useState(network ? network.description || '' : '');
  
  // Advanced settings
  const [privacyLevel, setPrivacyLevel] = useState(network?.privacy_level || 'private');
  const [purpose, setPurpose] = useState(network?.purpose || 'general');
  
  // Features configuration
  const [features, setFeatures] = useState(() => {
    if (network?.features_config) {
      try {
        const config = typeof network.features_config === 'string' 
          ? JSON.parse(network.features_config) 
          : network.features_config;
        return {
          events: config.events !== false,
          news: config.news !== false,
          files: config.files !== false,
          chat: config.chat !== false,
          wiki: config.wiki !== false,
          moodboards: config.moodboards !== false,
          location: config.location_sharing || false,
          notifications: config.notifications !== false
        };
      } catch (e) {
        console.error('Error parsing features config:', e);
      }
    }
    return {
      events: true,
      news: true,
      files: true,
      chat: true,
      wiki: true,
      moodboards: true,
      location: false,
      notifications: true
    };
  });
  
  // Enabled tabs
  const [enabledTabs, setEnabledTabs] = useState(() => {
    if (network?.enabled_tabs) {
      try {
        // Handle both new format (array) and legacy format (stringified array)
        let tabs;
        if (Array.isArray(network.enabled_tabs)) {
          // New format: already an array
          tabs = network.enabled_tabs;
        } else if (typeof network.enabled_tabs === 'string') {
          // Legacy format: stringified array
          tabs = JSON.parse(network.enabled_tabs);
        } else {
          // Fallback
          tabs = ['news', 'members', 'events', 'chat', 'files', 'wiki'];
        }
        return Array.isArray(tabs) ? tabs : ['news', 'members', 'events', 'chat', 'files', 'wiki'];
      } catch (e) {
        console.error('Error parsing enabled tabs:', e);
      }
    }
    return ['news', 'members', 'events', 'chat', 'files', 'wiki'];
  });
  
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpdateNetwork = async (e) => {
    e.preventDefault();
    
    if (!networkName.trim()) {
      setError('Network name cannot be empty.');
      return;
    }
    
    setUpdating(true);
    setError(null);
    setMessage('');
    
    const updates = { 
      name: networkName,
      description: networkDescription,
      privacy_level: privacyLevel,
      purpose: purpose,
      features_config: JSON.stringify({
        events: features.events,
        news: features.news,
        files: features.files,
        chat: features.chat,
        wiki: features.wiki,
        moodboards: features.moodboards,
        location_sharing: features.location,
        notifications: features.notifications
      }),
      enabled_tabs: enabledTabs
    };
    
    const result = await updateNetworkDetails(network.id, updates);
    
    if (result.success) {
      onNetworkUpdate({ ...network, ...updates });
      setMessage('Network settings updated successfully!');
    } else {
      setError(result.message || 'Failed to update network. Please try again.');
    }
    
    setUpdating(false);
  };
  
  // Helper functions
  const handleFeatureToggle = (feature) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };
  
  const handleTabToggle = (tabId) => {
    setEnabledTabs(prev => {
      if (prev.includes(tabId)) {
        return prev.filter(id => id !== tabId);
      } else {
        return [...prev, tabId];
      }
    });
  };
  
  const availableTabs = [
    { id: 'news', label: 'News', icon: <ArticleIcon fontSize="small" /> },
    { id: 'members', label: 'Members', icon: <GroupsIcon fontSize="small" /> },
    { id: 'events', label: 'Events', icon: <EventIcon fontSize="small" /> },
    { id: 'chat', label: 'Chat', icon: <ForumIcon fontSize="small" /> },
    { id: 'files', label: 'Files', icon: <FileIcon fontSize="small" /> },
    { id: 'wiki', label: 'Wiki', icon: <WikiIcon fontSize="small" /> },
    { id: 'social', label: 'Social Wall', icon: <TimelineIcon fontSize="small" /> }
  ];
  
  const featuresList = [
    { key: 'events', label: 'Events', icon: <EventIcon />, description: 'Create and manage events' },
    { key: 'news', label: 'News & Announcements', icon: <ArticleIcon />, description: 'Share news and updates' },
    { key: 'files', label: 'File Sharing', icon: <FileIcon />, description: 'Share files and documents' },
    { key: 'chat', label: 'Group Chat', icon: <ForumIcon />, description: 'Real-time communication' },
    { key: 'wiki', label: 'Knowledge Wiki', icon: <WikiIcon />, description: 'Create knowledge resources' },
    { key: 'moodboards', label: 'Moodboards', icon: <ImageIcon />, description: 'Visual collaboration boards' },
    { key: 'location', label: 'Location Sharing', icon: <LocationIcon />, description: 'Member location sharing' },
    { key: 'notifications', label: 'Notifications', icon: <NotificationsIcon />, description: 'Email notifications' }
  ];

  return (
    <Box>
      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleUpdateNetwork}>
        {/* Network Information */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', fontWeight: 'medium' }}>
              <SettingsIcon sx={{ mr: 1 }} />
              Network Information
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth
                  label="Network Name"
                  variant="outlined"
                  value={networkName}
                  onChange={(e) => setNetworkName(e.target.value)}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: darkMode ? alpha(muiTheme.palette.background.paper, 0.6) : alpha(muiTheme.palette.background.default, 0.6),
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField 
                  fullWidth
                  label="Network Description"
                  variant="outlined"
                  value={networkDescription}
                  onChange={(e) => setNetworkDescription(e.target.value)}
                  multiline
                  rows={4}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: darkMode ? alpha(muiTheme.palette.background.paper, 0.6) : alpha(muiTheme.palette.background.default, 0.6),
                    }
                  }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Privacy & Purpose */}
        <Accordion defaultExpanded sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', fontWeight: 'medium' }}>
              <LockIcon sx={{ mr: 1 }} />
              Privacy & Purpose
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Network Privacy</FormLabel>
                  <RadioGroup
                    value={privacyLevel}
                    onChange={(e) => setPrivacyLevel(e.target.value)}
                  >
                    <FormControlLabel 
                      value="private" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LockIcon fontSize="small" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body1">Private</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Only invited members can join
                            </Typography>
                          </Box>
                        </Box>
                      } 
                    />
                    <FormControlLabel 
                      value="restricted" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <GroupsIcon fontSize="small" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body1">Restricted</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Members need approval
                            </Typography>
                          </Box>
                        </Box>
                      } 
                    />
                    <FormControlLabel 
                      value="public" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PublicIcon fontSize="small" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body1">Public</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Anyone can join
                            </Typography>
                          </Box>
                        </Box>
                      } 
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Network Purpose</FormLabel>
                  <RadioGroup
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    <FormControlLabel value="general" control={<Radio />} label="General Community" />
                    <FormControlLabel value="professional" control={<Radio />} label="Professional Team" />
                    <FormControlLabel value="interest" control={<Radio />} label="Interest Group" />
                    <FormControlLabel value="education" control={<Radio />} label="Educational" />
                    <FormControlLabel value="nonprofit" control={<Radio />} label="Non-profit" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Features Configuration */}
        <Accordion defaultExpanded sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', fontWeight: 'medium' }}>
              <FeaturesIcon sx={{ mr: 1 }} />
              Features & Modules
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {featuresList.map(feature => (
                <Grid item xs={12} sm={6} key={feature.key}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderColor: features[feature.key] ? 'primary.main' : 'divider',
                      bgcolor: features[feature.key] ? alpha(muiTheme.palette.primary.main, 0.05) : 'transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(muiTheme.palette.primary.main, 0.08)
                      }
                    }}
                    onClick={() => handleFeatureToggle(feature.key)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ color: 'primary.main', mr: 2 }}>
                        {feature.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">{feature.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </Box>
                      <Switch
                        checked={features[feature.key]}
                        onChange={() => handleFeatureToggle(feature.key)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Navigation Tabs */}
        <Accordion defaultExpanded sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', fontWeight: 'medium' }}>
              <ViewModuleIcon sx={{ mr: 1 }} />
              Navigation Tabs
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which tabs will appear in your network navigation.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableTabs
                .filter(tab => features[tab.id] !== false)
                .map((tab) => (
                  <Chip
                    key={tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    clickable
                    color={enabledTabs.includes(tab.id) ? 'primary' : 'default'}
                    variant={enabledTabs.includes(tab.id) ? 'filled' : 'outlined'}
                    onClick={() => handleTabToggle(tab.id)}
                  />
                ))}
            </Box>
          </AccordionDetails>
        </Accordion>
        
        {/* Save Button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={updating ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={updating}
            type="submit"
            size="large"
            sx={{ 
              fontWeight: 'medium',
              px: 4,
              py: 1.5,
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: darkMode ? '0 6px 16px rgba(0,0,0,0.3)' : '0 4px 10px rgba(0,0,0,0.15)',
              }
            }}
          >
            {updating ? 'Saving All Settings...' : 'Save All Changes'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default NetworkSettingsTab;