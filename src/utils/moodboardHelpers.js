import { supabase } from '../supabaseclient';
import { DEFAULT_SIZES, DEFAULT_COLORS } from '../constants/moodboard';

/**
 * Creates a new moodboard item with default properties
 * @param {Object} params - Item creation parameters
 * @param {string} params.moodboardId - The moodboard ID
 * @param {string} params.type - Item type (image, text, link, pdf, video, audio)
 * @param {string} params.content - Item content (URL, text, etc.)
 * @param {string} params.userId - User ID creating the item
 * @param {Object} params.position - Canvas position {x, y}
 * @param {number} params.itemCount - Current number of items (for z-index)
 * @param {Object} params.additionalProps - Any additional properties
 * @returns {Object} New item object
 */
export const createMoodboardItem = ({
  moodboardId,
  type,
  content,
  userId,
  position,
  itemCount,
  additionalProps = {}
}) => {
  const size = DEFAULT_SIZES[type] || DEFAULT_SIZES.text;
  
  return {
    moodboard_id: moodboardId,
    type,
    content,
    backgroundColor: DEFAULT_COLORS.background,
    x: position.x - size.width / 2,
    y: position.y - size.height / 2,
    width: size.width,
    height: size.height,
    zIndex: itemCount + 1,
    created_by: userId,
    ...additionalProps
  };
};

/**
 * Saves a moodboard item to the database and updates local state
 * @param {Object} newItem - The item to save
 * @param {Function} setItems - State setter for items
 * @param {Function} setSelectedItemId - State setter for selected item
 * @param {Function} setSuccess - State setter for success message
 * @param {Function} setError - State setter for error message
 * @returns {Promise<boolean>} Success status
 */
export const saveMoodboardItem = async (
  newItem,
  setItems,
  setSelectedItemId,
  setSuccess,
  setError
) => {
  try {
    const { data: itemData, error: itemError } = await supabase
      .from('moodboard_items')
      .insert([newItem])
      .select();
    
    if (itemError) throw itemError;
    
    // Add to local state
    setItems(prev => [...prev, itemData[0]]);
    setSelectedItemId(itemData[0].id);
    
    setSuccess(`${newItem.type.charAt(0).toUpperCase() + newItem.type.slice(1)} added successfully`);
    setTimeout(() => setSuccess(null), 3000);
    
    return true;
  } catch (err) {
    console.error(`Error adding ${newItem.type}:`, err);
    setError(`Failed to add ${newItem.type}`);
    return false;
  }
};

/**
 * Calculates the center position of the canvas viewport
 * @param {HTMLElement} canvasRef - Canvas element reference
 * @param {Object} position - Current viewport position
 * @param {number} scale - Current zoom scale
 * @returns {Object} Center position {x, y}
 */
export const getCanvasCenter = (canvasRef, position, scale) => {
  const canvasRect = canvasRef.getBoundingClientRect();
  return {
    x: (canvasRect.width / 2 - position.x) / scale,
    y: (canvasRect.height / 2 - position.y) / scale
  };
};