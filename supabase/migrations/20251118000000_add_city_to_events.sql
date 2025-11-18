-- Add city field to network_events table for reliable event filtering
-- This stores the city name extracted from coordinates via reverse geocoding

ALTER TABLE network_events
ADD COLUMN city TEXT;

-- Add index for faster filtering by city
CREATE INDEX idx_network_events_city ON network_events(city);

-- Add comment
COMMENT ON COLUMN network_events.city IS 'City name extracted from coordinates via reverse geocoding (Mapbox API with types=place)';
