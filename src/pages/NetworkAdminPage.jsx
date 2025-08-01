// File: src/pages/NetworkAdminPage.jsx - Updated for dark mode with theme constants
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useTheme } from '../components/ThemeProvider'; // Import useTheme hook
import { useTranslation } from '../hooks/useTranslation.jsx'; // Import translation hook
import { supabase } from '../supabaseclient';
import Spinner from '../components/Spinner';
import {
  Box,
  Typography,
  Button,
  Paper,
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
import MonetizationTab from '../components/admin/MonetizationTab';
import BillingTab from '../components/admin/BillingTab';
import BadgesTab from '../components/admin/BadgesTab';
import SupportTicketsTab from '../components/admin/SupportTicketsTab';
import CategoriesTab from '../components/admin/CategoriesTab';
import AdminLayout from '../components/admin/AdminLayout';
import AdminBreadcrumbs from '../components/admin/AdminBreadcrumbs';
import OnboardingGuide, { WithOnboardingHighlight } from '../components/OnboardingGuide';

// Tab name to index mapping
const TAB_MAPPING = {
  'settings': 0,
  'members': 1,
  'categories': 2,
  'news': 3,
  'events': 4,
  'polls': 5,
  'theme': 6,
  'moderation': 7,
  'monetization': 8,
  'billing': 9,
  'badges': 10,
  'support': 11
};

// Index to tab name mapping
const TAB_NAMES = Object.entries(TAB_MAPPING).reduce((acc, [name, index]) => {
  acc[index] = name;
  return acc;
}, {});

function NetworkAdminPage() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { darkMode } = useTheme(); // Get darkMode from theme context
  const { t } = useTranslation(); // Get translation function
  const muiTheme = useMuiTheme(); // Get the MUI theme for accessing custom colors
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL params
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TAB_MAPPING[tabParam] !== undefined) {
      return TAB_MAPPING[tabParam];
    }
    return 0; // Default to settings tab
  };
  
  // State variables
  const [profile, setProfile] = useState(null);
  const [network, setNetwork] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [newsPosts, setNewsPosts] = useState([]);
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  
  // Update URL when tab changes
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const tabName = TAB_NAMES[newTab];
    if (tabName) {
      setSearchParams({ tab: tabName });
    }
  };
  
  // Handle URL parameter changes (e.g., browser back/forward)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TAB_MAPPING[tabParam] !== undefined) {
      const newTab = TAB_MAPPING[tabParam];
      if (newTab !== activeTab) {
        setActiveTab(newTab);
      }
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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
          .eq('id', activeProfile.id)
          .single();
          
        if (profileError) throw profileError;
        setProfile(profileData);
        
        if (profileData.role !== 'admin') {
          setError(t('admin.errors.noAdminPrivileges'));
          return;
        }
        
        if (!profileData.network_id) {
          setError(t('admin.errors.notInNetwork'));
          return;
        }
        
        // Get network info using our API function
        const networkData = await fetchNetworkDetails(profileData.network_id);
        if (!networkData) {
          throw new Error('Failed to load network details');
        }
        setNetwork(networkData);
        
        // Get members using our API function
        const membersResponse = await fetchNetworkMembers(profileData.network_id);
        // Handle both old array format and new paginated format
        const membersData = Array.isArray(membersResponse) ? membersResponse : membersResponse.members || [];
        setMembers(membersData);
        
        // Get events using our API function - include non-approved events for admin
        const eventsData = await fetchNetworkEvents(profileData.network_id, { includeNonApproved: true });
        setEvents(eventsData || []);
        
        // Get news posts using our API function
        const newsResponse = await fetchNetworkNews(profileData.network_id);
        // Handle both old array format and new paginated format
        const newsData = Array.isArray(newsResponse) ? newsResponse : newsResponse.news || [];
        setNewsPosts(newsData);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError(t('admin.errors.loadNetworkFailed', { error: error.message }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id, activeProfile?.id]);

  const refreshMembers = async () => {
    if (!profile || !profile.network_id) return;
    
    try {
      const membersResponse = await fetchNetworkMembers(profile.network_id);
      // Handle both old array format and new paginated format
      const membersData = Array.isArray(membersResponse) ? membersResponse : membersResponse.members || [];
      setMembers(membersData);
    } catch (error) {
      console.error('Error refreshing members:', error);
      setError(t('admin.errors.refreshMembersFailed'));
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
          setActiveTab={handleTabChange}
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
            <Spinner size={120} sx={{ mb: 3 }} />
            <Typography variant="h6">
              {t('admin.loading.adminPanel')}
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
          setActiveTab={handleTabChange}
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
              {t('admin.errors.accessError')}
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
                {t('admin.buttons.returnToDashboard')}
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
        setActiveTab={handleTabChange} 
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
            {activeTab === 0 && t('admin.tabs.settings')}
            {activeTab === 1 && t('admin.tabs.members')}
            {activeTab === 2 && t('admin.tabs.categories')}
            {activeTab === 3 && t('admin.tabs.news')}
            {activeTab === 4 && t('admin.tabs.events')}
            {activeTab === 5 && t('admin.tabs.polls')}
            {activeTab === 6 && t('admin.tabs.theme')}
            {activeTab === 7 && t('admin.tabs.moderation')}
            {activeTab === 8 && t('admin.tabs.monetization')}
            {activeTab === 9 && t('admin.tabs.billing')}
            {activeTab === 10 && t('admin.tabs.badges')}
            {activeTab === 11 && t('admin.tabs.support')}
          </Typography>
        </Box>

        {activeTab === 0 && (
          <Box>
            {/* Network Settings Component*/}
            <NetworkSettingsTab 
              network={network} 
              onNetworkUpdate={updateNetworkState}
              darkMode={darkMode} // Pass dark mode to component
            />
            <br/>
            {/* Network Info Component*/}
            <Box sx={{ mb: 3 }}>
              <NetworkInfoPanel 
                network={network} 
                members={members}
                darkMode={darkMode} // Pass dark mode to component
              />
            </Box>
            
          </Box>
        )}

        {activeTab === 1 && (
          /* Members Management Component */
          <MembersTab
            members={members}
            user={user}
            activeProfile={activeProfile}
            network={network}
            onMembersChange={refreshMembers}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}

        {activeTab === 2 && (
          /* Categories Management Component */
          <CategoriesTab
            networkId={network.id}
          />
        )}

        {activeTab === 3 && (
          /* News Management Component */
          <NewsTab
            networkId={network.id}
            userId={activeProfile.id}
            newsPosts={newsPosts}
            setNewsPosts={setNewsPosts}
            members={members}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}

        {activeTab === 4 && (
          /* Events Management Component */
          <EventsTab 
            events={events}
            setEvents={setEvents}
            user={user}
            activeProfile={activeProfile}
            networkId={network.id}
            network={network}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}

        {activeTab === 5 && (
          /* Polls Management Component */
          <PollsTab
            networkId={network.id}
            userId={activeProfile.id}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}

        {activeTab === 6 && (
          /* Theme Settings Component */
          <ThemeTab 
            network={network} 
            onNetworkUpdate={updateNetworkState}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}
        
        {activeTab === 7 && (
          /* Moderation Tools Component */
          <ModerationTab
            network={network}
            user={user}
            members={members}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}
        
        {activeTab === 8 && (
          /* Monetization Component */
          <MonetizationTab
            networkId={network.id}
            network={network}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}
        
        {activeTab === 9 && (
          /* Billing & Plan Component */
          <BillingTab
            activeProfile={activeProfile}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}
        
        {activeTab === 10 && (
          /* Badges & Engagement Component */
          <BadgesTab
            networkId={network.id}
            members={members}
            darkMode={darkMode} // Pass dark mode to component
          />
        )}
        
        {activeTab === 11 && (
          /* Support Tickets Component */
          <SupportTicketsTab 
            network={network}
            user={user}
            activeProfile={activeProfile}
            darkMode={darkMode}
          />
        )}
      </Paper>
      
      {/* Onboarding Guide */}
      <OnboardingGuide
        networkId={network?.id}
        isNetworkAdmin={profile?.role === 'admin'}
        memberCount={members?.length || 0}
        currentPage="admin"
        currentAdminTab={activeTab}
      />
    </AdminLayout>
    </>
  );
}

export default NetworkAdminPage;