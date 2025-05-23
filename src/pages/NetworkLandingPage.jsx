import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useTheme } from '../components/ThemeProvider';
import { useNetwork, NetworkProviderWithParams } from '../context/networkContext';
import { supabase } from '../supabaseclient';
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
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  IconButton,
  alpha,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  ContentCopy as ContentCopyIcon,
  Groups as GroupsIcon,
  Info as InfoIcon,
  Event as EventIcon,
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
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [userParticipations, setUserParticipations] = useState([]);
  
  // Generate shareable link
  const shareableLink = network ? `${window.location.origin}/network/${network.id}` : '';
  
  // Use the global darkMode state for members tab
  const membersTabDarkMode = darkMode;
  
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const isUserMember = user && network && userRole !== null;
  
  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };
  
  const handleParticipationChange = (eventId, newStatus) => {
    // Update userParticipations state when status changes
    setUserParticipations(prevParticipations => {
      const existing = prevParticipations.find(p => p.event_id === eventId);
      
      if (existing) {
        // If null (removed), filter it out
        if (newStatus === null) {
          return prevParticipations.filter(p => p.event_id !== eventId);
        }
        
        // Otherwise update it
        return prevParticipations.map(p => 
          p.event_id === eventId ? { ...p, status: newStatus } : p
        );
      } else if (newStatus) {
        // Add new participation if status isn't null
        return [...prevParticipations, { event_id: eventId, status: newStatus }];
      }
      
      return prevParticipations;
    });
  };

  // State to hold post items for all members (stored as portfolio_items in database)
  const [postItems, setPostItems] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  // Fetch user's event participations on component mount
  useEffect(() => {
    const fetchUserParticipations = async () => {
      if (!user || !events || events.length === 0) {
        console.log("SKIPPING participation fetch - missing data:", { 
          user: !!user, 
          events: !!events, 
          eventsLength: events?.length || 0 
        });
        return;
      }
      
      console.log("=== START PARTICIPATION FETCH ===");
      console.log("User ID:", user.id);
      console.log("Events count:", events.length);
      console.log("Event IDs for fetch:", events.map(e => e.id));
      
      try {
        // Refactor query to always return all possible participations
        const { data, error } = await supabase
          .from('event_participations')
          .select('*')
          .eq('profile_id', user.id);
        
        if (error) {
          console.error('Error fetching user participations:', error);
          return;
        }
        
        console.log("FULL Fetched participations:", data);
        
        // Filter to just participations for events in our current view
        const relevantParticipations = data.filter(p => 
          events.some(e => e.id === p.event_id)
        );
        
        console.log("FILTERED Fetched user participations:", relevantParticipations);
        console.log("Mapped Status by Event:", relevantParticipations.map(p => ({
          event_id: p.event_id,
          event_title: events.find(e => e.id === p.event_id)?.title || 'Unknown',
          status: p.status
        })));
        
        // Always set the state, even if empty
        setUserParticipations(relevantParticipations);
        
        console.log("=== END PARTICIPATION FETCH ===");
      } catch (err) {
        console.error('Error in fetchUserParticipations:', err);
      }
    };
    
    fetchUserParticipations();
  }, [user, events]);

  // Fetch post items for all network members (stored as portfolio_items in database)
  useEffect(() => {
    const fetchPostItems = async () => {
      if (!networkMembers || networkMembers.length === 0) return;
      
      setLoadingPosts(true);
      try {
        console.log("Fetching posts (stored as portfolio_items in the database)");
        // Fetch all portfolio items from the database (will display as posts in UI)
        const { data, error } = await supabase
          .from('portfolio_items')
          .select('*')
          .in('profile_id', networkMembers.map(m => m.id));
          
        if (error) throw error;
        
        console.log('Fetched posts from database:', data); // Debug log
        
        // Add member info to each post item
        const itemsWithMemberInfo = data.map(item => {
          const member = networkMembers.find(m => m.id === item.profile_id);
          return {
            ...item,
            itemType: 'post', // Item from portfolio_items table displayed as post
            createdAt: item.created_at,
            memberName: member?.full_name || 'Network Member',
            memberAvatar: member?.profile_picture_url || '',
            memberId: member?.id,
            // Ensure image_url is properly used - database field is still image_url
            image_url: item.image_url || item.file_url || ''
          };
        });
        
        console.log('Portfolio items transformed to posts with member info:', itemsWithMemberInfo); // Debug log
        setPostItems(itemsWithMemberInfo);
      } catch (err) {
        console.error('Error fetching post items:', err);
      } finally {
        setLoadingPosts(false);
      }
    };
    
    fetchPostItems();
  }, [networkMembers]);

  // Prepare social wall items
  const socialWallItems = React.useMemo(() => {
    // Create arrays for news and post items
    const newsItems = networkNews ? networkNews.map(item => ({
      ...item,
      itemType: 'news',
      createdAt: item.created_at
    })) : [];
    
    // Log the post items before combining
    console.log('Using post items in socialWallItems:', postItems);
    
    // Combine news and post items
    const combinedFeed = [...newsItems, ...postItems];
    
    // Sort by creation date
    combinedFeed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Log the final combined feed
    console.log('Final social wall items:', combinedFeed);
    
    return combinedFeed;
  }, [networkNews, postItems]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '50vh',
          color: muiTheme.palette.custom.lightText
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading network...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
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
    );
  }
  
  if (!network) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
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
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: 2,
          backgroundImage: network.background_image_url 
            ? `url(${network.background_image_url})` 
            : 'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)', // Default gradient if no image
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Dark overlay for better text readability */}
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 1
          }} 
        />
        
        {/* Content with increased z-index to be above the overlay */}
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Button
              component={Link}
              to="/dashboard"
              startIcon={<ArrowBackIcon />}
              sx={{ 
                mr: 2, 
                bgcolor: 'rgba(255, 255, 255, 0.2)', 
                color: '#ffffff',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              Dashboard
            </Button>
            
            {isUserAdmin && (
              <Button
                component={Link}
                to="/admin"
                startIcon={<AdminIcon />}
                color="primary"
                variant="contained"
                sx={{ 
                  ml: 'auto', 
                  mr: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.85)',
                  color: 'primary.dark',
                  fontWeight: 'medium',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  },
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Admin Panel
              </Button>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                mr: 2, 
                flexGrow: 1, 
                color: '#ffffff',
                textShadow: '1px 1px 3px rgba(0,0,0,0.7)'
              }}
            >
              {network.name}
            </Typography>
            
            <Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowShareLink(!showShareLink)}
                startIcon={<ContentCopyIcon />}
                size="small"
                sx={{ mb: { xs: 1, sm: 0 } }}
              >
                Share Network
              </Button>
            </Box>
          </Box>
          
          {showShareLink && (
            <Box sx={{ mt: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
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
                sx={{
                  '& .MuiInputBase-root': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,1)',
                    }
                  }
                }}
              />
              <IconButton 
                onClick={copyToClipboard} 
                color="primary"
                sx={{ 
                  bgcolor: '#ffffff', 
                  ml: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  }
                }}
              >
                <ContentCopyIcon />
              </IconButton>
              {copied && (
                <Typography variant="caption" sx={{ ml: 1, color: '#ffffff', bgcolor: 'success.main', px: 1, py: 0.5, borderRadius: 1 }}>
                  Copied!
                </Typography>
              )}
            </Box>
          )}
          
          {network.description && (
            <Typography 
              variant="body1" 
              gutterBottom 
              sx={{ 
                mt: 2, 
                color: '#ffffff',
                textShadow: '0px 1px 2px rgba(0,0,0,0.6)',
                maxWidth: '800px',
                bgcolor: 'rgba(0,0,0,0.3)',
                p: 2,
                borderRadius: 1
              }}
            >
              {network.description}
            </Typography>
          )}
        </Box>
      </Paper>
      
      <Paper 
        sx={{ 
          width: '100%', 
          mb: 3, 
          // Adjust background color based on dark mode
          backgroundColor: muiTheme.palette.background.paper,
          // Add a subtle border in dark mode to improve visibility
          border: `1px solid ${muiTheme.palette.custom.border}`,
          // Add shadow for better separation in dark mode
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          // Adjust text color for better contrast in dark mode
          textColor={darkMode ? "secondary" : "primary"}
          variant="fullWidth"
          sx={{
            // Add custom styles for dark mode
            '& .MuiTab-root': {
              color: muiTheme.palette.custom.fadedText,
              '&.Mui-selected': {
                color: muiTheme.palette.custom.lightText,
              },
            },
            // Make the indicator more visible in dark mode
            '& .MuiTabs-indicator': {
              backgroundColor: darkMode ? '#90caf9' : undefined,
              height: darkMode ? 3 : undefined,
            }
          }}
        >
          <Tab icon={<GroupsIcon />} label="Members" />
          <Tab icon={<EventIcon />} label="Events" />
          <Tab icon={<ArticleIcon />} label="News" />
          <Tab icon={<ChatIcon />} label="Chat" />
          <Tab icon={<TimelineIcon />} label="Social Wall" />
          <Tab icon={<MenuBookIcon />} label="Wiki" />
          <Tab icon={<AttachmentIcon />} label="Files" /> {/* Files tab */}
          <Tab icon={<InfoIcon />} label="About" />
        </Tabs>
      </Paper>

      {/* Conditionally render the appropriate tab component */}
      {activeTab === 0 && (
        <MembersTab 
          networkMembers={networkMembers}
          user={user}
          isUserAdmin={isUserAdmin}
          networkId={network.id}
          loading={loading}
          darkMode={membersTabDarkMode}
          onMemberSelect={handleMemberSelect}
        />
      )}

      {activeTab === 1 && (
        <EventsTab
          events={events}
          user={user}
          isUserAdmin={isUserAdmin}
          userParticipations={userParticipations}
          onParticipationChange={handleParticipationChange}
          darkMode={darkMode} // Pass dark mode to events tab
        />
      )}

      {activeTab === 2 && (
        <NewsTab
          networkNews={networkNews}
          networkMembers={networkMembers}
          darkMode={darkMode} // Pass dark mode to news tab
        />
      )}

      {activeTab === 3 && (
        <ChatTab
          networkId={network.id}
          isUserMember={isUserMember}
          darkMode={darkMode} // Pass dark mode to chat tab
        />
      )}

      {activeTab === 4 && (
        <SocialWallTab
          socialWallItems={socialWallItems}
          networkMembers={networkMembers}
          darkMode={darkMode} // Pass dark mode to social wall tab
        />
      )}

      {activeTab === 5 && (
        <WikiTab
          networkId={network.id}
          isUserMember={isUserMember}
          darkMode={darkMode} // Pass dark mode to wiki tab
        />
      )}

      {activeTab === 7 && (
        <AboutTab
          network={network}
          networkMembers={networkMembers}
          isUserAdmin={isUserAdmin}
          darkMode={darkMode} // Pass dark mode to about tab
        />
      )}

      {activeTab === 6 && (
        <FilesTab
          networkId={network.id}
          isUserMember={isUserMember}
          darkMode={darkMode} // Pass dark mode to files tab
          files={files}
        />
      )}
      
      {/* Member details modal */}
      <MemberDetailsModal
        open={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        member={selectedMember}
        portfolioItems={selectedMember ? postItems.filter(item => item.profile_id === selectedMember.id) : []}
        isCurrentUser={selectedMember?.id === user?.id}
        darkMode={membersTabDarkMode}
      />
      
      {!isUserMember && user && (
        <Paper 
          sx={{ 
            p: 3, 
            mt: 3, 
            backgroundColor: darkMode ? alpha('#1976d2', 0.2) : 'primary.light', 
            color: muiTheme.palette.custom.lightText,
            border: darkMode ? `1px solid ${alpha('#1976d2', 0.5)}` : 'none',
          }}
        >
          <Typography variant="h6" gutterBottom>
            You're not a member of this network
          </Typography>
          <Typography variant="body1" gutterBottom>
            Contact a network administrator to request joining this network.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

// Export the wrapper component instead of the base component
export default NetworkLandingPageWrapper;