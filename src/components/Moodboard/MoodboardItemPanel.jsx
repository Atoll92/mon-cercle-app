import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Drawer,
  Typography,
  TextField,
  Slider,
  Button,
  IconButton,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  PictureAsPdf as PdfIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseclient';

const MoodboardItemPanel = ({ 
  open, 
  item, 
  onClose, 
  onUpdate, 
  onDelete,
  moodboardId 
}) => {
  // State for all editable properties - using exact field names from database
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedTextColor, setEditedTextColor] = useState('#000000');
  const [editedBackgroundColor, setEditedBackgroundColor] = useState('#ffffff');
  const [editedFont_family, setEditedFont_family] = useState('');
  const [editedFont_size, setEditedFont_size] = useState('');
  const [editedFont_weight, setEditedFont_weight] = useState('');
  const [editedText_align, setEditedText_align] = useState('');
  const [editedLine_height, setEditedLine_height] = useState('');
  const [editedOpacity, setEditedOpacity] = useState(100);
  const [editedBorder_radius, setEditedBorder_radius] = useState(0);
  const [editedRotation, setEditedRotation] = useState(0);
  const [editedZIndex, setEditedZIndex] = useState(1);
  const [uploading, setUploading] = useState(false);
  
  // File input refs
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  
  // Initialize form values when item changes
  useEffect(() => {
    if (!item) return;
    
    // Common properties
    setEditedTitle(item.title || '');
    setEditedBackgroundColor(item.backgroundColor || 'transparent');
    // Convert opacity from 0-1 range to 0-100 percentage
    setEditedOpacity(item.opacity !== undefined ? item.opacity * 100 : 100);
    setEditedBorder_radius(item.border_radius || 0);
    setEditedRotation(item.rotation || 0);
    setEditedZIndex(item.zIndex || 1);
    
    // Type-specific properties
    switch (item.type) {
      case 'text':
        setEditedContent(item.content || '');
        setEditedTextColor(item.textColor || '#000000');
        setEditedFont_family(item.font_family || 'inherit');
        setEditedFont_size(item.font_size || '1rem');
        setEditedFont_weight(item.font_weight || 'normal');
        setEditedText_align(item.text_align || 'left');
        setEditedLine_height(item.line_height || 'normal');
        break;
      case 'link':
        setEditedContent(item.content || '');
        break;
      case 'image':
        // For image, just need to load existing properties, no content edit
        break;
      default:
        break;
    }
  }, [item]);
  
  // Auto-save function for immediate updates
  const updateProperty = (property, value) => {
    if (!item) return;
    
    const updatedItem = {
      ...item,
      [property]: value
    };
    
    // Handle special cases for opacity
    if (property === 'opacity') {
      updatedItem.opacity = value / 100; // Convert from percentage to 0-1 range
    }
    
    onUpdate(updatedItem);
  };
  
  // Handle content updates with debouncing for text fields
  const [contentTimeout, setContentTimeout] = useState(null);
  
  const handleContentChange = (value) => {
    setEditedContent(value);
    
    // Clear existing timeout
    if (contentTimeout) {
      clearTimeout(contentTimeout);
    }
    
    // Set new timeout for auto-save (500ms delay for text input)
    const timeout = setTimeout(() => {
      updateProperty('content', value);
    }, 500);
    
    setContentTimeout(timeout);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (contentTimeout) {
        clearTimeout(contentTimeout);
      }
    };
  }, [contentTimeout]);
  
  // Render shared properties panel
  const renderSharedProperties = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
        Item Properties
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Background Color */}
        <Box>
          <Typography variant="body2" gutterBottom>Background Color</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* <Box 
              sx={{ 
                width: 36, 
                height: 36, 
                borderRadius: 1, 
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: editedBackgroundColor === 'transparent' ? 'transparent' : editedBackgroundColor,
                backgroundImage: editedBackgroundColor === 'transparent' ? 
                  'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 
                  'none',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 4px 4px',
              }}
            /> */}
            <TextField
              type="color"
              value={editedBackgroundColor === 'transparent' ? '#ffffff' : editedBackgroundColor}
              onChange={(e) => {
                setEditedBackgroundColor(e.target.value);
                updateProperty('backgroundColor', e.target.value);
              }}
              fullWidth
              size="small"
              InputProps={{ sx: { height: '36px' } }}
            />
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => {
                setEditedBackgroundColor('transparent');
                updateProperty('backgroundColor', 'transparent');
              }}
              sx={{ minWidth: 'auto' }}
            >
              Clear
            </Button>
          </Box>
        </Box>
        
        {/* Opacity Slider */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Opacity: {Math.round(editedOpacity)}%
          </Typography>
          <Slider
            value={editedOpacity}
            onChange={(e, newValue) => {
              setEditedOpacity(newValue);
            }}
            onChangeCommitted={(e, newValue) => {
              updateProperty('opacity', newValue);
            }}
            min={0}
            max={100}
            step={1}
            valueLabelDisplay="auto"
            sx={{ maxWidth: "95%" }}
          />
        </Box>
        
        {/* Border Radius */}
        <TextField
          label="Border Radius"
          type="number"
          value={editedBorder_radius}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            setEditedBorder_radius(value);
            updateProperty('border_radius', value);
          }}
          fullWidth
          size="small"
          InputProps={{
            endAdornment: <InputAdornment position="end">px</InputAdornment>,
          }}
        />
        
        {/* Rotation */}
        <TextField
          label="Rotation"
          type="number"
          value={editedRotation}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            setEditedRotation(value);
            updateProperty('rotation', value);
          }}
          fullWidth
          size="small"
          InputProps={{
            endAdornment: <InputAdornment position="end">°</InputAdornment>,
          }}
        />
        
        {/* Z-Index */}
        <TextField
          label="Layer (Z-Index)"
          type="number"
          value={editedZIndex}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1;
            setEditedZIndex(value);
            updateProperty('zIndex', value);
          }}
          fullWidth
          size="small"
          helperText="Higher numbers appear on top"
        />
      </Box>
    </Box>
  );
  
  // Render type-specific form
  const renderTypeSpecificForm = () => {
    if (!item) return null;
    
    switch (item.type) {
      case 'text':
        return (
          <>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Text Content
            </Typography>
            
            <TextField
              multiline
              rows={4}
              value={editedContent}
              onChange={(e) => handleContentChange(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              placeholder="Enter your text"
            />
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Text Color */}
              <Grid item xs={12}>
                <TextField
                  label="Text Color"
                  type="color"
                  value={editedTextColor}
                  onChange={(e) => {
                    setEditedTextColor(e.target.value);
                    updateProperty('textColor', e.target.value);
                  }}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { height: '40px' } }}
                />
              </Grid>
              
              {/* Font Family */}
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Font Family</InputLabel>
                  <Select
                    value={editedFont_family}
                    onChange={(e) => {
                      setEditedFont_family(e.target.value);
                      updateProperty('font_family', e.target.value);
                    }}
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
              <Grid item xs={12}>
                <TextField
                  label="Font Size"
                  value={editedFont_size}
                  onChange={(e) => {
                    setEditedFont_size(e.target.value);
                    updateProperty('font_size', e.target.value);
                  }}
                  fullWidth
                  size="small"
                  placeholder="e.g., 16px, 1.2rem"
                />
              </Grid>
              
              {/* Font Weight */}
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Weight</InputLabel>
                  <Select
                    value={editedFont_weight}
                    onChange={(e) => {
                      setEditedFont_weight(e.target.value);
                      updateProperty('font_weight', e.target.value);
                    }}
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
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Align</InputLabel>
                  <Select
                    value={editedText_align}
                    onChange={(e) => {
                      setEditedText_align(e.target.value);
                      updateProperty('text_align', e.target.value);
                    }}
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
                  value={editedLine_height}
                  onChange={(e) => {
                    setEditedLine_height(e.target.value);
                    updateProperty('line_height', e.target.value);
                  }}
                  fullWidth
                  size="small"
                  placeholder="e.g., 1.5, 20px, normal"
                />
              </Grid>
            </Grid>
          </>
        );
        
      case 'link':
        return (
          <>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Link Properties
            </Typography>
            
            <TextField
              label="URL"
              value={editedContent}
              onChange={(e) => handleContentChange(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              placeholder="https://example.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Custom Title (Optional)"
              value={editedTitle}
              onChange={(e) => {
                setEditedTitle(e.target.value);
                updateProperty('title', e.target.value);
              }}
              fullWidth
              margin="normal"
              variant="outlined"
              placeholder="Custom title for this link"
              helperText="Leave empty to use the website's title"
            />
          </>
        );
        
      case 'image':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Image Properties
            </Typography>
            
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                if (!e.target.files || e.target.files.length === 0) return;
                
                const file = e.target.files[0];
                
                // Check file size (20MB max)
                if (file.size > 20 * 1024 * 1024) {
                  alert('Image file size must be less than 20MB');
                  return;
                }
                
                try {
                  setUploading(true);
                  
                  // Upload new image to storage
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                  const filePath = `moodboards/${moodboardId}/${fileName}`;
                  
                  const { error: uploadError } = await supabase.storage
                    .from('shared')
                    .upload(filePath, file, {
                      cacheControl: '3600',
                      upsert: true
                    });
                  
                  if (uploadError) throw uploadError;
                  
                  // Get public URL
                  const { data: { publicUrl } } = supabase.storage
                    .from('shared')
                    .getPublicUrl(filePath);
                  
                  // Update the item with new image URL
                  const updatedItem = {
                    ...item,
                    content: publicUrl
                  };
                  
                  onUpdate(updatedItem);
                  
                } catch (error) {
                  console.error('Error uploading image:', error);
                  alert('Failed to upload image');
                } finally {
                  setUploading(false);
                  // Reset input
                  e.target.value = '';
                }
              }}
            />
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={uploading ? null : <CloudUploadIcon />}
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              sx={{ mt: 2 }}
            >
              {uploading ? 'Uploading...' : 'Replace Image'}
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Upload a new image to replace the current one. Properties will be preserved.
            </Typography>
          </Box>
        );

      case 'pdf':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              PDF Properties
            </Typography>
            
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={async (e) => {
                if (!e.target.files || e.target.files.length === 0) return;
                
                const file = e.target.files[0];
                
                // Check file size (20MB max)
                if (file.size > 20 * 1024 * 1024) {
                  alert('PDF file size must be less than 20MB');
                  return;
                }
                
                try {
                  setUploading(true);
                  
                  // Upload new PDF to storage
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                  const filePath = `moodboards/${moodboardId}/pdfs/${fileName}`;
                  
                  const { error: uploadError } = await supabase.storage
                    .from('shared')
                    .upload(filePath, file, {
                      cacheControl: '3600',
                      upsert: true
                    });
                  
                  if (uploadError) throw uploadError;
                  
                  // Get public URL
                  const { data: { publicUrl } } = supabase.storage
                    .from('shared')
                    .getPublicUrl(filePath);
                  
                  // Update the item with new PDF URL and title
                  const updatedItem = {
                    ...item,
                    content: publicUrl,
                    title: file.name.replace(/\.pdf$/i, '') // Update title to new filename
                  };
                  
                  onUpdate(updatedItem);
                  
                } catch (error) {
                  console.error('Error uploading PDF:', error);
                  alert('Failed to upload PDF');
                } finally {
                  setUploading(false);
                  // Reset input
                  e.target.value = '';
                }
              }}
            />
            
            {item?.content && (
              <Box sx={{ mt: 2 }}>
                <Button
                  component="a"
                  href={item.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  size="small"
                  fullWidth
                >
                  View Current PDF
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={uploading ? null : <CloudUploadIcon />}
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={uploading}
                  sx={{ mt: 1 }}
                >
                  {uploading ? 'Uploading...' : 'Replace PDF'}
                </Button>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Upload a new PDF to replace the current one. Properties will be preserved.
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
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      hideBackdrop={true}
      ModalProps={{
        slots: { backdrop: "div" },
        slotProps: {
          root: { //override the fixed position + the size of backdrop
            style: {
              position: "absolute",
              top: "unset",
              bottom: "unset",
              left: "unset",
              right: "unset",
            },
          },
        },
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: 360,
          boxSizing: 'border-box',
          boxShadow: '-15px 0 15px rgba(0,0,0,0.1)',
          height: 'calc(100% - 130px)',
          top: 130
        }
      }}
    >
      {item && (
        <>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            px: 2,
            py: 1,
            bgcolor: 'action.hover',
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Edit {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Scrollable content */}
          <Box sx={{ flex: 1, mt: 2, p: 2 }}>
            {renderTypeSpecificForm()}
            {renderSharedProperties()}
            
            {/* Delete button in scrollable area */}
            <Box sx={{ mt: 4, mb: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this item?')) {
                    onDelete(item.id);
                    onClose();
                  }
                }}
              >
                Delete Item
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Drawer>
  );
};

export default MoodboardItemPanel;