// File: src/pages/NetworkAdminPage.jsx - Updated for dark mode with theme constants
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useTheme } from '../components/ThemeProvider'; // Import useTheme hook
import { supabase } from '../supabaseclient';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Grid,
  Alert,
  Tabs,
  Tab,
  alpha,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  Event as EventIcon,
  Palette as PaletteIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

// Import our API functions
import { 
  fetchNetworkMembers, 
  fetchNetworkDetails,
  fetchNetworkEvents,
  fetchNetworkNews
} from '../api/networks';

// Import our tab components
import MembersTab from '../components/admin/MembersTab';
import NetworkSettingsTab from '../components/admin/NetworkSettingsTab';
import NetworkInfoPanel from '../components/admin/NetworkInfoPanel';
import ThemeTab from '../components/admin/ThemeTab';
import EventsTab from '../components/admin/EventsTab';
import NewsTab from '../components/admin/Newstab';

// Helper component for tab panels
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function NetworkAdminPage() {
  const { user } = useAuth();
  const { darkMode } = useTheme(); // Get darkMode from theme context
  const muiTheme = useMuiTheme(); // Get the MUI theme for accessing custom colors
  const navigate = useNavigate();
  
  // State variables
  const [profile, setProfile] = useState(null);
  const [network, setNetwork] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [newsPosts, setNewsPosts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get admin's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        setProfile(profileData);
        
        if (profileData.role !== 'admin') {
          setError('You do not have admin privileges.');
          return;
        }
        
        if (!profileData.network_id) {
          setError('You are not part of any network.');
          return;
        }
        
        // Get network info using our API function
        const networkData = await fetchNetworkDetails(profileData.network_id);
        if (!networkData) {
          throw new Error('Failed to load network details');
        }
        setNetwork(networkData);
        
        // Get members using our API function
        const membersData = await fetchNetworkMembers(profileData.network_id);
        setMembers(membersData || []);
        
        // Get events using our API function
        const eventsData = await fetchNetworkEvents(profileData.network_id);
        setEvents(eventsData || []);
        
        // Get news posts using our API function
        const newsData = await fetchNetworkNews(profileData.network_id);
        setNewsPosts(newsData || []);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load network information: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const refreshMembers = async () => {
    if (!profile || !profile.network_id) return;
    
    try {
      const membersData = await fetchNetworkMembers(profile.network_id);
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error refreshing members:', error);
      setError('Failed to refresh members list');
    }
  };

  const updateNetworkState = (updatedNetwork) => {
    setNetwork(updatedNetwork);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: muiTheme.palette.custom.lightText
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3,
            bgcolor: muiTheme.palette.background.paper,
            color: muiTheme.palette.custom.lightText
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              component={Link}
              to="/dashboard"
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              Back to Dashboard
            </Button>
            <Typography variant="h4" component="h1">
              Network Admin Error
            </Typography>
          </Box>
        </Paper>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button 
            variant="contained" 
            component={Link}
            to="/dashboard"
          >
            Return to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          bgcolor: muiTheme.palette.background.paper,
          color: muiTheme.palette.custom.lightText
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            component={Link}
            to="/dashboard"
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            Network Admin Panel
          </Typography>
        </Box>
      </Paper>

      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <Paper 
        sx={{ 
          mb: 3,
          bgcolor: muiTheme.palette.background.paper,
          // Add a subtle border for better visibility
          border: `1px solid ${muiTheme.palette.custom.border}`,
          // Add shadow for better separation
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor={darkMode ? "secondary" : "primary"}
          centered
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
          <Tab label="Network Settings" icon={<AdminIcon />} />
          <Tab label="Members" icon={<PersonAddIcon />} />
          <Tab label="News" icon={<ArticleIcon />} />
          <Tab label="Events" icon={<EventIcon />} />
          <Tab label="Theme & Branding" icon={<PaletteIcon />} />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {/* Network Settings Component */}
            <NetworkSettingsTab 
              network={network} 
              onNetworkUpdate={updateNetworkState}
              darkMode={darkMode} // Pass dark mode to component
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            {/* Network Info Component */}
            <NetworkInfoPanel 
              network={network} 
              members={members}
              darkMode={darkMode} // Pass dark mode to component
            />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Members Management Component */}
        <MembersTab
          members={members}
          user={user}
          network={network}
          onMembersChange={refreshMembers}
          darkMode={darkMode} // Pass dark mode to component
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* News Management Component */}
        <NewsTab
          networkId={network.id}
          userId={user.id}
          newsPosts={newsPosts}
          setNewsPosts={setNewsPosts}
          members={members}
          darkMode={darkMode} // Pass dark mode to component
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {/* Events Management Component */}
        <EventsTab 
          events={events}
          setEvents={setEvents}
          user={user}
          networkId={network.id}
          darkMode={darkMode} // Pass dark mode to component
        />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        {/* Theme Settings Component */}
        <ThemeTab 
          network={network} 
          onNetworkUpdate={updateNetworkState}
          darkMode={darkMode} // Pass dark mode to component
        />
      </TabPanel>
    </Container>
  );
}

export default NetworkAdminPage;