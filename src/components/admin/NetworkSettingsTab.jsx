import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation.jsx';
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
  Description as DescriptionIcon,
  School as CoursesIcon,
  Store as MarketplaceIcon,
  AddReactionOutlined as ReactionsIcon,
  Feed as ActivityFeedIcon
} from '@mui/icons-material';
import { updateNetworkDetails } from '../../api/networks';
import { triggerNetworkRefresh } from '../../hooks/useNetworkRefresh';
import { getDefaultTabDescriptions } from '../../utils/tabDescriptions';

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
  const { t, language } = useTranslation();
  const muiTheme = useMuiTheme();

  // Get default tab descriptions based on current language
  const defaultTabDescriptions = getDefaultTabDescriptions(language);
  
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
          notifications: config.notifications !== false,
          courses: config.courses || false,
          marketplace: config.marketplace || false,
          reactions: config.reactions !== false,
          activity_feed: config.activity_feed || false
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
      notifications: true,
      courses: false,
      marketplace: false,
      reactions: true,
      activity_feed: false
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
      setError(t('admin.networkSettings.errors.nameCannotBeEmpty'));
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
        notifications: features.notifications,
        courses: features.courses,
        marketplace: features.marketplace,
        reactions: features.reactions,
        activity_feed: features.activity_feed
      }),
      enabled_tabs: enabledTabs,
      tab_descriptions: tabDescriptions
    };
    
    const result = await updateNetworkDetails(network.id, updates);
    
    if (result.success) {
      onNetworkUpdate({ ...network, ...updates });
      // Trigger global network refresh to update NetworkHeader and other components
      triggerNetworkRefresh(network.id);
      setMessage(t('admin.networkSettings.success.settingsUpdated'));
    } else {
      setError(result.message || t('admin.networkSettings.errors.updateFailed'));
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
      label: t('admin.networkSettings.tabs.news'), 
      icon: <ArticleIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.news
    },
    { 
      id: 'members', 
      label: t('admin.networkSettings.tabs.members'), 
      icon: <GroupsIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.members
    },
    { 
      id: 'events', 
      label: t('admin.networkSettings.tabs.events'), 
      icon: <EventIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.events
    },
    { 
      id: 'chat', 
      label: t('admin.networkSettings.tabs.chat'), 
      icon: <ForumIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.chat
    },
    { 
      id: 'files', 
      label: t('admin.networkSettings.tabs.files'), 
      icon: <FileIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.files
    },
    { 
      id: 'wiki', 
      label: t('admin.networkSettings.tabs.wiki'), 
      icon: <WikiIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.wiki
    },
    { 
      id: 'social', 
      label: t('admin.networkSettings.tabs.social'), 
      icon: <TimelineIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.social
    },
    { 
      id: 'courses', 
      label: t('admin.networkSettings.tabs.courses'), 
      icon: <CoursesIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.courses
    },
    { 
      id: 'marketplace', 
      label: t('admin.networkSettings.tabs.marketplace'), 
      icon: <MarketplaceIcon fontSize="small" />,
      defaultDescription: defaultTabDescriptions.marketplace
    }
  ];
  
  const featuresList = [
    { key: 'events', label: t('admin.networkSettings.features.events.label'), icon: <EventIcon />, description: t('admin.networkSettings.features.events.description') },
    { key: 'news', label: t('admin.networkSettings.features.news.label'), icon: <ArticleIcon />, description: t('admin.networkSettings.features.news.description') },
    { key: 'files', label: t('admin.networkSettings.features.files.label'), icon: <FileIcon />, description: t('admin.networkSettings.features.files.description') },
    { key: 'chat', label: t('admin.networkSettings.features.chat.label'), icon: <ForumIcon />, description: t('admin.networkSettings.features.chat.description') },
    { key: 'wiki', label: t('admin.networkSettings.features.wiki.label'), icon: <WikiIcon />, description: t('admin.networkSettings.features.wiki.description') },
    { key: 'moodboards', label: t('admin.networkSettings.features.moodboards.label'), icon: <ImageIcon />, description: t('admin.networkSettings.features.moodboards.description') },
    { key: 'reactions', label: t('admin.networkSettings.features.reactions.label'), icon: <ReactionsIcon />, description: t('admin.networkSettings.features.reactions.description') },
    { key: 'activity_feed', label: t('admin.networkSettings.features.activityFeed.label'), icon: <ActivityFeedIcon />, description: t('admin.networkSettings.features.activityFeed.description') },
    { key: 'courses', label: t('admin.networkSettings.features.courses.label'), icon: <CoursesIcon />, description: t('admin.networkSettings.features.courses.description') },
    { key: 'marketplace', label: t('admin.networkSettings.features.marketplace.label'), icon: <MarketplaceIcon />, description: t('admin.networkSettings.features.marketplace.description') },
    { key: 'location', label: t('admin.networkSettings.features.location.label'), icon: <LocationIcon />, description: t('admin.networkSettings.features.location.description') },
    { key: 'notifications', label: t('admin.networkSettings.features.notifications.label'), icon: <NotificationsIcon />, description: t('admin.networkSettings.features.notifications.description') }
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
{t('admin.networkSettings.sections.networkInformation')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3} direction="column">
              <Grid item xs={12} sx={{ width: '100%' }}>
                <TextField 
                  fullWidth
label={t('admin.networkSettings.fields.networkName')}
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
label={t('admin.networkSettings.fields.networkDescription')}
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
{t('admin.networkSettings.sections.privacyPurpose')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">{t('admin.networkSettings.fields.networkPrivacy')}</FormLabel>
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
                            <Typography variant="body1">{t('admin.networkSettings.privacy.private.label')}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('admin.networkSettings.privacy.private.description')}
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
                            <Typography variant="body1">{t('admin.networkSettings.privacy.restricted.label')}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('admin.networkSettings.privacy.restricted.description')}
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
                            <Typography variant="body1">{t('admin.networkSettings.privacy.public.label')}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('admin.networkSettings.privacy.public.description')}
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
                  <FormLabel component="legend">{t('admin.networkSettings.fields.networkPurpose')}</FormLabel>
                  <RadioGroup
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    <FormControlLabel value="general" control={<Radio />} label={t('admin.networkSettings.purpose.general')} />
                    <FormControlLabel value="professional" control={<Radio />} label={t('admin.networkSettings.purpose.professional')} />
                    <FormControlLabel value="interest" control={<Radio />} label={t('admin.networkSettings.purpose.interest')} />
                    <FormControlLabel value="education" control={<Radio />} label={t('admin.networkSettings.purpose.education')} />
                    <FormControlLabel value="nonprofit" control={<Radio />} label={t('admin.networkSettings.purpose.nonprofit')} />
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
{t('admin.networkSettings.sections.featuresModules')}
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
{t('admin.networkSettings.sections.navigationTabs')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
{t('admin.networkSettings.navigationTabs.description')}
            </Typography>
            
            {/* Enabled Tabs - Sortable */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
{t('admin.networkSettings.navigationTabs.enabledTabs')}
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
{t('admin.networkSettings.navigationTabs.availableTabs')}
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
{t('admin.networkSettings.sections.tabGuidelines')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
{t('admin.networkSettings.tabGuidelines.description')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
{t('admin.networkSettings.tabGuidelines.helpText')}
              </Typography>
            </Box>
            
            {/* Table header */}
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: '40px 140px 1fr 100px',
                gap: 2,
                mb: 2,
                px: 2,
                py: 1,
                bgcolor: alpha(muiTheme.palette.primary.main, 0.08),
                borderRadius: 1,
                alignItems: 'center'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
{t('admin.networkSettings.tabGuidelines.headers.icon')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
{t('admin.networkSettings.tabGuidelines.headers.feature')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
{t('admin.networkSettings.tabGuidelines.headers.description')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
{t('admin.networkSettings.tabGuidelines.headers.status')}
              </Typography>
            </Box>
            
            {/* Tab items */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {availableTabs
                .filter(tab => enabledTabs.includes(tab.id) && features[tab.id] !== false)
                .sort((a, b) => enabledTabs.indexOf(a.id) - enabledTabs.indexOf(b.id))
                .map((tab) => (
                  <Paper
                    key={tab.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderColor: tabDescriptions[tab.id] ? 'primary.main' : 'divider',
                      bgcolor: 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(muiTheme.palette.primary.main, 0.02),
                        transform: 'translateY(-1px)',
                        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 6px rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: {xs : '1fr', md: '40px 140px 1fr 100px'},

                        gap: 2,
                        alignItems: 'start'
                      }}
                    >
                      {/* Icon */}
                      <Box 
                        sx={{ 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '40px',
                          width: '40px',
                          borderRadius: 1,
                          bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                          color: 'primary.main'
                        }}
                      >
                        {tab.icon}
                      </Box>
                      
                      {/* Feature name and default */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                          {tab.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
{tabDescriptions[tab.id] ? t('admin.networkSettings.tabGuidelines.customized') : t('admin.networkSettings.tabGuidelines.usingDefault')}
                        </Typography>
                      </Box>
                      
                      {/* Description field */}
                      <Box>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          maxRows={4}
                          placeholder={tab.defaultDescription}
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
                              fontSize: '0.875rem',
                              lineHeight: 1.4
                            },
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: 'primary.main',
                              },
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {tabDescriptions[tab.id] 
? `${tabDescriptions[tab.id].length}/200 ${t('admin.networkSettings.tabGuidelines.characters')}` 
                              : t('admin.networkSettings.tabGuidelines.usingDefaultDescription')}
                          </Typography>
                          {tabDescriptions[tab.id] && (
                            <Button
                              size="small"
                              onClick={() => handleTabDescriptionChange(tab.id, '')}
                              sx={{ 
                                fontSize: '0.75rem', 
                                py: 0,
                                minHeight: 'auto',
                                textTransform: 'none'
                              }}
                            >
{t('admin.networkSettings.tabGuidelines.resetToDefault')}
                            </Button>
                          )}
                        </Box>
                      </Box>
                      
                      {/* Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'start', pt: 1 }}>
                        <Chip
label={tabDescriptions[tab.id] ? t('admin.networkSettings.tabGuidelines.custom') : t('admin.networkSettings.tabGuidelines.default')}
                          size="small"
                          color={tabDescriptions[tab.id] ? 'primary' : 'default'}
                          variant={tabDescriptions[tab.id] ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                ))}
            </Box>
            
            {enabledTabs.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
{t('admin.networkSettings.tabGuidelines.enableTabsToAddDescriptions')}
              </Alert>
            )}
            
            {/* Help section */}
            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(muiTheme.palette.info.main, 0.08), borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'medium', mb: 1 }}>
                <EditIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
{t('admin.networkSettings.tabGuidelines.tipsForWriting')}
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 } }}>
                <li>{t('admin.networkSettings.tabGuidelines.tips.concise')}</li>
                <li>{t('admin.networkSettings.tabGuidelines.tips.explain')}</li>
                <li>{t('admin.networkSettings.tabGuidelines.tips.expectations')}</li>
                <li>{t('admin.networkSettings.tabGuidelines.tips.inclusive')}</li>
              </Box>
            </Box>
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
{updating ? t('admin.networkSettings.buttons.saving') : t('admin.networkSettings.buttons.saveAll')}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default NetworkSettingsTab;