import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing moodboard canvas zoom, pan, and navigation
 * Enhanced version with wheel handling, refs for stable event handlers, and boundary constraints
 */
export const useMoodboardCanvas = (options = {}) => {
  const {
    initialScale = 1,
    initialPosition = { x: 0, y: 0 },
    minScale = 0.3,
    maxScale = 3,
    scaleStep = 0.1,
    items = [], // Array of items to calculate boundaries
    boundaryPadding = 200 // Extra padding around content boundaries
  } = options;

  // Canvas navigation state
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState(initialPosition);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef(null);
  
  // Refs for stable access in event handlers
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  
  // Update refs when state changes
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Calculate content boundaries based on items
  const getContentBounds = useCallback(() => {
    if (!items || items.length === 0) {
      // If no items, allow some movement around center
      return {
        minX: -boundaryPadding,
        maxX: boundaryPadding,
        minY: -boundaryPadding,
        maxY: boundaryPadding
      };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    items.forEach(item => {
      const x = item.x || 0;
      const y = item.y || 0;
      const width = item.width || 200;
      const height = item.height || 200;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + width);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + height);
    });

    // Add padding around content
    return {
      minX: minX - boundaryPadding,
      maxX: maxX + boundaryPadding,
      minY: minY - boundaryPadding,
      maxY: maxY + boundaryPadding
    };
  }, [items, boundaryPadding]);

  // Constrain position to boundaries
  const constrainPosition = useCallback((newPosition, currentScale = scale) => {
    const bounds = getContentBounds();
    const canvas = canvasRef.current;
    
    if (!canvas) return newPosition;

    const rect = canvas.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    // Calculate how far we can pan based on content size and scale
    const scaledBoundsWidth = (bounds.maxX - bounds.minX) * currentScale;
    const scaledBoundsHeight = (bounds.maxY - bounds.minY) * currentScale;

    // Calculate maximum allowed offset to keep content visible
    const maxOffsetX = Math.max(0, (scaledBoundsWidth - viewportWidth) / 2);
    const maxOffsetY = Math.max(0, (scaledBoundsHeight - viewportHeight) / 2);

    // Calculate the center of content bounds
    const contentCenterX = (bounds.minX + bounds.maxX) / 2;
    const contentCenterY = (bounds.minY + bounds.maxY) / 2;

    // Calculate where content center should be positioned in viewport
    const targetCenterX = viewportWidth / 2 - contentCenterX * currentScale;
    const targetCenterY = viewportHeight / 2 - contentCenterY * currentScale;

    // Constrain position
    const constrainedX = Math.max(
      targetCenterX - maxOffsetX,
      Math.min(targetCenterX + maxOffsetX, newPosition.x)
    );
    
    const constrainedY = Math.max(
      targetCenterY - maxOffsetY,
      Math.min(targetCenterY + maxOffsetY, newPosition.y)
    );

    return {
      x: constrainedX,
      y: constrainedY
    };
  }, [getContentBounds, scale]);

  // Enhanced setPosition that respects boundaries
  const setConstrainedPosition = useCallback((newPosition) => {
    const constrained = constrainPosition(newPosition);
    setPosition(constrained);
  }, [constrainPosition]);

  // Constrain position when scale changes or items change
  useEffect(() => {
    const constrained = constrainPosition(position, scale);
    if (constrained.x !== position.x || constrained.y !== position.y) {
      setPosition(constrained);
    }
  }, [scale, items, constrainPosition, position]); // Re-constrain when scale or items change

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + scaleStep, maxScale));
  }, [scaleStep, maxScale]);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - scaleStep, minScale));
  }, [scaleStep, minScale]);

  const handleZoomReset = useCallback(() => {
    setScale(initialScale);
    setPosition(initialPosition);
  }, [initialScale, initialPosition]);

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
      
      const newPosition = {
        x: positionRef.current.x + dx,
        y: positionRef.current.y + dy
      };
      
      setConstrainedPosition(newPosition);
      setStartDragPos({ x: e.clientX, y: e.clientY });
    }
  }, [isDraggingCanvas, startDragPos, setConstrainedPosition]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
  }, []);

  // Enhanced wheel handling with both zoom and pan
  const handleWheel = useCallback((e) => {
    // Always prevent default to stop page scroll
    e.preventDefault();
    e.stopPropagation();
    
    // Check if it's a pinch zoom gesture
    if (e.ctrlKey || e.metaKey) {
      // Pinch zoom (Ctrl/Cmd + scroll) - use refs for current values
      const currentScale = scaleRef.current;
      const currentPosition = positionRef.current;
      const zoomDelta = -e.deltaY * 0.01;
      const newScale = Math.min(Math.max(currentScale + zoomDelta, minScale), maxScale);
      
      // Get mouse position relative to canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom towards cursor position
        const scaleRatio = newScale / currentScale;
        const newX = mouseX - (mouseX - currentPosition.x) * scaleRatio;
        const newY = mouseY - (mouseY - currentPosition.y) * scaleRatio;
        
        setScale(newScale);
        setConstrainedPosition({ x: newX, y: newY });
      }
    } else {
      // Two-finger scroll (trackpad pan)
      const deltaX = e.deltaX;
      const deltaY = e.deltaY;
      
      // Invert the scroll direction for more natural panning
      const newPosition = {
        x: positionRef.current.x - deltaX,
        y: positionRef.current.y - deltaY
      };
      setConstrainedPosition(newPosition);
    }
  }, [minScale, maxScale, setConstrainedPosition]);

  return {
    // State
    scale,
    position,
    isDraggingCanvas,
    
    // Refs
    canvasRef,
    
    // Setters (for external control)
    setScale,
    setPosition,
    
    // Event handlers
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleWheel,
    
    // Zoom controls
    handleZoomIn,
    handleZoomOut,
    handleZoomReset
  };
};