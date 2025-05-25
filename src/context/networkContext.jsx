import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './authcontext';
import { supabase } from '../supabaseclient';
import {
  fetchNetworkDetails,
  fetchNetworkMembers,
  fetchNetworkEvents,
  fetchNetworkNews
} from '../api/networks';

// Create context
const NetworkContext = createContext(null);

// Custom hook to use the context
export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === null) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ networkId, children }) => {
  const { user } = useAuth();
  const [network, setNetwork] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('member');

  // Fetch network details and related data
  useEffect(() => {
    const fetchNetworkData = async () => {
      if (!networkId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch network details
        const networkData = await fetchNetworkDetails(networkId);
        if (!networkData) throw new Error('Network not found');
        setNetwork(networkData);
        
        // Fetch network members
        const membersResponse = await fetchNetworkMembers(networkId);
        // Handle both old array format and new paginated format
        const membersData = Array.isArray(membersResponse) ? membersResponse : membersResponse.members || [];
        setMembers(membersData);
        
        // Determine user's role in the network
        if (user) {
          const currentMember = membersData.find(m => m.id === user.id);
          if (currentMember) {
            setUserRole(currentMember.role);
          }
        }
        
        // Fetch network events
        const eventsData = await fetchNetworkEvents(networkId);
        setEvents(eventsData);
        
        // Fetch network news
        const newsResponse = await fetchNetworkNews(networkId);
        // Handle both old array format and new paginated format
        const newsData = Array.isArray(newsResponse) ? newsResponse : newsResponse.news || [];
        setNews(newsData);
        
        // Fetch network files
        const { data: filesData, error: filesError } = await supabase
          .from('network_files')
          .select('*')
          .eq('network_id', networkId)
          .order('created_at', { ascending: false });
          
        if (filesError) throw filesError;
        setFiles(filesData || []);
      } catch (err) {
        console.error('Error fetching network data:', err);
        setError('Failed to load network data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNetworkData();
  }, [networkId, user]);

  // Create value object with all network-related data and functions
  const value = {
    network,
    members,
    events,
    news,
    files,
    loading,
    error,
    userRole,
    isAdmin: userRole === 'admin',
    // Add utility functions for updating network data
    refreshMembers: async () => {
      try {
        const membersData = await fetchNetworkMembers(networkId);
        setMembers(membersData);
        return { success: true };
      } catch (error) {
        console.error('Failed to refresh members:', error);
        return { success: false, error };
      }
    },
    refreshEvents: async () => {
      try {
        const eventsData = await fetchNetworkEvents(networkId);
        setEvents(eventsData);
        return { success: true };
      } catch (error) {
        console.error('Failed to refresh events:', error);
        return { success: false, error };
      }
    },
    refreshNews: async () => {
      try {
        const newsData = await fetchNetworkNews(networkId);
        setNews(newsData);
        return { success: true };
      } catch (error) {
        console.error('Failed to refresh news:', error);
        return { success: false, error };
      }
    },
    refreshFiles: async () => {
      try {
        const { data, error } = await supabase
          .from('network_files')
          .select('*')
          .eq('network_id', networkId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setFiles(data || []);
        return { success: true };
      } catch (error) {
        console.error('Failed to refresh files:', error);
        return { success: false, error };
      }
    }
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

// Wrapper component that extracts networkId from URL params
export const NetworkProviderWithParams = ({ children }) => {
  const { networkId } = useParams();
  
  if (!networkId) {
    return <div>Network ID is required</div>;
  }
  
  return (
    <NetworkProvider networkId={networkId}>
      {children}
    </NetworkProvider>
  );
};

export default NetworkContext;