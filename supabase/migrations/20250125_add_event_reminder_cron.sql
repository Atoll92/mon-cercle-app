-- Migration to add event reminder notifications
-- This adds a daily cron job that creates reminder notifications for events happening tomorrow

-- First, ensure we have the cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the cron job to schedule event reminders
-- Runs daily at 10:00 AM to queue reminders for tomorrow's events
SELECT cron.schedule(
  'schedule-event-reminders', -- job name
  '0 10 * * *', -- daily at 10:00 AM
  $$
  INSERT INTO notification_queue (
    recipient_id,
    network_id,
    notification_type,
    subject_line,
    content_preview,
    related_item_id,
    metadata,
    created_at
  )
  SELECT 
    ep.profile_id as recipient_id,
    e.network_id,
    'event_reminder' as notification_type,
    'Reminder: ' || e.title || ' is tomorrow!' as subject_line,
    'Don''t forget! ' || e.title || ' is happening tomorrow at ' || 
    to_char(e.date AT TIME ZONE 'UTC', 'HH24:MI') || ' at ' || e.location as content_preview,
    e.id as related_item_id,
    jsonb_build_object(
      'eventId', e.id,
      'eventTitle', e.title,
      'eventDate', e.date,
      'eventLocation', e.location,
      'eventDescription', e.description
    ) as metadata,
    NOW() as created_at
  FROM event_participations ep
  INNER JOIN network_events e ON ep.event_id = e.id
  WHERE 
    ep.status = 'attending'
    AND e.date >= CURRENT_DATE + INTERVAL '1 day'
    AND e.date < CURRENT_DATE + INTERVAL '2 days'
    -- Avoid duplicate reminders by checking if one was already sent today
    AND NOT EXISTS (
      SELECT 1 
      FROM notification_queue nq 
      WHERE nq.recipient_id = ep.profile_id 
        AND nq.related_item_id = e.id
        AND nq.notification_type = 'event_reminder'
        AND nq.created_at >= CURRENT_DATE
    );
  $$
);

-- Add a comment to document this job
COMMENT ON EXTENSION pg_cron IS 'Scheduling extension for PostgreSQL - handles event reminders and notification processing';