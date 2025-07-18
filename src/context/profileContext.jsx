import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './authcontext';
import * as profilesApi from '../api/profiles'; // Using real API now

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeProfile, setActiveProfileState] = useState(null);
  const [userProfiles, setUserProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isSelectingProfile, setIsSelectingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Load user profiles when user changes
  useEffect(() => {
    if (user) {
      loadUserProfiles();
    } else {
      // Clear profiles when user logs out
      setUserProfiles([]);
      setActiveProfileState(null);
      setIsLoadingProfiles(false);
    }

    console.log('ProfileProvider: User changed, loading profiles for user:', user?.id || 'none');
  }, [user?.id]);

  // Load all profiles for the current user
  const loadUserProfiles = async () => {
    if (!user) return { profiles: [], error: null };
    
    setIsLoadingProfiles(true);
    setProfileError(null);
    
    try {
      // Fetch all profiles for the user
      // console.log('ProfileContext: Loading profiles for user:', user.id);
      const { data: profiles, error } = await profilesApi.getUserProfiles(user.id);
      
      if (error) {
        console.error('ProfileContext: Error loading profiles:', error);
        throw new Error(error);
      }
      
      // console.log('ProfileContext: Loaded profiles:', profiles?.length || 0, 'profiles found');
      // console.log('ProfileContext: Profile details:', profiles);
      setUserProfiles(profiles || []);
      
      // Try to load active profile from cookie
      const { data: savedProfile } = await profilesApi.getActiveProfile(user.id);
      
      if (savedProfile && profiles?.some(p => p.id === savedProfile.id)) {
        setActiveProfileState(savedProfile);
        setIsLoadingProfiles(false);
      } else if (profiles?.length === 1) {
        // If only one profile, automatically select it
        setIsSelectingProfile(true);
        setIsLoadingProfiles(false);
        await setActiveProfile(profiles[0]);
        setIsSelectingProfile(false);
      } else {
        // Multiple profiles or no profiles - no auto-selection needed
        setIsLoadingProfiles(false);
      }
      
      // Return the fresh data for immediate use
      return { profiles: profiles || [], error: null };
    } catch (error) {
      console.error('Error loading profiles:', error);
      setProfileError(error.message);
      setIsLoadingProfiles(false);
      setIsSelectingProfile(false);
      return { profiles: [], error: error.message };
    }
  };

  // Set the active profile and save to cookie
  const setActiveProfile = async (profile) => {
    try {
      const { data, error } = await profilesApi.setActiveProfile(profile.id);
      
      if (error) {
        throw new Error(error);
      }
      
      // console.log('ProfileContext: Setting active profile:', data);
      setActiveProfileState(data);
      return { success: true };
    } catch (error) {
      console.error('Error setting active profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Clear the active profile
  const clearActiveProfile = async () => {
    try {
      await profilesApi.clearActiveProfile();
      setActiveProfileState(null);
      return { success: true };
    } catch (error) {
      console.error('Error clearing active profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Create a new profile for a network
  const createProfileForNetwork = async (networkId, profileData) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { data: newProfile, error } = await profilesApi.createProfileForNetwork(
        user.id,
        networkId,
        profileData
      );
      
      if (error) {
        throw new Error(error);
      }
      
      // Reload profiles to include the new one
      await loadUserProfiles();
      
      return { success: true, profile: newProfile };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Get a specific profile by network
  const getProfileForNetwork = async (networkId) => {
    if (!user) return null;
    
    try {
      const { data: profile } = await profilesApi.getProfileByUserAndNetwork(
        user.id,
        networkId
      );
      
      return profile;
    } catch (error) {
      console.error('Error getting profile for network:', error);
      return null;
    }
  };

  // Switch to a different profile
  const switchProfile = async (profileId) => {
    const profile = userProfiles.find(p => p.id === profileId);
    
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }
    
    return await setActiveProfile(profile);
  };

  // Refresh the active profile data from the database
  const refreshActiveProfile = async () => {
    if (!activeProfile) return { success: false, error: 'No active profile' };
    
    try {
      const { data: updatedProfile, error } = await profilesApi.getProfileById(activeProfile.id);
      
      if (error) {
        throw new Error(error);
      }
      
      // Update the active profile state with fresh data
      setActiveProfileState(updatedProfile);
      
      // Also update it in the userProfiles array
      setUserProfiles(prev => prev.map(p => 
        p.id === updatedProfile.id ? updatedProfile : p
      ));
      
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('Error refreshing active profile:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    activeProfile,
    userProfiles,
    isLoadingProfiles,
    isSelectingProfile,
    profileError,
    setActiveProfile,
    clearActiveProfile,
    createProfileForNetwork,
    getProfileForNetwork,
    switchProfile,
    refreshActiveProfile,
    loadUserProfiles,
    hasMultipleProfiles: userProfiles.length > 1,
    profileCount: userProfiles.length
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};