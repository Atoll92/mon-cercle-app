// Default colors for moodboard items
export const DEFAULT_COLORS = {
  text: '#000000',
  background: '#ffffff',
  transparent: 'transparent'
};

// Default sizes for different item types
export const DEFAULT_SIZES = {
  image: { width: 300, height: 200 },
  text: { width: 250, height: 150 },
  link: { width: 200, height: 120 },
  pdf: { width: 300, height: 300 },
  video: { width: 400, height: 300 },
  audio: { width: 300, height: 80 }
};

// Default properties for all items
export const DEFAULT_ITEM_PROPS = {
  backgroundColor: DEFAULT_COLORS.background,
  opacity: 1,
  rotation: 0,
  border_radius: 0,
  zIndex: 1
};

// Text-specific default properties
export const DEFAULT_TEXT_PROPS = {
  textColor: DEFAULT_COLORS.text,
  font_family: 'inherit',
  font_size: '1rem',
  font_weight: 'normal',
  text_align: 'left',
  line_height: 'normal'
};

// Helper function to create a new item with defaults
export const createNewItem = (type, content, options = {}) => {
  const size = DEFAULT_SIZES[type] || DEFAULT_SIZES.text;
  
  return {
    type,
    content,
    ...DEFAULT_ITEM_PROPS,
    width: size.width,
    height: size.height,
    ...options
  };
};