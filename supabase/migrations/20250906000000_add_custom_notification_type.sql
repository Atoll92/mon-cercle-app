-- Add 'custom' notification type to the notification_queue table constraint
-- This allows admins to send custom email notifications

-- First, drop the existing constraint
ALTER TABLE public.notification_queue 
DROP CONSTRAINT IF EXISTS notification_queue_notification_type_check;

-- Add the updated constraint with the new notification type
ALTER TABLE public.notification_queue 
ADD CONSTRAINT notification_queue_notification_type_check 
CHECK (notification_type::text = ANY (ARRAY[
  'news'::character varying, 
  'event'::character varying, 
  'mention'::character varying, 
  'direct_message'::character varying, 
  'post'::character varying,
  'event_proposal'::character varying,
  'event_status'::character varying,
  'event_reminder'::character varying,
  'comment'::character varying,
  'comment_reply'::character varying,
  'custom'::character varying
]::text[]));

-- Add a comment to document what the custom type is for
COMMENT ON CONSTRAINT notification_queue_notification_type_check ON public.notification_queue 
IS 'Allowed notification types: news, event, mention, direct_message, post, event_proposal (admin event reviews), event_status (event approval/rejection), event_reminder (24h before event), comment (comments on user posts), comment_reply (replies to user comments), custom (admin-sent custom emails)';