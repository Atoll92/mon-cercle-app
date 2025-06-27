import React from 'react';
import MoodboardItem from './MoodboardItem';

const MoodboardItemDisplay = ({ item, offsetX = 0, offsetY = 0, scale = 1 }) => {
  // Create a modified item with offset positioning
  const itemWithOffset = {
    ...item,
    x: (item.x || 0) + offsetX,
    y: (item.y || 0) + offsetY
  };

  // No-op handlers for read-only display
  const handleSelect = () => {};
  const handleMove = () => {};
  const handleResize = () => {};
  const handleEdit = () => {};
  const handleDelete = () => {};

  return (
    <MoodboardItem
      item={itemWithOffset}
      selected={false}
      onSelect={handleSelect}
      onMove={handleMove}
      onResize={handleResize}
      onEdit={handleEdit}
      onDelete={handleDelete}
      scale={scale}
      isEditable={false}
    />
  );
};

export default MoodboardItemDisplay;