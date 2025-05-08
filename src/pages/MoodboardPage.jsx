// src/pages/MoodboardPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Tooltip,
  Fade,
  Zoom,
  Divider,
  Slider,
  Container,
  alpha,
  useTheme,
  Grid,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Image as ImageIcon,
  TextFields as TextFieldsIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ArrowBack as ArrowBackIcon,
  Create as CreateIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Public as PublicIcon,
  Share as ShareIcon,
  VideoLibrary as VideoIcon,
  NoteAdd as NoteAddIcon,
  FileCopy as FileCopyIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

// Improved MoodboardItem component with better image handling and resizing
// Improved MoodboardItem component with better image handling and fixed image display
// Complete fixed MoodboardItem component - replace your current one with this
const MoodboardItem = ({ 
    item, 
    selected, 
    onSelect, 
    onMove, 
    onResize, 
    onEdit, 
    onDelete, 
    scale, 
    isEditable 
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: item.width, height: item.height });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showControls, setShowControls] = useState(selected);
    const itemRef = useRef(null);
  
    useEffect(() => {
      // Update size if item changes
      setSize({ width: item.width, height: item.height });
    }, [item.width, item.height]);
  
    // Update controls visibility when selected state changes
    useEffect(() => {
      setShowControls(selected);
    }, [selected]);
  
    const handleMouseDown = (e) => {
      if (!isEditable) return;
      
      // Skip if clicking on edit/delete buttons or resize handle
      if (e.target.closest('.MuiIconButton-root') || 
          e.target.classList.contains('resize-handle') ||
          e.target.closest('.resize-handle')) {
        e.stopPropagation();
        return;
      }
      
      e.stopPropagation();
      e.preventDefault(); // Prevent default behavior
      onSelect(item.id);
      
      setIsDragging(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      
      // Calculate click position relative to item for natural dragging
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };
  
    const handleMouseMove = useCallback((e) => {
      if (isDragging) {
        const dx = (e.clientX - startPos.x) / scale;
        const dy = (e.clientY - startPos.y) / scale;
        
        onMove(item.id, {
          x: item.x + dx,
          y: item.y + dy
        });
        
        setStartPos({ x: e.clientX, y: e.clientY });
      } else if (isResizing) {
        const dx = (e.clientX - startPos.x) / scale;
        const dy = (e.clientY - startPos.y) / scale;
        
        const newWidth = Math.max(50, size.width + dx);
        const newHeight = Math.max(50, size.height + dy);
        
        setSize({ width: newWidth, height: newHeight });
        setStartPos({ x: e.clientX, y: e.clientY });
      }
    }, [isDragging, isResizing, item, onMove, scale, size, startPos]);
  
    const handleMouseUp = useCallback(() => {
      if (isResizing) {
        onResize(item.id, size);
      }
      setIsDragging(false);
      setIsResizing(false);
    }, [isResizing, item.id, onResize, size]);
  
    useEffect(() => {
      if (isDragging || isResizing) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
    // Log image loading status
    useEffect(() => {
      if (item.type === 'image' && item.content) {
        const img = new Image();
        img.onload = () => {
          console.log(`Image loaded: ${item.id}`);
          setImageLoaded(true);
        };
        img.onerror = () => {
          console.error(`Image failed to load: ${item.id} - ${item.content}`);
          setImageLoaded(false);
        };
        img.src = item.content;
      }
    }, [item.type, item.content, item.id]);
  
    // Handle resize handle mousedown
    const handleResizeMouseDown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      setStartPos({ x: e.clientX, y: e.clientY });
    };
  
    // Render different content based on item type
    const renderContent = () => {
      switch (item.type) {
        case 'image':
          return (
            <Box sx={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative', 
              overflow: 'hidden',
              backgroundColor: '#f5f5f5', // Add background to make loading more visible
            }}>
              {/* Loading indicator */}
              {!imageLoaded && item.content && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              )}
              
              <img 
                src={item.content} 
                alt={item.title || 'Moodboard image'} 
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  console.error('Image load error:', item.content);
                  // Replace with error placeholder if needed
                  // e.target.src = 'data:image/svg+xml,%3Csvg...';
                }}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain', // Use contain instead of cover to preserve aspect ratio
                  pointerEvents: 'none', // Prevent image from capturing mouse events
                  opacity: imageLoaded ? 1 : 0.3, // Fade in when loaded
                  transition: 'opacity 0.3s ease',
                }} 
              />
            </Box>
          );
        case 'text':
          return (
            <Box sx={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
              <Typography 
                variant="body1" 
                component="div" 
                sx={{ 
                  p: 2, 
                  overflow: 'auto',
                  width: '100%',
                  height: '100%',
                  color: item.textColor || '#000000',
                  backgroundColor: item.backgroundColor || 'transparent',
                  fontFamily: item.fontFamily || 'inherit',
                  fontSize: item.fontSize || 'inherit',
                  fontWeight: item.fontWeight || 'normal',
                  lineHeight: item.lineHeight || 'normal',
                  textAlign: item.textAlign || 'left',
                  pointerEvents: 'none'
                }}
              >
                {item.content}
              </Typography>
            </Box>
          );
        case 'video':
          return (
            <Box sx={{ width: '100%', height: '100%', pointerEvents: selected ? 'auto' : 'none' }}>
              <video 
                controls 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain', // Changed from cover to contain
                  pointerEvents: selected ? 'auto' : 'none' // Only allow video controls when selected
                }}
              >
                <source src={item.content} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </Box>
          );
        case 'link':
          return (
            <Box 
              sx={{ 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                backgroundColor: item.backgroundColor || '#f5f5f5',
                borderRadius: 1,
                pointerEvents: 'none' // Change from conditional to always none
              }}
            >
              <LinkIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />
              <Typography 
                variant="body1" 
                component="a" 
                href={item.content} 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ 
                  textDecoration: 'none',
                  color: 'primary.main',
                  fontWeight: 'medium',
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  pointerEvents: 'auto' // Always allow link clicks
                }}
                onClick={(e) => {
                  // Prevent item selection when clicking the link
                  e.stopPropagation();
                }}
              >
                {item.title || item.content}
              </Typography>
            </Box>
          );
        default:
          return (
            <Box sx={{ p: 2, pointerEvents: 'none' }}>
              <Typography variant="body2" color="text.secondary">
                Unknown item type
              </Typography>
            </Box>
          );
      }
    };
  
    return (
      <Paper
        ref={itemRef}
        elevation={selected ? 8 : 1}
        sx={{
          position: 'absolute',
          left: `${item.x}px`,
          top: `${item.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          overflow: 'hidden',
          cursor: isEditable ? 'move' : 'default',
          border: selected ? '2px solid #2196f3' : 'none',
          transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease',
          zIndex: selected ? 100 : item.zIndex || 1,
          '&:hover': {
            boxShadow: isEditable ? '0 6px 12px rgba(0,0,0,0.15)' : 'none'
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => isEditable && setShowControls(true)}
        onMouseLeave={() => isEditable && !selected && setShowControls(false)}
      >
        {renderContent()}
        
        {/* Controls - visible when selected or hovered */}
        {(selected || showControls) && isEditable && (
          <>
            <Box 
              className="resize-handle"
              sx={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 24,
                height: 24,
                cursor: 'nwse-resize',
                zIndex: 101,
                backgroundColor: 'rgba(255,255,255,0.7)', // Add background for visibility
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  right: 3,
                  bottom: 3,
                  width: 14,
                  height: 14,
                  borderRight: '3px solid #2196f3',
                  borderBottom: '3px solid #2196f3'
                }
              }}
              onMouseDown={handleResizeMouseDown}
            />
            
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                display: 'flex',
                gap: 0.5,
                p: 0.5,
                bgcolor: 'rgba(255,255,255,0.95)',
                borderRadius: '0 0 0 8px',
                zIndex: 101,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              onClick={(e) => e.stopPropagation()} // Prevent deselection when clicking controls
            >
              <IconButton 
                size="small" 
                color="primary" 
                onClick={(e) => {
                  e.stopPropagation(); 
                  e.preventDefault();
                  onEdit(item);
                }}
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(33, 150, 243, 0.1)'
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                color="error" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete(item.id);
                }}
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(244, 67, 54, 0.1)'
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        )}
      </Paper>
    );
  };
// The issue is in how EditItemDialog is being used. 
// In the component definition, it expects 'open' as a prop, but in the MoodboardPage it references 'editDialogOpen' directly.

// Here's the fixed EditItemDialog component:
const EditItemDialog = ({ 
    open, 
    onClose, 
    currentItem, 
    onSave, 
    processing 
  }) => {
    // State for all editable properties
    const [editedContent, setEditedContent] = useState('');
    const [editedTitle, setEditedTitle] = useState('');
    const [editedTextColor, setEditedTextColor] = useState('#000000');
    const [editedBgColor, setEditedBgColor] = useState('transparent');
    const [editedFontFamily, setEditedFontFamily] = useState('');
    const [editedFontSize, setEditedFontSize] = useState('');
    const [editedFontWeight, setEditedFontWeight] = useState('');
    const [editedTextAlign, setEditedTextAlign] = useState('');
    const [editedLineHeight, setEditedLineHeight] = useState('');
    const [editedOpacity, setEditedOpacity] = useState(100);
    const [editedBorderRadius, setEditedBorderRadius] = useState(0);
    const [editedRotation, setEditedRotation] = useState(0);
    const [editedZIndex, setEditedZIndex] = useState(1);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    // Initialize form values when dialog opens
    useEffect(() => {
      if (!currentItem) return;
      
      // Reset image loaded state
      setImageLoaded(false);
      
      // Common properties
      setEditedTitle(currentItem.title || '');
      setEditedBgColor(currentItem.backgroundColor || 'transparent');
      setEditedOpacity(currentItem.opacity || 100);
      setEditedBorderRadius(currentItem.border_radius || 0);
      setEditedRotation(currentItem.rotation || 0);
      setEditedZIndex(currentItem.zIndex || 1);
      
      // Type-specific properties
      switch (currentItem.type) {
        case 'text':
          setEditedContent(currentItem.content || '');
          setEditedTextColor(currentItem.textColor || '#000000');
          setEditedFontFamily(currentItem.font_family || 'inherit');
          setEditedFontSize(currentItem.font_size || '1rem');
          setEditedFontWeight(currentItem.font_weight || 'normal');
          setEditedTextAlign(currentItem.text_align || 'left');
          setEditedLineHeight(currentItem.line_height || 'normal');
          break;
        case 'link':
          setEditedContent(currentItem.content || '');
          break;
        case 'image':
          // For image, just need to load existing properties, no content edit
          break;
        default:
          break;
      }
    }, [currentItem]);
    
    // Prepare data for saving
    const handleSave = () => {
      if (!currentItem) return;
      
      // Base properties for all item types
      let updatedItem = { 
        ...currentItem,
        title: editedTitle,
        backgroundColor: editedBgColor,
        opacity: editedOpacity,
        border_radius: editedBorderRadius,
        rotation: editedRotation,
        zIndex: editedZIndex
      };
      
      // Add type-specific properties
      switch (currentItem.type) {
        case 'text':
          updatedItem = {
            ...updatedItem,
            content: editedContent,
            textColor: editedTextColor,
            font_family: editedFontFamily,
            font_size: editedFontSize,
            font_weight: editedFontWeight,
            text_align: editedTextAlign,
            line_height: editedLineHeight
          };
          break;
        case 'link':
          updatedItem = {
            ...updatedItem,
            content: editedContent
          };
          break;
        case 'image':
          // No need to change content for image, just properties
          break;
        default:
          break;
      }
      
      onSave(updatedItem);
    };
    
    // Shared properties panel for all item types
    const renderSharedProperties = () => (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Common Properties
        </Typography>
        
        <Grid container spacing={2}>
          {/* Title (for all items) */}
          <Grid item xs={12}>
            <TextField
              label="Title (Optional)"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          
          {/* Background Color */}
          <Grid item xs={6}>
            <TextField
              label="Background"
              type="color"
              value={editedBgColor === 'transparent' ? '#ffffff' : editedBgColor}
              onChange={(e) => setEditedBgColor(e.target.value === '#ffffff' ? 'transparent' : e.target.value)}
              fullWidth
              size="small"
              InputProps={{ sx: { height: '40px' } }}
            />
          </Grid>
          
          {/* Border Radius */}
          <Grid item xs={6}>
            <TextField
              label="Border Radius"
              type="number"
              value={editedBorderRadius}
              onChange={(e) => setEditedBorderRadius(parseInt(e.target.value) || 0)}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">px</InputAdornment>,
              }}
            />
          </Grid>
          
          {/* Opacity Slider */}
          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>
              Opacity: {editedOpacity}%
            </Typography>
            <Slider
              value={editedOpacity}
              onChange={(e, newValue) => setEditedOpacity(newValue)}
              min={0}
              max={100}
              step={1}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          {/* Rotation */}
          <Grid item xs={6}>
            <TextField
              label="Rotation"
              type="number"
              value={editedRotation}
              onChange={(e) => setEditedRotation(parseInt(e.target.value) || 0)}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">°</InputAdornment>,
              }}
            />
          </Grid>
          
          {/* Z-Index */}
          <Grid item xs={6}>
            <TextField
              label="Layer (Z-Index)"
              type="number"
              value={editedZIndex}
              onChange={(e) => setEditedZIndex(parseInt(e.target.value) || 1)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    );
    
    // Render specific form based on item type
    const renderTypeSpecificForm = () => {
      if (!currentItem) return null;
      
      switch (currentItem.type) {
        case 'text':
          return (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Text Content
              </Typography>
              
              <TextField
                multiline
                rows={4}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                placeholder="Enter your text"
              />
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Text Color */}
                <Grid item xs={6}>
                  <TextField
                    label="Text Color"
                    type="color"
                    value={editedTextColor}
                    onChange={(e) => setEditedTextColor(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{ sx: { height: '40px' } }}
                  />
                </Grid>
                
                {/* Font Family */}
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Font Family</InputLabel>
                    <Select
                      value={editedFontFamily}
                      onChange={(e) => setEditedFontFamily(e.target.value)}
                      label="Font Family"
                    >
                      <MenuItem value="inherit">Default</MenuItem>
                      <MenuItem value="'Arial', sans-serif">Arial</MenuItem>
                      <MenuItem value="'Helvetica', sans-serif">Helvetica</MenuItem>
                      <MenuItem value="'Times New Roman', serif">Times New Roman</MenuItem>
                      <MenuItem value="'Georgia', serif">Georgia</MenuItem>
                      <MenuItem value="'Courier New', monospace">Courier New</MenuItem>
                      <MenuItem value="'Verdana', sans-serif">Verdana</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Font Size */}
                <Grid item xs={4}>
                  <TextField
                    label="Font Size"
                    value={editedFontSize}
                    onChange={(e) => setEditedFontSize(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                
                {/* Font Weight */}
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Weight</InputLabel>
                    <Select
                      value={editedFontWeight}
                      onChange={(e) => setEditedFontWeight(e.target.value)}
                      label="Weight"
                    >
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="bold">Bold</MenuItem>
                      <MenuItem value="lighter">Lighter</MenuItem>
                      <MenuItem value="bolder">Bolder</MenuItem>
                      <MenuItem value="100">100</MenuItem>
                      <MenuItem value="200">200</MenuItem>
                      <MenuItem value="300">300</MenuItem>
                      <MenuItem value="400">400</MenuItem>
                      <MenuItem value="500">500</MenuItem>
                      <MenuItem value="600">600</MenuItem>
                      <MenuItem value="700">700</MenuItem>
                      <MenuItem value="800">800</MenuItem>
                      <MenuItem value="900">900</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Text Align */}
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Align</InputLabel>
                    <Select
                      value={editedTextAlign}
                      onChange={(e) => setEditedTextAlign(e.target.value)}
                      label="Align"
                    >
                      <MenuItem value="left">Left</MenuItem>
                      <MenuItem value="center">Center</MenuItem>
                      <MenuItem value="right">Right</MenuItem>
                      <MenuItem value="justify">Justify</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Line Height */}
                <Grid item xs={12}>
                  <TextField
                    label="Line Height"
                    value={editedLineHeight}
                    onChange={(e) => setEditedLineHeight(e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="e.g., 1.5, 20px, normal"
                  />
                </Grid>
              </Grid>
              
              {/* Text Preview */}
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${editedBorderRadius}px`,
                bgcolor: editedBgColor,
                opacity: editedOpacity / 100,
                transform: `rotate(${editedRotation}deg)`,
                transition: 'all 0.2s ease'
              }}>
                <Typography 
                  variant="body1"
                  sx={{ 
                    color: editedTextColor,
                    fontFamily: editedFontFamily,
                    fontSize: editedFontSize,
                    fontWeight: editedFontWeight,
                    textAlign: editedTextAlign,
                    lineHeight: editedLineHeight
                  }}
                >
                  {editedContent || 'Preview of your text will appear here'}
                </Typography>
              </Box>
            </>
          );
          
        case 'link':
          return (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Link Properties
              </Typography>
              
              <TextField
                label="URL"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                placeholder="https://example.com"
              />
              
              {/* Link Preview */}
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${editedBorderRadius}px`,
                bgcolor: editedBgColor || '#f5f5f5',
                opacity: editedOpacity / 100,
                transform: `rotate(${editedRotation}deg)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}>
                <LinkIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />
                <Typography 
                  variant="body1"
                  component="div" 
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 'medium',
                    textAlign: 'center',
                    wordBreak: 'break-word'
                  }}
                >
                  {editedTitle || editedContent || 'Link preview'}
                </Typography>
              </Box>
            </>
          );
          
        case 'image':
          return (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Image Properties
              </Typography>
              
              {currentItem?.content && (
                <Box sx={{ 
                  mt: 2, 
                  mb: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <img 
                    src={currentItem.content} 
                    alt={currentItem.title || "Image"} 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '200px',
                      objectFit: 'contain', 
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    The image content cannot be edited directly. To change the image,
                    you'll need to delete this item and add a new one.
                  </Typography>
                </Box>
              )}
            </Box>
          );
        default:
          return null;
      }
    };
    
    return (
        <Dialog 
        open={open} // This was changed from editDialogOpen to open
        onClose={onClose} // This was changed to use the onClose prop
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentItem?.type === 'text' && 'Edit Text'}
          {currentItem?.type === 'link' && 'Edit Link'}
          {currentItem?.type === 'image' && 'Edit Image'}
          {!currentItem?.type && 'Edit Item'}
        </DialogTitle>
        <DialogContent>
          {renderTypeSpecificForm()}
          {renderSharedProperties()}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={processing || 
              (currentItem?.type === 'text' && !editedContent?.trim()) ||
              (currentItem?.type === 'link' && !editedContent?.trim()) ||
              !currentItem}
            startIcon={processing ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {processing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

// Main Moodboard Component
function MoodboardPage() {
  const { moodboardId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const canvasRef = useRef(null);
  
  // State for moodboard data
  const [moodboard, setMoodboard] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  
  // State for viewport control
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  
  // State for UI controls
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // State for item creation
  const [newImage, setNewImage] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newText, setNewText] = useState('');
  const [newTextColor, setNewTextColor] = useState('#000000');
  const [newTextBgColor, setNewTextBgColor] = useState('transparent');
  const [newLink, setNewLink] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  
  // State for permissions
  const [isEditable, setIsEditable] = useState(false);
  
  useEffect(() => {
    const fetchMoodboard = async () => {
      if (!moodboardId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch moodboard data
        const { data: moodboardData, error: moodboardError } = await supabase
          .from('moodboards')
          .select('*')
          .eq('id', moodboardId)
          .single();
        
        if (moodboardError) throw moodboardError;
        setMoodboard(moodboardData);
        
        // Check permissions
        let canEdit = false;
        if (user) {
          if (moodboardData.created_by === user.id) {
            canEdit = true;
          } else if (moodboardData.permissions === 'collaborative') {
            canEdit = true;
          }
        }
        setIsEditable(canEdit);
        
        // Fetch moodboard items
        const { data: itemsData, error: itemsError } = await supabase
          .from('moodboard_items')
          .select('*')
          .eq('moodboard_id', moodboardId)
          .order('created_at', { ascending: true });
        
        if (itemsError) throw itemsError;
        setItems(itemsData || []);
        
      } catch (err) {
        console.error('Error fetching moodboard:', err);
        setError('Failed to load moodboard data. It may not exist or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMoodboard();
  }, [moodboardId, user]);
  
  // Canvas dragging handlers
  const handleCanvasMouseDown = (e) => {
    // Only drag canvas with middle mouse button or when no item is selected
    if (e.button === 1 || !selectedItemId) {
      setIsDraggingCanvas(true);
      setStartDragPos({ x: e.clientX, y: e.clientY });
      e.preventDefault(); // Prevent default behavior for middle mouse button
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    if (isDraggingCanvas) {
      const dx = e.clientX - startDragPos.x;
      const dy = e.clientY - startDragPos.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setStartDragPos({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };
  
  // Handle zoom controls
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.3));
  };
  
  const handleZoomReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Handle item selection and deselection
  const handleSelectItem = (itemId) => {
    setSelectedItemId(itemId);
  };
  
  const handleCanvasClick = () => {
    setSelectedItemId(null);
  };
  
  // Handle item manipulation
  const handleMoveItem = (itemId, newPosition) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, x: newPosition.x, y: newPosition.y } 
          : item
      )
    );
  };
  
  const handleResizeItem = (itemId, newSize) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, width: newSize.width, height: newSize.height } 
          : item
      )
    );
  };
  
  const handleEditItem = (item) => {
    setCurrentEditItem(item);
    setEditDialogOpen(true);
  };
  
  const handleDeleteItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('moodboard_items')
        .delete()
        .eq('id', itemId);
        
      if (error) throw error;
      
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      setSelectedItemId(null);
      
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };
  
  // Handle adding new items
  const handleAddClick = (event) => {
    setAddMenuAnchor(event.currentTarget);
  };
  
  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };
  
  const handleUploadImage = async () => {
    if (!newImage) return;
    
    try {
      setSaving(true);
      
      // Upload image to storage
      const fileExt = newImage.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `moodboards/${moodboardId}/${fileName}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('shared')
        .upload(filePath, newImage, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shared')
        .getPublicUrl(filePath);
      
      // Calculate position based on current view
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const centerX = (canvasRect.width / 2 - position.x) / scale;
      const centerY = (canvasRect.height / 2 - position.y) / scale;
      
      // Create new item
      const newItem = {
        moodboard_id: moodboardId,
        type: 'image',
        content: publicUrl,
        x: centerX - 150, // Center the item in view
        y: centerY - 100,
        width: 300,
        height: 200,
        zIndex: items.length + 1,
        created_by: user.id
      };
      
      const { data: itemData, error: itemError } = await supabase
        .from('moodboard_items')
        .insert([newItem])
        .select();
      
      if (itemError) throw itemError;
      
      // Add to local state
      setItems(prev => [...prev, itemData[0]]);
      setSelectedItemId(itemData[0].id);
      
      // Reset form and close dialog
      setNewImage(null);
      setNewImageUrl('');
      setUploadDialogOpen(false);
      
      setSuccess('Image added successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddText = async () => {
    if (!newText.trim()) return;
    
    try {
      setSaving(true);
      
      // Calculate position based on current view
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const centerX = (canvasRect.width / 2 - position.x) / scale;
      const centerY = (canvasRect.height / 2 - position.y) / scale;
      
      // Create new item
      const newItem = {
        moodboard_id: moodboardId,
        type: 'text',
        content: newText,
        textColor: newTextColor,
        backgroundColor: newTextBgColor,
        x: centerX - 125, // Center the item in view
        y: centerY - 75,
        width: 250,
        height: 150,
        zIndex: items.length + 1,
        created_by: user.id
      };
      
      const { data: itemData, error: itemError } = await supabase
        .from('moodboard_items')
        .insert([newItem])
        .select();
      
      if (itemError) throw itemError;
      
      // Add to local state
      setItems(prev => [...prev, itemData[0]]);
      setSelectedItemId(itemData[0].id);
      
      // Reset form and close dialog
      setNewText('');
      setNewTextColor('#000000');
      setNewTextBgColor('transparent');
      setTextDialogOpen(false);
      
      setSuccess('Text added successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error adding text:', err);
      setError('Failed to add text');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddLink = async () => {
    if (!newLink.trim()) return;
    
    try {
      setSaving(true);
      
      // Calculate position based on current view
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const centerX = (canvasRect.width / 2 - position.x) / scale;
      const centerY = (canvasRect.height / 2 - position.y) / scale;
      
      // Create new item
      const newItem = {
        moodboard_id: moodboardId,
        type: 'link',
        content: newLink,
        title: newLinkTitle || newLink,
        x: centerX - 100, // Center the item in view
        y: centerY - 60,
        width: 200,
        height: 120,
        zIndex: items.length + 1,
        created_by: user.id
      };
      
      const { data: itemData, error: itemError } = await supabase
        .from('moodboard_items')
        .insert([newItem])
        .select();
      
      if (itemError) throw itemError;
      
      // Add to local state
      setItems(prev => [...prev, itemData[0]]);
      setSelectedItemId(itemData[0].id);
      
      // Reset form and close dialog
      setNewLink('');
      setNewLinkTitle('');
      setLinkDialogOpen(false);
      
      setSuccess('Link added successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error adding link:', err);
      setError('Failed to add link');
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Batch update all items that have changed since initial load
      for (const item of items) {
        const { error } = await supabase
          .from('moodboard_items')
          .update({
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            zIndex: item.zIndex || items.indexOf(item) + 1,
            updated_at: new Date()
          })
          .eq('id', item.id);
        
        if (error) throw error;
      }
      
      setSuccess('Moodboard saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error saving moodboard:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };
  
  // Improved updateItem method
  // Updated handleUpdateItem function to save all properties
const handleUpdateItem = async (updatedItem) => {
    if (!updatedItem) return;
    
    try {
      setSaving(true);
      
      // Make sure we're only updating fields that exist in the database
      const itemUpdate = {
        // Common properties
        title: updatedItem.title,
        content: updatedItem.content,
        x: updatedItem.x,
        y: updatedItem.y,
        width: updatedItem.width,
        height: updatedItem.height,
        rotation: updatedItem.rotation,
        zIndex: updatedItem.zIndex,
        backgroundColor: updatedItem.backgroundColor,
        opacity: updatedItem.opacity,
        border_radius: updatedItem.border_radius,
        updated_at: new Date()
      };
      
      // Add type-specific properties
      if (updatedItem.type === 'text') {
        Object.assign(itemUpdate, {
          textColor: updatedItem.textColor,
          font_family: updatedItem.font_family,
          font_size: updatedItem.font_size,
          font_weight: updatedItem.font_weight,
          text_align: updatedItem.text_align,
          line_height: updatedItem.line_height
        });
      }
      
      // Update in database
      const { error } = await supabase
        .from('moodboard_items')
        .update(itemUpdate)
        .eq('id', updatedItem.id);
      
      if (error) throw error;
      
      // Update in local state
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === updatedItem.id ? {...item, ...itemUpdate} : item
        )
      );
      
      // Reset and close dialog
      setCurrentEditItem(null);
      setEditDialogOpen(false);
      
      setSuccess('Item updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item: ' + err.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle file input change for image upload
  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setNewImage(file);
    setNewImageUrl(URL.createObjectURL(file));
  };
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '80vh' 
        }}
      >
        <CircularProgress size={40} color="primary" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading moodboard...
        </Typography>
      </Box>
    );
  }
  
  if (error && !moodboard) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!moodboard) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Moodboard Not Found
          </Typography>
          <Typography variant="body1" paragraph>
            The moodboard you're looking for doesn't exist or you don't have permission to view it.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box 
        sx={{ 
          p: 1, 
          display: 'flex', 
          justifyContent: 'space-between',
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/network/' + moodboard.network_id)}
            size="small"
          >
            Back
          </Button>
          
          <Typography 
            variant="h6" 
            sx={{ 
              ml: 1,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {moodboard.title}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
          {/* Zoom controls */}
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOutIcon />
          </IconButton>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            minWidth: 60,
            mx: 0.5
          }}>
            <Typography variant="body2" align="center" sx={{ width: '100%' }}>
              {Math.round(scale * 100)}%
            </Typography>
          </Box>
          
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomInIcon />
          </IconButton>
          
          <Button 
            size="small" 
            variant="outlined" 
            onClick={handleZoomReset}
            sx={{ ml: 1, display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Reset View
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isEditable && (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddClick}
                color="primary"
                size="small"
              >
                Add Item
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveChanges}
                disabled={saving}
                size="small"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
          
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ShareIcon />}
            size="small"
          >
            Share
          </Button>
        </Box>
      </Box>
      
      {/* Status messages */}
      {error && (
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            sx={{ 
              position: 'absolute', 
              top: '4rem', 
              right: '1rem', 
              zIndex: 1100,
              maxWidth: '80%',
              boxShadow: 3
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Fade>
      )}
      
      {success && (
        <Fade in={!!success}>
          <Alert 
            severity="success" 
            sx={{ 
              position: 'absolute', 
              top: '4rem', 
              right: '1rem', 
              zIndex: 1100,
              maxWidth: '80%',
              boxShadow: 3
            }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        </Fade>
      )}
      
      {/* Permission indicator */}
      <Box
        sx={{ 
          position: 'absolute',
          top: '4rem',
          left: '1rem',
          zIndex: 1000,
          bgcolor: isEditable ? alpha(theme.palette.success.light, 0.9) : alpha(theme.palette.warning.light, 0.9),
          color: 'white',
          borderRadius: 1,
          px: 1,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          boxShadow: 2
        }}
      >
        {isEditable ? (
          <>
            <LockOpenIcon fontSize="small" />
            <Typography variant="caption" fontWeight="medium">
              Editing Enabled
            </Typography>
          </>
        ) : (
          <>
            <LockIcon fontSize="small" />
            <Typography variant="caption" fontWeight="medium">
              View Only
            </Typography>
          </>
        )}
      </Box>
      
      {/* Main Canvas */}
      <Box
        ref={canvasRef}
        sx={{ 
          flexGrow: 1, 
          position: 'relative', 
          overflow: 'hidden',
          bgcolor: '#f5f5f5',
          cursor: isDraggingCanvas ? 'grabbing' : 'default'
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {/* The infinite canvas */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transformOrigin: '0 0',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDraggingCanvas ? 'none' : 'transform 0.1s ease'
          }}
        >
          {/* Background grid */}
          <Box 
            sx={{ 
              position: 'absolute',
              inset: '-5000px',
              width: '10000px',
              height: '10000px',
              backgroundImage: `linear-gradient(#ddd 1px, transparent 1px), 
                                linear-gradient(90deg, #ddd 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              zIndex: 0
            }} 
          />
          
          {/* Render all items */}
          {items.map(item => (
            <MoodboardItem
              key={item.id}
              item={item}
              selected={selectedItemId === item.id}
              onSelect={handleSelectItem}
              onMove={handleMoveItem}
              onResize={handleResizeItem}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              scale={scale}
              isEditable={isEditable}
            />
          ))}
        </Box>
      </Box>
      
      {/* Floating action buttons when item is selected */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {selectedItemId && (
          <Zoom in={true}>
            <Paper
              elevation={4}
              sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: '1px solid',
                borderColor: 'primary.light',
                borderRadius: 2
              }}
            >
              <Typography variant="body2" color="primary" sx={{ ml: 1, mr: 2 }}>
                Item selected
              </Typography>
              {isEditable && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      const item = items.find(i => i.id === selectedItemId);
                      if (item) handleEditItem(item);
                    }}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      if (selectedItemId) handleDeleteItem(selectedItemId);
                    }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </Paper>
          </Zoom>
        )}
      </Box>
      
      {/* Add Item Menu */}
      <Menu
        anchorEl={addMenuAnchor}
        open={Boolean(addMenuAnchor)}
        onClose={handleAddMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem 
          onClick={() => {
            handleAddMenuClose();
            setUploadDialogOpen(true);
          }}
        >
          <ImageIcon sx={{ mr: 1 }} /> Add Image
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleAddMenuClose();
            setTextDialogOpen(true);
          }}
        >
          <TextFieldsIcon sx={{ mr: 1 }} /> Add Text
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleAddMenuClose();
            setLinkDialogOpen(true);
          }}
        >
          <LinkIcon sx={{ mr: 1 }} /> Add Link
        </MenuItem>
      </Menu>
      
      {/* Upload Image Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Image</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="upload-image-button"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="upload-image-button">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ py: 5, border: '1px dashed' }}
              >
                {newImageUrl ? 'Change Image' : 'Select an image to upload'}
              </Button>
            </label>
            
            {newImageUrl && (
              <Box sx={{ 
                mt: 2, 
                p: 1, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                textAlign: 'center'
              }}>
                <img 
                  src={newImageUrl} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px',
                    objectFit: 'contain' 
                  }} 
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUploadImage} 
            variant="contained" 
            disabled={!newImage || saving}
            startIcon={saving ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {saving ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Text Dialog */}
      <Dialog 
        open={textDialogOpen} 
        onClose={() => setTextDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Text</DialogTitle>
        <DialogContent>
          <TextField
            label="Text Content"
            multiline
            rows={4}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
          />
          
          <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
            <TextField
              label="Text Color"
              type="color"
              value={newTextColor}
              onChange={(e) => setNewTextColor(e.target.value)}
              fullWidth
              margin="normal"
              InputProps={{ sx: { height: '56px' } }}
            />
            
            <TextField
              label="Background Color"
              type="color"
              value={newTextBgColor === 'transparent' ? '#ffffff' : newTextBgColor}
              onChange={(e) => setNewTextBgColor(e.target.value === '#ffffff' ? 'transparent' : e.target.value)}
              fullWidth
              margin="normal"
              InputProps={{ sx: { height: '56px' } }}
            />
          </Box>
          
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: newTextBgColor,
            color: newTextColor
          }}>
            <Typography variant="body1">
              {newText || 'Preview of your text will appear here'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTextDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddText} 
            variant="contained" 
            disabled={!newText.trim() || saving}
            startIcon={saving ? <CircularProgress size={20} /> : <TextFieldsIcon />}
          >
            {saving ? 'Adding...' : 'Add Text'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Link Dialog */}
      <Dialog 
        open={linkDialogOpen} 
        onClose={() => setLinkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Link</DialogTitle>
        <DialogContent>
          <TextField
            label="URL"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            placeholder="https://example.com"
          />
          
          <TextField
            label="Title (Optional)"
            value={newLinkTitle}
            onChange={(e) => setNewLinkTitle(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            placeholder="Enter a descriptive title for the link"
          />
          
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <LinkIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />
            <Typography 
              variant="body1"
              component="div" 
              sx={{ 
                color: 'primary.main',
                fontWeight: 'medium',
                textAlign: 'center',
                wordBreak: 'break-word'
              }}
            >
              {newLinkTitle || newLink || 'Link preview'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddLink} 
            variant="contained" 
            disabled={!newLink.trim() || saving}
            startIcon={saving ? <CircularProgress size={20} /> : <LinkIcon />}
          >
            {saving ? 'Adding...' : 'Add Link'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <EditItemDialog
  open={editDialogOpen}
  onClose={() => setEditDialogOpen(false)}
  currentItem={currentEditItem}
  onSave={handleUpdateItem}
  processing={saving}
/>
    </Box>
  );
}

export default MoodboardPage;