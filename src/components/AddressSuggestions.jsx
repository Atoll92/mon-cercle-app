// src/components/AddressSuggestions.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  ListItem,
  ListItemText
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import debounce from 'lodash/debounce';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Tell mapbox to skip using workers for Vite compatibility
// This is only needed for development - in production this should work fine
mapboxgl.setRTLTextPlugin(
  'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
  null,
  true // Lazy load the plugin
);

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGdjb2Jvc3MiLCJhIjoiY2xzY2JkNTdqMGJzbDJrbzF2Zm84aWxwZCJ9.b9GP9FrGHsVquJf7ubWfKQ';

export default function AddressSuggestions({ value, onChange, label = "Location", placeholder = "Enter an address", required = false, fullWidth = true, autoFocus = false }) {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Map references
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  
  // Set Mapbox token
  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }, []);
  
  // Initialize or update map when coordinates change
  useEffect(() => {
    if (!value || !value.center) return;
    
    const coordinates = {
      lng: value.center[0],
      lat: value.center[1]
    };
    
    // If map doesn't exist yet, create it
    if (!mapRef.current && mapContainerRef.current) {
      try {
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [coordinates.lng, coordinates.lat],
          zoom: 14,
          transformRequest: (url, resourceType) => {
            if (resourceType === 'Source' && url.startsWith('http')) {
              return {
                url: url,
                headers: {
                  'Cache-Control': 'no-cache' // Avoid caching issues during development
                }
              };
            }
          }
        });
        
        // Add marker
        markerRef.current = new mapboxgl.Marker({ draggable: true })
          .setLngLat([coordinates.lng, coordinates.lat])
          .addTo(mapRef.current);
        
        // When marker is dragged, update coordinates
        markerRef.current.on('dragend', () => {
          const lngLat = markerRef.current.getLngLat();
          const updatedValue = {
            ...value,
            center: [lngLat.lng, lngLat.lat]
          };
          onChange(updatedValue);
        });
      } catch (error) {
        console.error('Error initializing Mapbox map:', error);
      }
    } else if (mapRef.current && markerRef.current) {
      // Just update existing map and marker
      mapRef.current.setCenter([coordinates.lng, coordinates.lat]);
      markerRef.current.setLngLat([coordinates.lng, coordinates.lat]);
    }
  }, [value, onChange]);
  
  // Clean up map when component unmounts
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
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
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
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
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '200px',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid #ddd'
            }}
          />
        </Box>
      )}
    </>
  );
}