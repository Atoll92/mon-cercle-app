import { useState, useCallback } from 'react';

/**
 * Custom hook for managing moodboard canvas zoom and pan
 */
export const useMoodboardCanvas = () => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.3));
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleCanvasMouseDown = useCallback((e, selectedItemId) => {
    // Only drag canvas with middle mouse button or when no item is selected
    if (e.button === 1 || !selectedItemId) {
      setIsDraggingCanvas(true);
      setStartDragPos({ x: e.clientX, y: e.clientY });
      e.preventDefault(); // Prevent default behavior for middle mouse button
    }
  }, []);

  const handleCanvasMouseMove = useCallback((e) => {
    if (isDraggingCanvas) {
      const dx = e.clientX - startDragPos.x;
      const dy = e.clientY - startDragPos.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setStartDragPos({ x: e.clientX, y: e.clientY });
    }
  }, [isDraggingCanvas, startDragPos]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
  }, []);

  return {
    scale,
    position,
    isDraggingCanvas,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp
  };
};