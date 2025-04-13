// src/pages/NetworkLandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { fetchNetworkMembers } from '../api/networks';
import ArticleIcon from '@mui/icons-material/Article';
import ChatIcon from '@mui/icons-material/Chat';
import Chat from '../components/Chat';

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
  TextField,
  IconButton
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
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';



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
        
        // If user is logged in, get their profile to check if they're part of this network
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (!profileError) {
            setUserProfile(profileData);
          }
        }
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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            component={Link}
            to="/dashboard"
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Dashboard
          </Button>
          
          {isUserAdmin && (
            <Button
              component={Link}
              to="/admin"
              startIcon={<AdminIcon />}
              color="primary"
              variant="outlined"
              sx={{ ml: 'auto', mr: 1 }}
            >
              Admin Panel
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mr: 2, flexGrow: 1 }}>
            {network.name}
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
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
              }}
            />
            <IconButton onClick={copyToClipboard} color="primary">
              <ContentCopyIcon />
            </IconButton>
            {copied && (
              <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                Copied!
              </Typography>
            )}
          </Box>
        )}
        
        {network.description && (
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            {network.description}
          </Typography>
        )}
      </Paper>
      
      <Box sx={{ width: '100%', mb: 3 }}>
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
  <Tab icon={<InfoIcon />} label="About" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Network Members ({networkMembers.length})
            </Typography>
            
            {isUserAdmin && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                component={Link}
                to="/admin"
              >
                Invite Members
              </Button>
            )}
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {networkMembers.length === 0 ? (
            <Typography align="center" variant="body1" sx={{ py: 4 }}>
              No members found in this network.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {networkMembers.map(member => (
                <Grid item xs={12} sm={6} md={4} key={member.id}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 3
                    }
                  }}>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Avatar
                        src={member.profile_picture_url}
                        sx={{ width: 80, height: 80, mb: 2 }}
                      >
                        {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                      </Avatar>
                      
                      <Typography variant="h6" component="h3" align="center" gutterBottom>
                        {member.full_name || 'Unnamed User'}
                        {member.id === user?.id && ' (You)'}
                      </Typography>
                      
                      <Box sx={{ mt: 1, mb: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Chip 
                          label={member.role === 'admin' ? 'Admin' : 'Member'} 
                          color={member.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                        />
                        
                        {member.skills && member.skills.length > 0 && (
                          <Chip
                            label={`${member.skills.length} skills`}
                            size="small"
                            color="secondary"
                          />
                        )}
                      </Box>
                      
                      {member.bio && (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          mb: 2
                        }}>
                          {member.bio}
                        </Typography>
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                      <Button
                        variant="outlined"
                        component={Link}
                        to={`/profile/${member.id}`}
                        size="small"
                      >
                        View Profile
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

{activeTab === 1 && (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Events Calendar
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ height: 600 }}>
      <Calendar
  localizer={localizer}
  events={events.map(event => ({
    title: event.title,
    start: new Date(event.date),
    end: new Date(event.date),
    allDay: true,
    resource: event,
  }))}
  date={calendarDate}
  view={calendarView}
  onView={setCalendarView}
  onNavigate={setCalendarDate}
  startAccessor="start"
  endAccessor="end"
  style={{ height: 500 }}
  components={{
    event: ({ event }) => (
      <div style={{ 
        background: '#2196f3', 
        color: 'white',
        padding: '2px 5px',
        borderRadius: '4px',
        margin: '2px',
        fontSize: '0.8rem'
      }}>
        {event.title}
      </div>
    )
  }}
/>
      </Box>
      
      {/* Event Details Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Events
        </Typography>
        <Grid container spacing={3}>
          {events
            .filter(event => new Date(event.date) > new Date())
            .map(event => (
              <Grid item xs={12} sm={6} md={4} key={event.id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {event.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(event.date).toLocaleDateString()} • {event.location}
                    </Typography>
                    {event.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {event.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>
    </Paper>
  )}
      
      {activeTab === 2 && (
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

{activeTab === 3 && (
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

{activeTab === 4 && (
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