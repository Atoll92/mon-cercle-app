import React, { useState, useEffect, useCallback } from 'react';
import { 
  Autocomplete, 
  TextField, 
  Avatar, 
  Box, 
  Typography,
  Chip
} from '@mui/material';
import Spinner from './Spinner';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { supabase } from '../supabaseclient';
import { debounce } from 'lodash';

function UserSearchAutocomplete({ onUserSelect, excludeUserIds = [], placeholder = "Search for users..." }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users based on search term
  const searchUsers = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      // Get network ID from active profile, fallback to user lookup
      let networkId = activeProfile?.network_id;
      
      if (!networkId && user?.id) {
        // Fallback for backward compatibility
        const { data: currentUser } = await supabase
          .from('profiles')
          .select('network_id')
          .eq('user_id', user.id)
          .single();
        networkId = currentUser?.network_id;
      }

      if (!networkId) {
        setOptions([]);
        return;
      }

      // Search for users in the same network
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url, bio')
        .eq('network_id', networkId)
        .neq('id', activeProfile?.id || user.id) // Exclude current user
        .ilike('full_name', `%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        setOptions([]);
        return;
      }

      // Filter out excluded users and format the data
      const filteredUsers = (data || [])
        .filter(u => !excludeUserIds.includes(u.id))
        .map(u => ({
          id: u.id,
          label: u.full_name || 'Unknown User',
          avatar: u.profile_picture_url,
          bio: u.bio
        }));

      setOptions(filteredUsers);
    } catch (error) {
      console.error('Error in user search:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [activeProfile?.id, user.id, excludeUserIds]);

  // Debounce the search function
  const debouncedSearch = useCallback(
    debounce((searchTerm) => searchUsers(searchTerm), 300),
    [searchUsers]
  );

  // Handle input change
  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    debouncedSearch(newInputValue);
  };

  // Handle user selection
  const handleChange = (event, newValue) => {
    setSelectedUser(newValue);
    if (newValue && onUserSelect) {
      onUserSelect(newValue.id);
    }
  };

  return (
    <Autocomplete
      id="user-search-autocomplete"
      options={options}
      loading={loading}
      value={selectedUser}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <Spinner color="inherit" size={40} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
          <Avatar 
            src={option.avatar} 
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {option.label.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body1">{option.label}</Typography>
            {option.bio && (
              <Typography variant="caption" color="text.secondary" sx={{ 
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '300px'
              }}>
                {option.bio}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      noOptionsText={inputValue.length < 2 ? "Type at least 2 characters to search" : "No users found"}
      sx={{ width: '100%' }}
    />
  );
}

export default UserSearchAutocomplete;