-- Add reply support to messages table
ALTER TABLE messages 
ADD COLUMN parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
ADD COLUMN reply_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN reply_to_content TEXT;

-- Create index for efficient reply queries
CREATE INDEX idx_messages_parent_message_id ON messages(parent_message_id);

-- Update RLS policies to allow viewing replies
CREATE POLICY "Users can view replies to messages in their network"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = messages.network_id
    )
  );

-- Add a function to get the content of the parent message for replies
CREATE OR REPLACE FUNCTION get_parent_message_preview(message_id UUID)
RETURNS TEXT AS $$
DECLARE
  parent_content TEXT;
BEGIN
  SELECT LEFT(content, 100) INTO parent_content
  FROM messages
  WHERE id = message_id;
  
  RETURN parent_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;