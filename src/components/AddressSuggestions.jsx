// src/components/AddressSuggestions.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  ListItem,
  ListItemText
} from '@mui/material';
import Spinner from './Spinner';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import debounce from 'lodash/debounce';
import EventsMap from './EventsMap'; // Import the fixed EventsMap component

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGdjb2Jvc3MiLCJhIjoiY2xzY2JkNTdqMGJzbDJrbzF2Zm84aWxwZCJ9.b9GP9FrGHsVquJf7ubWfKQ';

export default function AddressSuggestions({ value, onChange, label = "Location", placeholder = "Enter an address", required = false, fullWidth = true, autoFocus = false }) {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // This function fetches address suggestions from Mapbox API
  const fetchSuggestions = async (searchText) => {
    if (searchText.length < 3) {
      setOptions([]);
      return;
    }
    
    setLoading(true);
    
    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json`;
      const url = `${endpoint}?access_token=${MAPBOX_TOKEN}&autocomplete=true&types=address,place,locality,neighborhood`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.features) {
        const suggestions = data.features.map(feature => ({
          place_name: feature.place_name,
          center: feature.center, // [longitude, latitude]
          id: feature.id,
          text: feature.text,
          place_type: feature.place_type[0]
        }));
        
        setOptions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Debounce the API calls to prevent too many requests
  const debouncedFetchSuggestions = useRef(
    debounce((text) => {
      fetchSuggestions(text);
    }, 300)
  ).current;
  
  useEffect(() => {
    if (inputValue.length > 2) {
      debouncedFetchSuggestions(inputValue);
    }
    
    return () => {
      debouncedFetchSuggestions.cancel();
    };
  }, [inputValue, debouncedFetchSuggestions]);

  // Initialize inputValue from the value prop if it's a string
  useEffect(() => {
    if (typeof value === 'string' && value) {
      setInputValue(value);
    } else if (value && value.place_name) {
      setInputValue(value.place_name);
    }
  }, [value]);

  // Calculate initialCoordinates for the map if value has center
  const getInitialCoordinates = () => {
    if (value && value.center && value.center.length === 2) {
      return {
        longitude: value.center[0],
        latitude: value.center[1]
      };
    }
    return null;
  };
  
  return (
    <>
      <Autocomplete
        id="mapbox-address-autocomplete"
        fullWidth={fullWidth}
        filterOptions={(x) => x} // Don't filter options, we're using the API
        options={options}
        autoComplete
        includeInputInList
        freeSolo
        loading={loading}
        loadingText="Searching addresses..."
        noOptionsText="No addresses found"
        value={value}
        inputValue={inputValue}
        onChange={(event, newValue) => {
          if (newValue && typeof newValue === 'object') {
            onChange(newValue);
          } else if (typeof newValue === 'string') {
            onChange({ place_name: newValue });
          } else {
            onChange(null);
          }
        }}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option?.place_name || '';
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            required={required}
            autoFocus={autoFocus}
            margin="dense"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <Spinner color="inherit" size={40} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
        renderOption={(props, option) => {
          // Fix for the key prop warning - extract key from props and pass it directly
          const { key, ...otherProps } = props;
          return (
            <ListItem key={key} {...otherProps} dense>
              <LocationOnIcon style={{ marginRight: 10, color: '#757575' }} fontSize="small" />
              <ListItemText
                primary={option.text}
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {option.place_name.replace(`${option.text}, `, '')}
                  </Typography>
                }
              />
            </ListItem>
          );
        }}
      />
      
      {/* Map display when coordinates are available */}
      {value && value.center && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <EventsMap 
            initialCoordinates={getInitialCoordinates()}
            // We don't pass events array here
          />
        </Box>
      )}
    </>
  );
}