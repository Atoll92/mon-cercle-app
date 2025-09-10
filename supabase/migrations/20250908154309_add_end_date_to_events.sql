-- Add optional end_date column to network_events table for multi-day events
-- This allows events to have a start date (existing 'date' column) and end date

-- Add end_date column to network_events table
ALTER TABLE public.network_events 
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.network_events.end_date IS 'Optional end date for multi-day events. If null, event is single day.';

-- Add index for performance when querying date ranges
CREATE INDEX IF NOT EXISTS idx_network_events_date_range 
ON public.network_events(network_id, date, end_date);

-- Add constraint to ensure end_date is after start date if provided
ALTER TABLE public.network_events 
ADD CONSTRAINT check_end_date_after_start_date 
CHECK (end_date IS NULL OR end_date >= date);