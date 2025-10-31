-- Migration: Add sound notification preferences
-- Created: 2025-10-31
-- Description: Add columns to profiles table for chat and DM sound notifications

-- Add sound notification columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sound_notifications_chat BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sound_notifications_dm BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.sound_notifications_chat IS 'Enable/disable sound notifications for network chat messages';
COMMENT ON COLUMN profiles.sound_notifications_dm IS 'Enable/disable sound notifications for direct messages';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_sound_notifications
ON profiles(sound_notifications_chat, sound_notifications_dm);
