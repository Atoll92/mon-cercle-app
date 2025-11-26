-- Migration: Add "Presentation" category for onboarding intro posts
-- This category will be used to identify posts created during member onboarding

-- Function to create default presentation category for a network
CREATE OR REPLACE FUNCTION create_presentation_category_for_network(p_network_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id uuid;
  v_creator_id uuid;
BEGIN
  -- Get the network creator/admin to set as category creator
  SELECT created_by INTO v_creator_id
  FROM networks
  WHERE id = p_network_id
  LIMIT 1;

  -- Check if presentation category already exists for this network
  SELECT id INTO v_category_id
  FROM network_categories
  WHERE network_id = p_network_id
    AND slug = 'presentation'
  LIMIT 1;

  -- If not exists, create it
  IF v_category_id IS NULL THEN
    INSERT INTO network_categories (
      network_id,
      name,
      slug,
      description,
      color,
      sort_order,
      is_active,
      created_by,
      created_at
    ) VALUES (
      p_network_id,
      'Presentation',
      'presentation',
      'Member introduction posts created during onboarding',
      '#2196f3', -- Blue color
      0, -- High priority
      true,
      v_creator_id,
      now()
    )
    RETURNING id INTO v_category_id;
  END IF;

  RETURN v_category_id;
END;
$$;

-- Create presentation categories for all existing networks
DO $$
DECLARE
  network_record RECORD;
BEGIN
  FOR network_record IN SELECT id FROM networks
  LOOP
    PERFORM create_presentation_category_for_network(network_record.id);
  END LOOP;
END $$;

-- Trigger to auto-create presentation category for new networks
CREATE OR REPLACE FUNCTION trigger_create_presentation_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create presentation category for the new network
  PERFORM create_presentation_category_for_network(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_create_presentation_category ON networks;
CREATE TRIGGER trigger_auto_create_presentation_category
  AFTER INSERT ON networks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_presentation_category();

-- Add comment
COMMENT ON FUNCTION create_presentation_category_for_network(uuid) IS 'Creates a "Presentation" category for member introduction posts';
COMMENT ON FUNCTION trigger_create_presentation_category() IS 'Automatically creates presentation category when a new network is created';
