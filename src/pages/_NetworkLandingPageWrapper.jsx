import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useTheme } from '../components/ThemeProvider';
import { useNetwork, NetworkProviderWithParams } from '../context/networkContext';
import { supabase } from '../supabaseclient';
import { useFadeIn, useStaggeredAnimation } from '../hooks/useAnimation';
import { GridSkeleton, ListItemSkeleton } from '../components/LoadingSkeleton';
import ArticleIcon from '@mui/icons-material/Article';
import ChatIcon from '@mui/icons-material/Chat';
import TimelineIcon from '@mui/icons-material/Timeline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AttachmentIcon from '@mui/icons-material/Attachment';

import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Tabs,
  Tab,
  TextField,
  IconButton,
  alpha,
  useTheme as useMuiTheme,
  AppBar,
  Toolbar
} from '@mui/material';
import Spinner from '../components/Spinner';
import {
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  ContentCopy as ContentCopyIcon,
  Groups as GroupsIcon,
  Info as InfoIcon,
  Event as EventIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

// Import the tab components
import MembersTab from '../components/MembersTab';
import EventsTab from '../components/EventsTab';
import NewsTab from '../components/NewsTab';
import ChatTab from '../components/ChatTab';
import SocialWallTab from '../components/SocialWallTab';
import WikiTab from '../components/WikiTab';
import AboutTab from '../components/AboutTab';
import MemberDetailsModal from '../components/MembersDetailModal';
import FilesTab from '../components/FilesTab';

// Create wrapper component that uses NetworkProviderWithParams
const NetworkLandingPageWrapper = () => (
  <NetworkProviderWithParams>
    <NetworkLandingPage />
  </NetworkProviderWithParams>
);

function NetworkLandingPage() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  
  // Use the network context instead of local state and API calls
  const {
    network,
    members: networkMembers,
    events,
    news: networkNews,
    files,
    loading,
    error,
    userRole,
    isAdmin: isUserAdmin
  } = useNetwork();
  
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [postItems, setPostItems] = useState([]);
  const [initialItemOrder, setInitialItemOrder] = useState([]);
  
  const headerRef = useRef(null);
  const contentRef = useRef(null);

  // Refs for staggered animations
  const containerRef = useRef(null);
  const { getItemRef } = useStaggeredAnimation(containerRef, { threshold: 0.1 });

  // Shareable link
  const shareableLink = `${window.location.origin}/join/${network?.id}`;

  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Combined feed for social wall
  const combinedSocialWallItems = useMemo(() => {
    if (!networkNews || !postItems) return [];
    
    let combinedFeed = [];
    
    // Add stable IDs and merge data
    const newsWithStableId = networkNews.map(item => ({
      ...item,
      type: 'news',
      stableId: `news-${item.id}`,
      createdAt: item.created_at
    }));
    
    const postsWithStableId = postItems.map(item => ({
      ...item,
      type: 'post',
      stableId: `post-${item.id}`,
      createdAt: item.created_at
    }));
    
    combinedFeed = [...newsWithStableId, ...postsWithStableId];
    
    // Use initial order if available for consistent sorting
    if (initialItemOrder.length > 0) {
      const itemMap = new Map(combinedFeed.map(item => [item.stableId, item]));
      const orderedItems = [];
      
      // First, add items in their stored order
      initialItemOrder.forEach(stableId => {
        const item = itemMap.get(stableId);
        if (item) {
          orderedItems.push(item);
          itemMap.delete(stableId);
        }
      });
      
      // Then add any new items at the beginning
      const newItems = Array.from(itemMap.values());
      newItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      combinedFeed = [...newItems, ...orderedItems];
    } else {
      // Initial sort by creation date
      combinedFeed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      if (combinedFeed.length > 0) {
        const order = combinedFeed.map(item => item.stableId);
        setInitialItemOrder(order);
      }
    }
    
    return combinedFeed;
  }, [networkNews, postItems, initialItemOrder]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: muiTheme.palette.background.default }}>
        {/* Compact loading header */}
        <Box sx={{ 
          height: 80, 
          background: 'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Spinner sx={{ color: 'white' }} />
        </Box>
        <Container maxWidth="lg" sx={{ pt: 2 }}>
          <GridSkeleton items={6} columns={3} />
        </Container>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: muiTheme.palette.background.default }}>
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }
  
  if (!network) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: muiTheme.palette.background.default }}>
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <Paper 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              bgcolor: muiTheme.palette.background.paper,
              color: muiTheme.palette.custom.lightText
            }}
          >
            <Typography variant="h5" component="h1" gutterBottom>
              Network Not Found
            </Typography>
            <Typography variant="body1" gutterBottom>
              The network you're looking for doesn't exist or you don't have permission to view it.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: muiTheme.palette.background.default }}>
      {/* Compact overlayed header with network background */}
      <Box
        sx={{
          position: 'relative',
          height: 80, // Same as standard app header
          backgroundImage: network.background_image_url 
            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${network.background_image_url})` 
            : 'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Header content */}
        <Container maxWidth="lg" sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Left side - Back button and network name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component={Link}
              to="/dashboard"
              startIcon={<ArrowBackIcon />}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.15)', 
                color: '#ffffff',
                minWidth: 'auto',
                px: 1.5,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                }
              }}
            >
              Dashboard
            </Button>
            
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
                fontWeight: 600,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {network.name}
            </Typography>
          </Box>
          
          {/* Right side - Action buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            alignItems: 'center'
          }}>
            {isUserAdmin && (
              <Button
                component={Link}
                to="/admin"
                startIcon={<AdminIcon />}
                size="small"
                variant="contained"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: 'primary.dark',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 1)',
                  },
                  minWidth: 'auto',
                  px: 1.5
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Admin
                </Box>
              </Button>
            )}
            
            <Button
              variant="contained"
              onClick={() => setShowShareLink(!showShareLink)}
              startIcon={<ContentCopyIcon />}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                color: 'primary.dark',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 1)',
                },
                minWidth: 'auto',
                px: 1.5
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Share
              </Box>
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Share link section - positioned right below header */}
      {showShareLink && (
        <Box sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          py: 1
        }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={shareableLink}
                size="small"
                fullWidth
                variant="outlined"
                slotProps={{
                  input: {
                    readOnly: true
                  }
                }}
                sx={{ maxWidth: 400 }}
              />
              <IconButton 
                onClick={copyToClipboard} 
                color="primary"
                size="small"
              >
                <ContentCopyIcon />
              </IconButton>
              {copied && (
                <Typography variant="caption" sx={{ 
                  color: 'success.main',
                  bgcolor: 'success.light',
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 1,
                  fontSize: '0.75rem'
                }}>
                  Copied!
                </Typography>
              )}
            </Box>
          </Container>
        </Box>
      )}

      {/* Network description - compact banner if exists */}
      {network.description && (
        <Box sx={{ 
          bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          py: 1
        }}>
          <Container maxWidth="lg">
            <Typography 
              variant="body2" 
              sx={{ 
                color: muiTheme.palette.text.secondary,
                textAlign: 'center',
                fontStyle: 'italic'
              }}
            >
              {network.description}
            </Typography>
          </Container>
        </Box>
      )}

      {/* Tabs navigation - immediately below header */}
      <Box sx={{ 
        bgcolor: muiTheme.palette.background.paper,
        borderBottom: `1px solid ${muiTheme.palette.divider}`,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Container maxWidth="lg">
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48, // Compact tabs
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem'
              }
            }}
          >
            <Tab 
              icon={<TimelineIcon />} 
              label="Social Wall" 
              iconPosition="start"
              sx={{ minWidth: 120 }}
            />
            <Tab 
              icon={<GroupsIcon />} 
              label={`Members (${networkMembers?.length || 0})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<EventIcon />} 
              label={`Events (${events?.length || 0})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<ArticleIcon />} 
              label={`News (${networkNews?.length || 0})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<ChatIcon />} 
              label="Chat" 
              iconPosition="start"
            />
            <Tab 
              icon={<MenuBookIcon />} 
              label="Wiki" 
              iconPosition="start"
            />
            <Tab 
              icon={<AttachmentIcon />} 
              label={`Files (${files?.length || 0})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<InfoIcon />} 
              label="About" 
              iconPosition="start"
            />
          </Tabs>
        </Container>
      </Box>
      
      {/* Main content area - starts immediately after tabs */}
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Paper
          elevation={0}
          sx={{
            backgroundColor: muiTheme.palette.background.paper,
            border: `1px solid ${muiTheme.palette.custom.border}`,
            borderRadius: 2,
            minHeight: 'calc(100vh - 200px)', // Ensure content fills remaining space
            overflow: 'hidden'
          }}
        >
          {/* Tab panels */}
          {activeTab === 0 && (
            <Box sx={{ p: 0 }}>
              <SocialWallTab 
                items={combinedSocialWallItems}
                loading={loading}
                networkId={network?.id}
              />
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <MembersTab 
                members={networkMembers}
                isAdmin={isUserAdmin}
                userRole={userRole}
                networkId={network?.id}
                onMemberClick={setSelectedMember}
              />
            </Box>
          )}
          
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              <EventsTab 
                events={events}
                isAdmin={isUserAdmin}
                networkId={network?.id}
                userId={user?.id}
              />
            </Box>
          )}
          
          {activeTab === 3 && (
            <Box sx={{ p: 0 }}>
              <NewsTab 
                news={networkNews}
                isAdmin={isUserAdmin}
                networkId={network?.id}
              />
            </Box>
          )}
          
          {activeTab === 4 && (
            <Box sx={{ p: 0, height: '70vh' }}>
              <ChatTab networkId={network?.id} />
            </Box>
          )}
          
          {activeTab === 5 && (
            <Box sx={{ p: 3 }}>
              <WikiTab 
                isAdmin={isUserAdmin}
                networkId={network?.id}
              />
            </Box>
          )}
          
          {activeTab === 6 && (
            <Box sx={{ p: 3 }}>
              <FilesTab 
                files={files}
                isAdmin={isUserAdmin}
                networkId={network?.id}
              />
            </Box>
          )}
          
          {activeTab === 7 && (
            <Box sx={{ p: 3 }}>
              <AboutTab 
                network={network}
                isAdmin={isUserAdmin}
              />
            </Box>
          )}
        </Paper>
      </Container>

      {/* Member details modal */}
      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          open={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          isAdmin={isUserAdmin}
          currentUserId={user?.id}
        />
      )}
    </Box>
  );
}

export default NetworkLandingPageWrapper;