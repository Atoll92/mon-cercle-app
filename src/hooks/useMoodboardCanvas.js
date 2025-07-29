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
    boundaryPaddingRatio = 0.5 // Ratio of viewport dimensions for padding (0.5 = 50% by default)
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
    // Calculate dynamic padding based on viewport dimensions
    // Use canvas element dimensions if available, otherwise fallback to window
    const canvas = canvasRef.current;
    let viewportWidth, viewportHeight;
    
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      viewportWidth = rect.width;
      viewportHeight = rect.height;
    } else {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
    }
    
    // Calculate padding for each axis independently
    const paddingX = viewportWidth * boundaryPaddingRatio / 2; // Divide by 2 since we add on both sides
    const paddingY = viewportHeight * boundaryPaddingRatio / 2;

    if (!items || items.length === 0) {
      // If no items, allow some movement around center
      return {
        minX: -paddingX,
        maxX: paddingX,
        minY: -paddingY,
        maxY: paddingY
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
      minX: minX - paddingX,
      maxX: maxX + paddingX,
      minY: minY - paddingY,
      maxY: maxY + paddingY
    };
  }, [items, boundaryPaddingRatio]);

  // Constrain position to boundaries
  const constrainPosition = useCallback((newPosition, currentScale = scale) => {
    const bounds = getContentBounds();
    const canvas = canvasRef.current;
    
    if (!canvas) return newPosition;

    const rect = canvas.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    // Calculate the actual canvas bounds in canvas coordinates
    const minCanvasX = bounds.minX * currentScale;
    const maxCanvasX = bounds.maxX * currentScale;
    const minCanvasY = bounds.minY * currentScale;
    const maxCanvasY = bounds.maxY * currentScale;

    // Calculate canvas dimensions
    const canvasWidth = maxCanvasX - minCanvasX;
    const canvasHeight = maxCanvasY - minCanvasY;

    // Calculate constraints
    // When canvas is smaller than viewport, center it
    // When canvas is larger than viewport, allow scrolling but keep content visible
    let minX, maxX, minY, maxY;

    if (canvasWidth <= viewportWidth) {
      // Center horizontally
      const centerX = (viewportWidth - canvasWidth) / 2;
      minX = centerX - minCanvasX;
      maxX = minX;
    } else {
      // Allow scrolling, but keep content visible
      minX = viewportWidth - maxCanvasX;
      maxX = -minCanvasX;
    }

    if (canvasHeight <= viewportHeight) {
      // Center vertically
      const centerY = (viewportHeight - canvasHeight) / 2;
      minY = centerY - minCanvasY;
      maxY = minY;
    } else {
      // Allow scrolling, but keep content visible
      minY = viewportHeight - maxCanvasY;
      maxY = -minCanvasY;
    }

    // Apply constraints
    const constrainedX = Math.max(minX, Math.min(maxX, newPosition.x));
    const constrainedY = Math.max(minY, Math.min(maxY, newPosition.y));

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