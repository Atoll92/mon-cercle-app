// src/components/EventsMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Spinner from './Spinner';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { formatEventDate } from '../utils/dateFormatting';
import { useTranslation } from '../hooks/useTranslation';

// Get Mapbox token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/dgcoboss/cm5k9ztpe003g01s76e7v8owz';

if (!MAPBOX_TOKEN) {
  console.error('VITE_MAPBOX_TOKEN is not defined in environment variables');
}

export default function EventsMap({ events = [], onEventSelect, initialCoordinates = null }) {
  const { t } = useTranslation();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  
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
            
            markersRef.current.push(marker);
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
        console.error('Error loading map:', error);
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
    const addEventMarkers = async () => {
      // If there are no events or events is undefined, we'll skip this part
      if (!mapRef.current || !events || events.length === 0) return;

      const viewDetailsText = t('events.map.viewDetails');

      try {
        // Remove existing markers
        markersRef.current.forEach(marker => marker.remove());
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
          el.style.width = '25px';
          el.style.height = '25px';
          el.style.backgroundSize = 'cover';
          el.style.borderRadius = '50%';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          
          // Use event cover image if available, otherwise use colored marker
          if (event.cover_image_url) {
            el.style.backgroundImage = `url(${event.cover_image_url})`;
          } else {
            el.style.backgroundColor = '#1976d2';
          }
          
          // Create popup
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px; max-width: 200px;">
                <h4 style="margin: 0 0 8px 0;">${event.title}</h4>
                <p style="margin: 4px 0; font-size: 12px; color: #555;">
                  ${formatEventDate(event.date)}
                </p>
                <p style="margin: 4px 0; font-size: 12px; color: #555;">
                  ${event.location}
                </p>
                ${event.description ? 
                  `<p style="margin: 8px 0 0 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                    ${event.description}
                  </p>` : ''
                }
                <button style="margin-top: 8px; padding: 4px 8px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                  ${viewDetailsText}
                </button>
              </div>
            `);
          
          // Add click event to popup button
          popup.on('open', () => {
            setTimeout(() => {
              const button = document.querySelector('.mapboxgl-popup-content button');
              if (button) {
                button.addEventListener('click', () => {
                  if (onEventSelect) {
                    onEventSelect(event);
                  }
                });
              }
            }, 100);
          });
          
          // Create and add marker
          const marker = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .setPopup(popup)
            .addTo(mapRef.current);
          
          // Store reference to marker for later removal
          markersRef.current.push(marker);
          
          // Add coordinates to bounds
          bounds.extend([longitude, latitude]);
        });
        
        // Fit map to bounds with padding
        if (!bounds.isEmpty()) {
          mapRef.current.fitBounds(bounds, {
            padding: 70,
            maxZoom: 15
          });
        }
      } catch (error) {
        console.error('Error adding markers:', error);
      }
    };
    
    if (!loading && mapRef.current) {
      addEventMarkers();
    }
  }, [events, loading, onEventSelect, t]);
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '350px', borderRadius: 1, overflow: 'hidden' }}>
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
      
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      
      {events && events.length > 0 && (
        <Box sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          padding: '4px 8px',
          borderRadius: 1,
          fontSize: '0.75rem',
          color: 'text.secondary',
          zIndex: 5
        }}>
          {events.filter(event => event?.coordinates && event.coordinates.longitude).length} / {events.length} events on map
        </Box>
      )}
    </Box>
  );
}