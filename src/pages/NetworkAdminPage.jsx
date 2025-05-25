// File: src/pages/NetworkAdminPage.jsx - Updated for dark mode with theme constants
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useTheme } from '../components/ThemeProvider'; // Import useTheme hook
import { supabase } from '../supabaseclient';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon
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
import ModerationTab from '../components/admin/ModerationTab';
import PollsTab from '../components/admin/PollsTab';
import InvitationLinksTab from '../components/admin/InvitationLinksTab';
import AdminLayout from '../components/admin/AdminLayout';
import AdminBreadcrumbs from '../components/admin/AdminBreadcrumbs';

function NetworkAdminPage() {
  const { user } = useAuth();
  const { darkMode } = useTheme(); // Get darkMode from theme context
  const muiTheme = useMuiTheme(); // Get the MUI theme for accessing custom colors
  
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
    // Show a more engaging loading state with the AdminLayout
    return (
      <>
        {/* <NetworkHeader /> */}
        <AdminLayout
          darkMode={darkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          network={null}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '70vh',
              color: muiTheme.palette.custom.lightText
            }}
          >
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6">
              Loading admin panel...
            </Typography>
          </Box>
        </AdminLayout>
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* <NetworkHeader /> */}
        <AdminLayout
          darkMode={darkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          network={null}
        >
          <Paper 
            sx={{ 
              p: 4, 
              mb: 3,
              bgcolor: muiTheme.palette.background.paper,
              color: muiTheme.palette.custom.lightText,
              borderRadius: 2,
              textAlign: 'center',
              border: `1px solid ${muiTheme.palette.error.light}`
            }}
          >
            <Typography variant="h5" component="h1" gutterBottom sx={{ color: muiTheme.palette.error.main }}>
              Admin Panel Access Error
            </Typography>
            
            <Alert severity="error" sx={{ mb: 4, justifyContent: 'center' }}>
              {error}
            </Alert>
            
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                component={Link}
                to="/dashboard"
                startIcon={<ArrowBackIcon />}
                size="large"
              >
                Return to Dashboard
              </Button>
            </Box>
          </Paper>
        </AdminLayout>
      </>
    );
  }

  // Use our new AdminLayout component
  return (
    <>
      {/* <NetworkHeader /> */}
      <AdminLayout 
        darkMode={darkMode} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        network={network}
        message={message}
        clearMessage={() => setMessage('')}
      >
      {/* Breadcrumbs navigation */}
      <AdminBreadcrumbs 
        activeTab={activeTab} 
        networkName={network?.name} 
        darkMode={darkMode} 
      />
      
      {message && (
        <Alert severity="success" sx={{ mb: 4 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {/* Tab panels with content */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: muiTheme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${muiTheme.palette.custom.border}`,
          mb: 3,
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ mb: 3, color: muiTheme.palette.custom.lightText, fontWeight: 'medium' }}
          >
            {activeTab === 0 && "Network Settings"}
            {activeTab === 1 && "Members Management"}
            {activeTab === 2 && "News Management"}
            {activeTab === 3 && "Events Management"}
            {activeTab === 4 && "Polls Management"}
            {activeTab === 5 && "Theme & Branding"}
            {activeTab === 6 && "Moderation Tools"}
            {activeTab === 7 && "Invitation Links"}
          </Typography>
        </Box>

        {activeTab === 0 && (
          <Box>
            {/* Network Info Component - at the top */}
            <Box sx={{ mb: 3 }}>
              <NetworkInfoPanel 
                network={network} 
                members={members}
                darkMode={darkMode} // Pass dark mode to component
              />
            </Box>
            
            {/* Network Settings Component - full width below */}
            <NetworkSettingsTab 
              network={network} 
              onNetworkUpdate={updateNetworkState}
              darkMode={darkMode} // Pass dark mode to component
            />
          </Box>
        )}

        {activeTab === 1 && (
          /* Members Management Component */
          <MembersTab
            members={members}
            user={user}
            network={network}
            onMembersChange={refreshMembers}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}

        {activeTab === 2 && (
          /* News Management Component */
          <NewsTab
            networkId={network.id}
            userId={user.id}
            newsPosts={newsPosts}
            setNewsPosts={setNewsPosts}
            members={members}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}

        {activeTab === 3 && (
          /* Events Management Component */
          <EventsTab 
            events={events}
            setEvents={setEvents}
            user={user}
            networkId={network.id}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}

        {activeTab === 4 && (
          /* Polls Management Component */
          <PollsTab
            networkId={network.id}
            userId={user.id}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}

        {activeTab === 5 && (
          /* Theme Settings Component */
          <ThemeTab 
            network={network} 
            onNetworkUpdate={updateNetworkState}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}
        
        {activeTab === 6 && (
          /* Moderation Tools Component */
          <ModerationTab
            network={network}
            user={user}
            members={members}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}
        
        {activeTab === 7 && (
          /* Invitation Links Component */
          <InvitationLinksTab
            networkId={network.id}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}
      </Paper>
    </AdminLayout>
    </>
  );
}

export default NetworkAdminPage;