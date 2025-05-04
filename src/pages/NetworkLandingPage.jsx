import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { fetchNetworkMembers } from '../api/networks';
import ArticleIcon from '@mui/icons-material/Article';
import ChatIcon from '@mui/icons-material/Chat';
import TimelineIcon from '@mui/icons-material/Timeline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MailIcon from '@mui/icons-material/Mail';
import backgroundImage from '../assets/test.jpeg';
import { Attachment } from '@mui/icons-material';


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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
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
import AttachmentIcon from '@mui/icons-material/Attachment';
import FilesTab from '../components/FilesTab';

function NetworkLandingPage() {
  const { networkId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  
  const [network, setNetwork] = useState(null);
  const [networkMembers, setNetworkMembers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [networkNews, setNetworkNews] = useState([]);
  const [socialWallItems, setSocialWallItems] = useState([]);
  const [userParticipations, setUserParticipations] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [membersTabDarkMode, setMembersTabDarkMode] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!networkId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch network data
        const { data: networkData, error: networkError } = await supabase
          .from('networks')
          .select('*')
          .eq('id', networkId)
          .single();
          
        if (networkError) throw networkError;
        setNetwork(networkData);
        
        // Generate shareable link
        const baseUrl = window.location.origin;
        setShareableLink(`${baseUrl}/network/${networkId}`);
        
        // Fetch network members
        const members = await fetchNetworkMembers(networkId);
        setNetworkMembers(members || []);

        // Fetch network events
        const { data: eventsData, error: eventsError } = await supabase
          .from('network_events')
          .select('*')
          .eq('network_id', networkId)
          .order('date', { ascending: true });
 
        if (eventsError) console.error('Error fetching events:', eventsError);
        setEvents(eventsData || []);

        const { data: newsData, error: newsError } = await supabase
          .from('network_news')
          .select('*')
          .eq('network_id', networkId)
          .order('created_at', { ascending: false });

        if (newsError) console.error('News error:', newsError);
        setNetworkNews(newsData || []);
        
        // If user is logged in, get their profile and participations
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (!profileError) {
            setUserProfile(profileData);
            
            // Fetch user's event participations
            const { data: participations, error: participationsError } = await supabase
              .from('event_participations')
              .select('event_id, status')
              .eq('profile_id', user.id);
              
            if (!participationsError) {
              setUserParticipations(participations || []);
            }
          }
        }

        const portfolioItems = [];
        // Fetch all portfolio items for network members in a single query
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolio_items')
          .select('*, profiles:profile_id(id, full_name, profile_picture_url)')
          .in('profile_id', members.map(member => member.id))
          .order('created_at', { ascending: false });
          
        if (!portfolioError && portfolioData) {
          // Map the results to include member information
          const portfolioWithMember = portfolioData.map(item => ({
            ...item,
            memberName: item.profiles?.full_name,
            memberAvatar: item.profiles?.profile_picture_url,
            memberId: item.profiles?.id,
            itemType: 'portfolio'
          }));
          
          portfolioItems.push(...portfolioWithMember);
        }

        const combinedFeed = [
          ...newsData.map(item => ({
            ...item,
            itemType: 'news',
            createdAt: item.created_at
          })),
          ...portfolioItems.map(item => ({
            ...item,
            createdAt: item.created_at || new Date().toISOString()
          }))
        ];

        // Sort by creation date
        combinedFeed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSocialWallItems(combinedFeed);

      } catch (error) {
        console.error('Error fetching network data:', error);
        setError('Failed to load network information. It may not exist or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [networkId, user]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const isUserMember = userProfile && userProfile.network_id === networkId;
  const isUserAdmin = isUserMember && userProfile.role === 'admin';
  
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

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '50vh' 
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
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Network Not Found
          </Typography>
          <Typography variant="body1" paragraph>
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
          backgroundImage: `url(${backgroundImage})`,
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
                color: 'white',
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
                sx={{ ml: 'auto', mr: 1 }}
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
                color: 'white',
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
                InputProps={{
                  readOnly: true,
                  sx: {
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
                  bgcolor: 'white', 
                  ml: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  }
                }}
              >
                <ContentCopyIcon />
              </IconButton>
              {copied && (
                <Typography variant="caption" sx={{ ml: 1, color: 'white', bgcolor: 'success.main', px: 1, py: 0.5, borderRadius: 1 }}>
                  Copied!
                </Typography>
              )}
            </Box>
          )}
          
          {network.description && (
            <Typography 
              variant="body1" 
              paragraph 
              sx={{ 
                mt: 2, 
                color: 'white',
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
      
      <Paper sx={{ width: '100%', mb: 3, backgroundColor: 'white' }}>
      <Tabs
  value={activeTab}
  onChange={handleTabChange}
  indicatorColor="primary"
  textColor="primary"
  variant="fullWidth"
>
  <Tab icon={<GroupsIcon />} label="Members" />
  <Tab icon={<EventIcon />} label="Events" />
  <Tab icon={<ArticleIcon />} label="News" />
  <Tab icon={<ChatIcon />} label="Chat" />
  <Tab icon={<TimelineIcon />} label="Social Wall" />
  <Tab icon={<MenuBookIcon />} label="Wiki" />
  <Tab icon={<AttachmentIcon />} label="Files" /> {/* New Files tab */}
  <Tab icon={<InfoIcon />} label="About" />
</Tabs>
      </Paper>

      {/* Conditionally render the appropriate tab component */}
      {activeTab === 0 && (
        <MembersTab 
          networkMembers={networkMembers}
          user={user}
          isUserAdmin={isUserAdmin}
          networkId={networkId}
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
        />
      )}

      {activeTab === 2 && (
        <NewsTab
          networkNews={networkNews}
          networkMembers={networkMembers}
        />
      )}

      {activeTab === 3 && (
        <ChatTab
          networkId={networkId}
          isUserMember={isUserMember}
        />
      )}

      {activeTab === 4 && (
        <SocialWallTab
          socialWallItems={socialWallItems}
          networkMembers={networkMembers}
        />
      )}

      {activeTab === 5 && (
        <WikiTab
          networkId={networkId}
          isUserMember={isUserMember}
        />
      )}

      {activeTab === 7 && (
        <AboutTab
          network={network}
          networkMembers={networkMembers}
          isUserAdmin={isUserAdmin}
        />
      )}

{activeTab === 6 && (
  <FilesTab
    networkId={networkId}
    isUserMember={isUserMember}
  />
)}

      
      {/* Member details modal */}
      <MemberDetailsModal
        open={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        member={selectedMember}
        portfolioItems={[]} // You could fetch the member's portfolio items here
        isCurrentUser={selectedMember?.id === user?.id}
        darkMode={membersTabDarkMode}
      />
      
      {!isUserMember && user && (
        <Paper sx={{ p: 3, mt: 3, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="h6" gutterBottom>
            You're not a member of this network
          </Typography>
          <Typography variant="body1" paragraph>
            Contact a network administrator to request joining this network.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

export default NetworkLandingPage;