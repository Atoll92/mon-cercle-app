import React, { useState, useEffect } from 'react';
import Spinner from '../Spinner';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import {
  CSS
} from '@dnd-kit/utilities';
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
  Timeline as TimelineIcon,
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { updateNetworkDetails } from '../../api/networks';
import { triggerNetworkRefresh } from '../../hooks/useNetworkRefresh';
import { defaultTabDescriptions } from '../../utils/tabDescriptions';

// Sortable Chip Component
const SortableTabChip = ({ tab, isSelected, onToggle, darkMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Chip
      ref={setNodeRef}
      style={style}
      {...attributes}
      icon={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            {...listeners}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
              color: 'inherit',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <DragIndicatorIcon sx={{ fontSize: '0.875rem' }} />
          </Box>
          {tab.icon}
        </Box>
      }
      label={tab.label}
      clickable
      color={isSelected ? 'primary' : 'default'}
      variant={isSelected ? 'filled' : 'outlined'}
      onClick={onToggle}
      sx={{
        '& .MuiChip-icon': {
          gap: 0.5,
        },
        cursor: isDragging ? 'grabbing' : 'pointer',
      }}
    />
  );
};

const NetworkSettingsTab = ({ network, onNetworkUpdate, darkMode }) => {
  const muiTheme = useMuiTheme();
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
  
  // Tab descriptions
  const [tabDescriptions, setTabDescriptions] = useState(() => {
    if (network?.tab_descriptions) {
      try {
        return typeof network.tab_descriptions === 'string' 
          ? JSON.parse(network.tab_descriptions) 
          : network.tab_descriptions || {};
      } catch (e) {
        console.error('Error parsing tab descriptions:', e);
        return {};
      }
    }
    return {};
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
      enabled_tabs: enabledTabs,
      tab_descriptions: tabDescriptions
    };
    
    const result = await updateNetworkDetails(network.id, updates);
    
    if (result.success) {
      onNetworkUpdate({ ...network, ...updates });
      // Trigger global network refresh to update NetworkHeader and other components
      triggerNetworkRefresh(network.id);
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
  
  const handleTabDescriptionChange = (tabId, description) => {
    setTabDescriptions(prev => ({
      ...prev,
      [tabId]: description
    }));
  };
  
  // Handle drag end for tab reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setEnabledTabs((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  const availableTabs = [
    { 
      id: 'news', 
      label: 'News', 
      icon: <ArticleIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.news
    },
    { 
      id: 'members', 
      label: 'Members', 
      icon: <GroupsIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.members
    },
    { 
      id: 'events', 
      label: 'Events', 
      icon: <EventIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.events
    },
    { 
      id: 'chat', 
      label: 'Chat', 
      icon: <ForumIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.chat
    },
    { 
      id: 'files', 
      label: 'Files', 
      icon: <FileIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.files
    },
    { 
      id: 'wiki', 
      label: 'Wiki', 
      icon: <WikiIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.wiki
    },
    { 
      id: 'social', 
      label: 'Social Wall', 
      icon: <TimelineIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.social
    }
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
            <Grid container spacing={3} direction="column">
              <Grid item xs={12} sx={{ width: '100%' }}>
                <TextField 
                  fullWidth
                  label="Network Name"
                  variant="outlined"
                  value={networkName}
                  onChange={(e) => setNetworkName(e.target.value)}
                  required
                  sx={{ width: '100%' }}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ width: '100%' }}>
                <TextField 
                  fullWidth
                  label="Network Description"
                  variant="outlined"
                  value={networkDescription}
                  onChange={(e) => setNetworkDescription(e.target.value)}
                  multiline
                  minRows={4}
                  maxRows={8}
                  sx={{
                    width: '100%',
                    '& .MuiInputBase-input': {
                      overflow: 'auto',
                      resize: 'vertical'
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
              Select which tabs will appear in your network navigation. Drag to reorder them.
            </Typography>
            
            {/* Enabled Tabs - Sortable */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                Enabled Tabs (Drag to reorder)
              </Typography>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={enabledTabs}
                  strategy={verticalListSortingStrategy}
                >
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {enabledTabs
                      .map(tabId => availableTabs.find(tab => tab.id === tabId))
                      .filter(tab => tab && features[tab.id] !== false)
                      .map((tab) => (
                        <SortableTabChip
                          key={tab.id}
                          tab={tab}
                          isSelected={true}
                          onToggle={() => handleTabToggle(tab.id)}
                          darkMode={darkMode}
                        />
                      ))}
                  </Box>
                </SortableContext>
              </DndContext>
            </Box>
            
            {/* Available Tabs - Not enabled */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                Available Tabs (Click to enable)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableTabs
                  .filter(tab => !enabledTabs.includes(tab.id) && features[tab.id] !== false)
                  .map((tab) => (
                    <Chip
                      key={tab.id}
                      icon={tab.icon}
                      label={tab.label}
                      clickable
                      color="default"
                      variant="outlined"
                      onClick={() => handleTabToggle(tab.id)}
                    />
                  ))}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Tab Descriptions */}
        <Accordion defaultExpanded sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', fontWeight: 'medium' }}>
              <DescriptionIcon sx={{ mr: 1 }} />
              Tab Feature Guidelines
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add custom descriptions for each tab to help members understand their purpose and usage guidelines.
            </Typography>
            
            <Grid container spacing={2}>
              {availableTabs
                .filter(tab => enabledTabs.includes(tab.id) && features[tab.id] !== false)
                .map((tab) => (
                  <Grid item xs={12} key={tab.id}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: alpha(muiTheme.palette.primary.main, 0.02)
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ color: 'primary.main', mr: 1 }}>
                          {tab.icon}
                        </Box>
                        <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 'medium' }}>
                          {tab.label}
                        </Typography>
                      </Box>
                      
                      {/* Show default description if no custom description is set */}
                      {!tabDescriptions[tab.id] && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                          Default: {tab.defaultDescription}
                        </Typography>
                      )}
                      
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={4}
                        placeholder={`Customize the description for the ${tab.label} tab...`}
                        value={tabDescriptions[tab.id] || ''}
                        onChange={(e) => {
                          if (e.target.value.length <= 200) {
                            handleTabDescriptionChange(tab.id, e.target.value);
                          }
                        }}
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: '0.875rem'
                          }
                        }}
                        helperText={
                          tabDescriptions[tab.id] 
                            ? `${tabDescriptions[tab.id].length}/200 characters` 
                            : 'Leave empty to use the default description'
                        }
                      />
                    </Paper>
                  </Grid>
                ))}
            </Grid>
            
            {enabledTabs.length === 0 && (
              <Alert severity="info">
                Enable some tabs in the Navigation Tabs section above to add descriptions for them.
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
        
        {/* Save Button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={updating ? <Spinner size={40} color="inherit" /> : <SaveIcon />}
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