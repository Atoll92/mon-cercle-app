-- Add new notification types to the notification_queue table constraint
-- This allows 'event_proposal' and 'event_status' notification types

-- First, drop the existing constraint
ALTER TABLE public.notification_queue 
DROP CONSTRAINT notification_queue_notification_type_check;

-- Add the updated constraint with the new notification types
ALTER TABLE public.notification_queue 
ADD CONSTRAINT notification_queue_notification_type_check 
CHECK (notification_type::text = ANY (ARRAY[
  'news'::character varying, 
  'event'::character varying, 
  'mention'::character varying, 
  'direct_message'::character varying, 
  'post'::character varying,
  'event_proposal'::character varying,
  'event_status'::character varying
]::text[]));

-- Add a comment to document what these new types are for
COMMENT ON CONSTRAINT notification_queue_notification_type_check ON public.notification_queue 
IS 'Allowed notification types: news, event, mention, direct_message, post, event_proposal (for admin event reviews), event_status (for event approval/rejection notifications)';