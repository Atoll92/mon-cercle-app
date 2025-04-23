// src/pages/NetworkLandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { fetchNetworkMembers } from '../api/networks';
import ArticleIcon from '@mui/icons-material/Article';
import ChatIcon from '@mui/icons-material/Chat';
import Chat from '../components/Chat';
import TimelineIcon from '@mui/icons-material/Timeline';
import EventParticipation from '../components/EventParticipation';
import EventsMap from '../components/EventsMap';
import backgroundImage from '../assets/test.jpeg';

import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Tooltip,
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
  LocationOn as LocationOnIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon
} from '@mui/icons-material';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MailIcon from '@mui/icons-material/Mail';

import MemberDetailsModal from '../components/MembersDetailModal';
import MembersTab from '../components/MembersTab';

import {
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const locales = {
  'en-US': enUS,
};
  
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});
  
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
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [networkNews, setNetworkNews] = useState([]);
  const [socialWallItems, setSocialWallItems] = useState([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
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
        for (const member of members) {
          const { data: memberPortfolio, error: portfolioError } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('profile_id', member.id)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (!portfolioError && memberPortfolio) {
            // Add member information to each portfolio item
            const portfolioWithMember = memberPortfolio.map(item => ({
              ...item,
              memberName: member.full_name,
              memberAvatar: member.profile_picture_url,
              memberId: member.id,
              itemType: 'portfolio'
            }));
            portfolioItems.push(...portfolioWithMember);
          }
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
  
  const handleEventSelect = (event) => {
    // Handle event selection from calendar
    if (event.resource) {
      setSelectedEvent(event.resource);
      setShowEventDialog(true);
    }
  };
  
  const closeEventDialog = () => {
    setShowEventDialog(false);
    setSelectedEvent(null);
  };

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
    <Tab icon={<MenuBookIcon />} label="Wiki" /> {/* Add this new tab */}
    <Tab icon={<InfoIcon />} label="About" />
  </Tabs>
</Paper>

{activeTab === 5 && ( // Adjust this index if you placed the Wiki tab at a different position
  <Paper sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Network Wiki
      </Typography>
      
      <Button
        variant="contained"
        color="primary"
        component={Link}
        to={`/network/${networkId}/wiki`}
      >
        Go to Wiki
      </Button>
    </Box>
    
    <Divider sx={{ mb: 3 }} />
    
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Typography variant="body1" paragraph>
        The network wiki is a collaborative knowledge base where members can share information,
        documentation, and resources related to this network.
      </Typography>
      
      <Button
        variant="contained"
        color="primary"
        component={Link}
        to={`/network/${networkId}/wiki`}
        sx={{ mt: 2 }}
      >
        Browse Wiki Pages
      </Button>
      
      {isUserMember && (
        <Button
          variant="outlined"
          component={Link}
          to={`/network/${networkId}/wiki/new`}
          sx={{ mt: 2, ml: 2 }}
        >
          Create New Page
        </Button>
      )}
    </Box>
  </Paper>
)}

      {activeTab === 4 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Network Social Wall
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {socialWallItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No activity to display yet.
              </Typography>
            </Box>
          ) : (
            <Box className="projects-grid" sx={{ mt: 2 }}>
              {socialWallItems.map((item, index) => (
                <div key={`${item.itemType}-${item.id}`} className="project-card">
                  <div className="project-card-inner">
                    {/* Header with user info */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 2, 
                      borderBottom: '1px solid', 
                      borderColor: 'divider'
                    }}>
                      <Avatar 
                        src={item.itemType === 'portfolio' ? item.memberAvatar : 
                            networkMembers.find(m => m.id === item.created_by)?.profile_picture_url} 
                        sx={{ mr: 1.5, width: 40, height: 40 }}
                      >
                        {item.itemType === 'portfolio' ? 
                          (item.memberName ? item.memberName.charAt(0).toUpperCase() : 'U') : 
                          (networkMembers.find(m => m.id === item.created_by)?.full_name?.charAt(0).toUpperCase() || 'U')}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {item.itemType === 'portfolio' ? 
                            item.memberName : 
                            networkMembers.find(m => m.id === item.created_by)?.full_name || 'Network Admin'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={item.itemType === 'portfolio' ? 'Portfolio' : 'News'} 
                            sx={{ ml: 1, height: 20 }}
                            color={item.itemType === 'portfolio' ? 'secondary' : 'primary'}
                          />
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Image for portfolio items */}
                    {item.itemType === 'portfolio' && item.image_url && (
                      <div className="project-thumbnail" style={{ height: 160 }}>
                        <img 
                          src={item.image_url} 
                          alt={item.title}
                        />
                      </div>
                    )}
                    
                    {/* Content based on item type */}
                    <div className="project-info">
                      <h4 className="project-title">{item.title}</h4>
                      
                      {item.itemType === 'portfolio' ? (
                        <p className="project-description">{item.description}</p>
                      ) : (
                        <div 
                          className="project-description tiptap-output"
                          dangerouslySetInnerHTML={{ 
                            __html: item.content && item.content.length > 150 
                              ? item.content.substring(0, 150) + '...' 
                              : item.content 
                          }}
                        />
                      )}
                      
                      {item.itemType === 'portfolio' && item.url ? (
                        <a 
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-project-btn"
                        >
                          View Project
                        </a>
                      ) : (
                        <Link 
                          to={item.itemType === 'portfolio' ? 
                            `/profile/${item.memberId}` : 
                            `/news/${item.id}`}
                          className="view-project-btn"
                          style={{ display: 'inline-block', textDecoration: 'none' }}
                        >
                          {item.itemType === 'portfolio' ? 'View Profile' : 'Read Full Post'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </Box>
          )}
        </Paper>
      )}
      
      {activeTab === 0 && (
  <Paper sx={{ p: 3 }}>
    <MembersTab 
      networkMembers={networkMembers}
      user={user}
      isUserAdmin={isUserAdmin}
      networkId={networkId}
      loading={loading}
      darkMode={membersTabDarkMode}
      onMemberSelect={handleMemberSelect}
    />
    
   
    
    {/* Member details modal */}
    <MemberDetailsModal
      open={showMemberModal}
      onClose={() => setShowMemberModal(false)}
      member={selectedMember}
      portfolioItems={[]} // You could fetch the member's portfolio items here
      isCurrentUser={selectedMember?.id === user?.id}
      darkMode={membersTabDarkMode}
    />
  </Paper>
)}

{activeTab === 1 && (
  <Paper sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Events Calendar
      </Typography>
      
      {isUserAdmin && (
        <Button
          component={Link}
          to="/admin"
          startIcon={<EventIcon />}
          color="primary"
          variant="contained"
        >
          Manage Events
        </Button>
      )}
    </Box>
    
    <Divider sx={{ mb: 3 }} />
    
    {/* Add the Events Map */}
    <Paper 
      elevation={0} 
      variant="outlined" 
      sx={{ 
        mb: 3, 
        borderRadius: 2, 
        overflow: 'hidden' 
      }}
    >
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOnIcon sx={{ mr: 1 }} color="primary" />
          Events Map
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Geographic view of upcoming events
        </Typography>
      </Box>
      <EventsMap 
        events={events} 
        onEventSelect={(event) => {
          setSelectedEvent(event);
          setShowEventDialog(true);
        }}
      />
    </Paper>
    
    <Box sx={{ height: 600 }}>
      {/* Existing Calendar component remains the same */}
      <Calendar
        localizer={localizer}
        events={events.map(event => {
          // Find if user is participating in this event
          const participation = userParticipations.find(p => p.event_id === event.id);
          let eventColor = '#2196f3'; // Default blue
          
          // Color coding based on participation status
          if (participation) {
            if (participation.status === 'attending') eventColor = '#4caf50'; // Green
            else if (participation.status === 'maybe') eventColor = '#ff9800'; // Orange
            else if (participation.status === 'declined') eventColor = '#f44336'; // Red
          }
          
          return {
            title: event.title,
            start: new Date(event.date),
            end: new Date(event.date),
            allDay: true,
            resource: event,
            color: eventColor,
            coverImage: event.cover_image_url
          };
        })}
        date={calendarDate}
        view={calendarView}
        onView={setCalendarView}
        onNavigate={setCalendarDate}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={handleEventSelect}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.color,
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            color: 'white'
          }
        })}
        components={{
          event: ({ event }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                padding: '2px'
              }}
            >
              {event.coverImage && (
                <Box
                  sx={{
                    width: '28px',
                    height: '28px',
                    marginRight: '4px',
                    flexShrink: 0,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={event.coverImage}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              )}
              <Typography
                variant="caption"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 'medium'
                }}
              >
                {event.title}
              </Typography>
            </Box>
          ),
          
          // Rest of the components remain the same
          // ...existing component definitions...
        }}
        popup
        selectable
        views={['month', 'week', 'day']}
      />
    </Box>
    
    <Box sx={{ mt: 4 }}>
  <Typography variant="h6" gutterBottom>
    Upcoming Events
  </Typography>
  <Grid container spacing={3}>
    {events
      .filter(event => new Date(event.date) > new Date())
      .map(event => {
        // Find user participation for this event
        const participation = userParticipations.find(p => p.event_id === event.id);
        
        return (
          <Grid item xs={12} sm={6} md={4} key={event.id}>
            <Card sx={{ 
              position: 'relative',
              borderTop: participation ? 
                `4px solid ${
                  participation.status === 'attending' ? '#4caf50' : 
                  participation.status === 'maybe' ? '#ff9800' : '#f44336'
                }` : 'none',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Add cover image */}
              {event.cover_image_url && (
                <Box sx={{ 
                  height: 140, 
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <img
                    src={event.cover_image_url}
                    alt={event.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {event.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(event.date).toLocaleDateString()} • {event.location}
                </Typography>
                {event.description && (
                  <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                    {event.description.length > 100 
                      ? `${event.description.substring(0, 100)}...` 
                      : event.description}
                  </Typography>
                )}
                
                {/* Location coordinates indicator */}
                {event.coordinates && event.coordinates.latitude && (
                  <Chip 
                    icon={<LocationOnIcon fontSize="small" />}
                    label="Has location"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mt: 1, mb: 1 }}
                  />
                )}
                
                {/* RSVP Component */}
                {user && (
                  <Box sx={{ mt: 2 }}>
                    <EventParticipation 
                      event={event} 
                      size="small"
                      onStatusChange={(status) => handleParticipationChange(event.id, status)}
                    />
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventDialog(true);
                  }}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
  </Grid>
  
  {events.filter(event => new Date(event.date) > new Date()).length === 0 && (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Typography variant="body1" color="text.secondary">
        No upcoming events scheduled
      </Typography>
      {isUserAdmin && (
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/admin"
          startIcon={<EventIcon />}
          sx={{ mt: 2 }}
        >
          Create Event
        </Button>
      )}
    </Box>
  )}
</Box>
  </Paper>
)}
      
      {activeTab === 6 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            About This Network
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Network Details
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Network ID:</strong> {network.id}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Created:</strong> {new Date(network.created_at).toLocaleDateString()}
                    </Typography>
                    
                    {network.created_by && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Created by:</strong> {
                          networkMembers.find(m => m.id === network.created_by)?.full_name || 'Unknown'
                        }
                      </Typography>
                    )}
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Members:</strong> {networkMembers.length}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Administrators:</strong> {
                        networkMembers.filter(m => m.role === 'admin').length
                      }
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  
                  {network.description ? (
                    <Typography variant="body1" paragraph>
                      {network.description}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No description provided for this network.
                    </Typography>
                  )}
                  
                  {isUserAdmin && (
                    <Button
                      variant="outlined"
                      component={Link}
                      to="/admin"
                      sx={{ mt: 2 }}
                    >
                      Edit Network Details
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Network News
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {networkNews.map(post => (
            <Card key={post.id} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {post.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Posted by {networkMembers.find(m => m.id === post.created_by)?.full_name || 'Admin'} • 
                  {new Date(post.created_at).toLocaleDateString()}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <div 
                  className="tiptap-output"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                  style={{
                    '& ul': { listStyleType: 'disc', pl: 2 },
                    '& ol': { listStyleType: 'decimal', pl: 2 },
                    '& h1': { fontSize: '2em' },
                    '& h2': { fontSize: '1.5em' }
                  }}
                />
              </CardContent>
            </Card>
          ))}
          {networkNews.length === 0 && (
            <Typography variant="body1" color="text.secondary">
              No news posts available
            </Typography>
          )}
        </Paper>
      )}

      {activeTab === 3 && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            Network Chat
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {isUserMember ? (
            <Chat networkId={networkId} />
          ) : (
            <Alert severity="info">
              You must be a member of this network to participate in the chat
            </Alert>
          )}
        </Paper>
      )}
      
      {/* Event Details Dialog */}
      <Dialog
  open={showEventDialog}
  onClose={closeEventDialog}
  maxWidth="md"
  fullWidth
>
  {selectedEvent && (
    <>
      <DialogTitle>
        {selectedEvent.title}
      </DialogTitle>
      <DialogContent dividers>
        {selectedEvent.cover_image_url && (
          <Box sx={{ 
            width: '100%', 
            height: 300, 
            mb: 3,
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            <img 
              src={selectedEvent.cover_image_url} 
              alt={selectedEvent.title}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }} 
            />
          </Box>
        )}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Location:</strong> {selectedEvent.location}
          </Typography>
          {selectedEvent.capacity && (
            <Typography variant="subtitle1" gutterBottom>
              <strong>Capacity:</strong> {selectedEvent.capacity}
            </Typography>
          )}
        </Box>
        
        {selectedEvent.description && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {selectedEvent.description}
            </Typography>
          </Box>
        )}
        
        {user && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your RSVP
            </Typography>
            <EventParticipation 
              event={selectedEvent}
              showParticipants={true}
              onStatusChange={(status) => handleParticipationChange(selectedEvent.id, status)}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeEventDialog}>
          Close
        </Button>
      </DialogActions>
    </>
  )}
</Dialog>
      
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