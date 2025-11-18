// src/components/EventsMap.jsx
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, FormControl, Select, MenuItem, Chip, Fade } from '@mui/material';
import { LocationCity as LocationCityIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
import Spinner from './Spinner';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTranslation } from '../hooks/useTranslation';

// Get Mapbox token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/dgcoboss/cm5k9ztpe003g01s76e7v8owz';

export default function EventsMap({ events = [], onEventSelect, initialCoordinates = null, height = '350px' }) {
  const { t } = useTranslation();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [selectedCity, setSelectedCity] = useState('all');
  const hasInitiallyFitBounds = useRef(false); // Track if we've done initial fit

  // Extract unique cities from events
  const cities = useMemo(() => {
    if (!events || events.length === 0) return [];

    const cityMap = new Map();

    // Common street type keywords that indicate this is a street address (must be whole word or at start)
    const streetTypeKeywords = [
      'rue', 'avenue', 'boulevard', 'allée', 'impasse', 'chemin', 'voie', 'passage', 'quai', 'cours',
      'av.', 'ave.', 'blvd.', 'bd.', 'rd.'
    ];

    // Known country names to exclude
    const countryNames = [
      'france', 'spain', 'italy', 'germany', 'belgium', 'switzerland', 'united kingdom', 'uk',
      'espagne', 'italie', 'allemagne', 'belgique', 'suisse', 'royaume-uni'
    ];

    const isLikelyStreetAddress = (text) => {
      const lowerText = text.toLowerCase().trim();

      // Check if it starts with a number followed by space (street number)
      if (/^\d+\s/.test(text)) {
        return true;
      }

      // Check if it starts with a street type keyword
      for (const keyword of streetTypeKeywords) {
        if (lowerText.startsWith(keyword + ' ') || lowerText === keyword) {
          return true;
        }
      }

      return false;
    };

    const isLikelyCountry = (text) => {
      const lowerText = text.toLowerCase().trim();
      // Country code (2 letters)
      if (text.length === 2 && /^[A-Z]{2}$/.test(text)) {
        return true;
      }
      // Known country name
      return countryNames.includes(lowerText);
    };

    events.forEach(event => {
      if (event?.coordinates?.latitude && event?.coordinates?.longitude && event?.location) {
        const locationParts = event.location.split(',').map(part => part.trim());

        let cityName = null;
        let possibleCities = [];

        // Collect all possible city/neighborhood candidates
        for (let i = 0; i < locationParts.length; i++) {
          const part = locationParts[i];

          // Skip if it's likely a street address
          if (isLikelyStreetAddress(part)) {
            continue;
          }

          // Skip if it's a country
          if (isLikelyCountry(part)) {
            continue;
          }

          // Clean up the name (remove postal codes but keep the rest)
          const cleaned = part.replace(/\b\d{5}\b/g, '').trim(); // Remove 5-digit postal codes

          if (cleaned.length >= 3) {
            possibleCities.push({
              index: i,
              name: cleaned,
              original: part
            });
          }
        }

        // Priority selection:
        // 1. If we have multiple candidates, prefer the second-to-last valid one (usually city before country)
        // 2. Otherwise take the last valid one
        if (possibleCities.length > 0) {
          if (possibleCities.length >= 2) {
            // Take second-to-last (usually the city, with country being last)
            cityName = possibleCities[possibleCities.length - 2].name;
          } else {
            cityName = possibleCities[possibleCities.length - 1].name;
          }
        }

        if (cityName && cityName.length >= 3) {
          if (!cityMap.has(cityName)) {
            cityMap.set(cityName, {
              name: cityName,
              coordinates: {
                latitude: event.coordinates.latitude,
                longitude: event.coordinates.longitude
              },
              count: 1,
              events: [event]
            });
          } else {
            const cityData = cityMap.get(cityName);
            cityData.count++;
            cityData.events.push(event);

            // Update average coordinates
            const totalLat = cityData.coordinates.latitude * (cityData.count - 1) + event.coordinates.latitude;
            const totalLng = cityData.coordinates.longitude * (cityData.count - 1) + event.coordinates.longitude;
            cityData.coordinates.latitude = totalLat / cityData.count;
            cityData.coordinates.longitude = totalLng / cityData.count;
          }
        }
      }
    });

    // Convert to array and sort by event count (most events first)
    const citiesArray = Array.from(cityMap.values()).sort((a, b) => b.count - a.count);

    return citiesArray;
  }, [events]);

  // Handle city selection
  const handleCityChange = useCallback((event) => {
    const cityName = event.target.value;
    setSelectedCity(cityName);

    // Wait for next tick to ensure map is ready
    setTimeout(() => {
      if (cityName === 'all') {
        // Show all events - fit to bounds
        const eventsWithCoordinates = events.filter(e =>
          e?.coordinates?.latitude && e?.coordinates?.longitude
        );

        if (eventsWithCoordinates.length > 0 && mapRef.current) {
          const bounds = new mapboxgl.LngLatBounds();
          eventsWithCoordinates.forEach(e => {
            bounds.extend([e.coordinates.longitude, e.coordinates.latitude]);
          });

          mapRef.current.fitBounds(bounds, {
            padding: 70,
            maxZoom: 15,
            duration: 1000
          });
        }
      } else {
        // Zoom to selected city
        const city = cities.find(c => c.name === cityName);

        if (city && mapRef.current) {
          mapRef.current.flyTo({
            center: [city.coordinates.longitude, city.coordinates.latitude],
            zoom: 12,
            duration: 1500,
            essential: true
          });
        }
      }
    }, 100);
  }, [cities, events]);
  
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        // Set access token
        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        if (!mapContainerRef.current) return;
        
        // Initialize map with custom style
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: MAPBOX_STYLE, // Use the custom style
          center: initialCoordinates 
            ? [initialCoordinates.longitude, initialCoordinates.latitude] 
            : [0, 20], // Use initialCoordinates if provided, otherwise default
          zoom: initialCoordinates ? 10 : 1,// Zoom in if we have initialCoordinates       
          projection: 'mercator',
        });
        
        // Add navigation controls
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add geolocate control
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        });
        mapRef.current.addControl(geolocate, 'top-right');
        
        // Set up event listeners
        mapRef.current.on('load', () => {
          setLoading(false);
          
          // If we have initialCoordinates, add a single marker
          if (initialCoordinates && initialCoordinates.latitude && initialCoordinates.longitude) {
            const marker = new mapboxgl.Marker({ draggable: false })
              .setLngLat([initialCoordinates.longitude, initialCoordinates.latitude])
              .addTo(mapRef.current);

            markersRef.current.push({ marker, popup: null, cleanup: null });
          } 
          // Otherwise try to geolocate user if we don't have specific coordinates
          else if (!initialCoordinates) {
            setTimeout(() => {
              if (mapRef.current) {
                geolocate.trigger();
              }
            }, 1000);
          }
        });
        
        // Add resize observer to ensure map fits its container
        const resizeObserver = new ResizeObserver(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        });
        
        if (mapContainerRef.current) {
          resizeObserver.observe(mapContainerRef.current);
        }
        
        return () => {
          if (mapContainerRef.current) {
            resizeObserver.unobserve(mapContainerRef.current);
          }
        };
      } catch (error) {
        setMapError(t('events.errors.mapLoadFailed'));
        setLoading(false);
      }
    };
    
    loadMapbox();
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialCoordinates]);
  
  // Add event markers whenever events change
  useEffect(() => {
    const addEventMarkers = () => {
      // If there are no events or events is undefined, we'll skip this part
      if (!mapRef.current || !events || events.length === 0) return;

      try {
        // Remove existing markers, popups, and event listeners
        markersRef.current.forEach(({ marker, popup, cleanup }) => {
          if (cleanup) cleanup();
          if (popup) popup.remove();
          marker.remove();
        });
        markersRef.current = [];

        const eventsWithCoordinates = events.filter(event =>
          event?.coordinates &&
          event.coordinates.longitude &&
          event.coordinates.latitude
        );

        if (eventsWithCoordinates.length === 0) return;

        // Create bounds to fit all markers
        const bounds = new mapboxgl.LngLatBounds();
        
        // Add markers for each event with coordinates
        eventsWithCoordinates.forEach(event => {
          const { longitude, latitude } = event.coordinates;

          // Create marker element
          const el = document.createElement('div');
          el.className = 'event-marker';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          el.style.borderRadius = '50%';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)';
          el.style.cursor = 'pointer';
          el.style.willChange = 'transform';
          el.style.backfaceVisibility = 'hidden';

          // Use event cover image if available, otherwise use colored marker
          if (event.cover_image_url) {
            el.style.backgroundImage = `url(${event.cover_image_url})`;
          } else {
            // Create a gradient background for events without images
            el.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
          }

          // Format event date
          const eventDate = new Date(event.date);
          const formattedDate = eventDate.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          const formattedTime = eventDate.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
          });

          // Create beautiful popup content
          const popupContent = `
            <div style="
              width: fit-content;
              max-width: 200px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              ${event.cover_image_url ? `
                <div style="
                  width: calc(100% + 24px);
                  height: 80px;
                  background-image: url(${event.cover_image_url});
                  background-size: cover;
                  background-position: center;
                  border-radius: 12px 12px 0 0;
                  margin: -12px -12px 10px -12px;
                "></div>
              ` : ''}
              <div style="padding: 2px 0;">
                <h3 style="
                  margin: 0 0 8px 0;
                  font-size: 13px;
                  font-weight: 600;
                  color: #1a1a1a;
                  line-height: 1.2;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                ">${event.title || 'Untitled Event'}</h3>

                <div style="
                  display: flex;
                  align-items: center;
                  gap: 5px;
                  margin-bottom: 4px;
                  color: #666;
                  font-size: 11px;
                ">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span style="font-weight: 500;">${formattedDate}</span>
                </div>

                <div style="
                  display: flex;
                  align-items: center;
                  gap: 5px;
                  margin-bottom: ${event.category ? '8px' : '0'};
                  color: #666;
                  font-size: 11px;
                ">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>${formattedTime}</span>
                </div>

                ${event.category ? `
                  <div style="
                    display: inline-block;
                    padding: 3px 8px;
                    background: ${event.category.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
                    color: white;
                    border-radius: 10px;
                    font-size: 9px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
                  ">${event.category.name || event.category}</div>
                ` : ''}
              </div>
            </div>
          `;

          // Create popup with better positioning
          const popup = new mapboxgl.Popup({
            offset: 15,
            closeButton: false,
            closeOnClick: false,
            className: 'event-marker-popup',
            maxWidth: 'none'
          }).setHTML(popupContent);

          // Track if mouse is over the marker element
          let isHovering = false;

          // Add hover events to show/hide popup
          const handleMouseEnter = () => {
            isHovering = true;
            popup.setLngLat([longitude, latitude]);
            popup.addTo(mapRef.current);
          };

          const handleMouseLeave = () => {
            isHovering = false;
            // Small delay to prevent flicker when moving between marker and popup
            setTimeout(() => {
              if (!isHovering) {
                popup.remove();
              }
            }, 50);
          };

          el.addEventListener('mouseenter', handleMouseEnter);
          el.addEventListener('mouseleave', handleMouseLeave);

          // Add click event directly to marker element
          el.addEventListener('click', () => {
            if (onEventSelect) {
              onEventSelect(event);
            }
          });

          // Create and add marker with popup
          const marker = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);

          // Store reference to marker, popup, and cleanup function for later removal
          markersRef.current.push({
            marker,
            popup,
            cleanup: () => {
              el.removeEventListener('mouseenter', handleMouseEnter);
              el.removeEventListener('mouseleave', handleMouseLeave);
              popup.remove();
            }
          });

          // Add coordinates to bounds
          bounds.extend([longitude, latitude]);
        });

        // Fit map to bounds with padding ONLY on initial load
        // Don't reset view when user interacts with markers
        if (!bounds.isEmpty() && eventsWithCoordinates.length > 0 && !hasInitiallyFitBounds.current) {
          mapRef.current.fitBounds(bounds, {
            padding: 70,
            maxZoom: 15
          });
          hasInitiallyFitBounds.current = true; // Mark as done
        }
      } catch (error) {
        // Silent error handling for markers
      }
    };
    
    if (!loading && mapRef.current) {
      addEventMarkers();
    }
  }, [events, loading]); // Only re-run when events or loading state changes
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height: height, borderRadius: 1, overflow: 'hidden' }}>
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 10
        }}>
          <Spinner size={80} />
        </Box>
      )}

      {mapError && (
        <Paper sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: 2,
          maxWidth: '80%',
          textAlign: 'center',
          zIndex: 5
        }}>
          <Typography color="error">{mapError}</Typography>
        </Paper>
      )}

      {/* City Filter Dropdown */}
      {cities.length > 0 && !loading && (
        <Fade in={!loading} timeout={800}>
          <Box sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 20,
            minWidth: 200
          }}>
            <FormControl
              size="small"
              sx={{
                minWidth: 200,
                backgroundColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(30, 30, 30, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(10px)',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2
                  }
                }
              }}
            >
              <Select
                value={selectedCity}
                onChange={handleCityChange}
                displayEmpty
                sx={{
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 1.25,
                    px: 1.5
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: 2,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      mt: 0.5,
                      maxHeight: 300,
                      '& .MuiMenuItem-root': {
                        borderRadius: 1,
                        mx: 0.5,
                        my: 0.25,
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)'
                        },
                        '&.Mui-selected': {
                          backgroundColor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(33, 150, 243, 0.2)'
                            : 'rgba(33, 150, 243, 0.1)',
                          '&:hover': {
                            backgroundColor: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(33, 150, 243, 0.3)'
                              : 'rgba(33, 150, 243, 0.15)'
                          }
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="all">
                  <MyLocationIcon sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                  <Typography sx={{ fontWeight: 500 }}>
                    {t('eventsTab.allCities') || 'All Cities'}
                  </Typography>
                  <Chip
                    label={events.length}
                    size="small"
                    sx={{
                      ml: 'auto',
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: 'primary.main',
                      color: 'white'
                    }}
                  />
                </MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city.name} value={city.name}>
                    <LocationCityIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                    <Typography sx={{ fontWeight: selectedCity === city.name ? 600 : 400 }}>
                      {city.name}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Fade>
      )}

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Event Counter */}
      {events && events.length > 0 && (
        <Fade in={!loading} timeout={800}>
          <Box sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            backgroundColor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '8px 12px',
            borderRadius: 2,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'text.primary',
            zIndex: 5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  animation: 'pulse 2s infinite'
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {t('eventsTab.eventsOnMap', {
                  shown: events.filter(event => event?.coordinates && event.coordinates.longitude).length,
                  total: events.length
                })}
              </Typography>
            </Box>
          </Box>
        </Fade>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          /* Event marker popup styling */
          .event-marker-popup .mapboxgl-popup-content {
            padding: 12px;
            border-radius: 12px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15),
                        0 4px 12px rgba(0, 0, 0, 0.1),
                        0 0 0 1px rgba(0, 0, 0, 0.05);
            background: white;
            animation: popupFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
          }

          .event-marker-popup .mapboxgl-popup-tip {
            border-top-color: white;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          }

          @keyframes popupFadeIn {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          /* Hover effect on markers */
          .event-marker {
            /* Removed transition to prevent markers from moving during map interactions */
          }

          .event-marker:hover {
            transform: scale(1.2);
            box-shadow: 0 6px 16px rgba(0,0,0,0.4) !important;
            z-index: 1000 !important;
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}
      </style>
    </Box>
  );
}