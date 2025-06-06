import { useEffect, useState } from 'react';
import { useProfile } from '../context/profileContext';
import { useAuth } from '../context/authcontext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ProfileSelector from './ProfileSelector';

const ProfileAwareRoute = ({ children }) => {
  const { user } = useAuth();
  const { activeProfile, userProfiles, isLoadingProfiles, profileError } = useProfile();
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user || isLoadingProfiles) {
      return;
    }

    // If there's an error loading profiles, let the normal error handling take over
    if (profileError) {
      return;
    }

    // If user has no profiles, they need to create a network first
    if (userProfiles.length === 0) {
      // Redirect to create network page unless we're already there
      if (location.pathname !== '/create-network') {
        navigate('/create-network');
      }
      return;
    }

    // If user has exactly one profile, automatically set it as active
    if (userProfiles.length === 1 && !activeProfile) {
      // The profile context should handle this automatically
      return;
    }

    // If user has multiple profiles but no active profile selected
    if (userProfiles.length > 1 && !activeProfile) {
      // Don't show selector on certain pages
      const exemptPages = ['/profiles/select', '/create-network', '/join/'];
      const isExemptPage = exemptPages.some(page => location.pathname.startsWith(page));
      
      if (!isExemptPage) {
        setShowProfileSelector(true);
      }
      return;
    }

    // User has active profile, hide selector if it was shown
    setShowProfileSelector(false);
  }, [user, activeProfile, userProfiles, isLoadingProfiles, profileError, location.pathname, navigate]);

  const handleProfileSelected = (profile) => {
    setShowProfileSelector(false);
    // Profile context will handle the navigation
  };

  // Show loading while profiles are loading
  if (user && isLoadingProfiles) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show profile selector if needed
  if (showProfileSelector) {
    return (
      <ProfileSelector onProfileSelected={handleProfileSelected} />
    );
  }

  // Render children normally
  return children;
};

export default ProfileAwareRoute;