import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Grid,
  Paper,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Link as LinkIcon,
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import LinkPreview from './LinkPreview';

const EditItemDialog = ({ 
  open, 
  onClose, 
  currentItem, 
  onSave, 
  processing 
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
  const [editedOpacity, setEditedOpacity] = useState('100%');
  const [editedBorder_radius, setEditedBorder_radius] = useState(0);
  const [editedRotation, setEditedRotation] = useState(0);
  const [editedZIndex, setEditedZIndex] = useState(1);
  
  // Initialize form values when dialog opens - using exact field names from database
  useEffect(() => {
    if (!currentItem) return;
    
    // Common properties
    setEditedTitle(currentItem.title || '');
    setEditedBackgroundColor(currentItem.backgroundColor || 'transparent');
    // Convert opacity from 0-1 range to 0-100 percentage
    setEditedOpacity(currentItem.opacity !== undefined ? currentItem.opacity * 100 : 100);
    setEditedBorder_radius(currentItem.border_radius || 0);
    setEditedRotation(currentItem.rotation || 0);
    setEditedZIndex(currentItem.zIndex || 1);
    
    // Type-specific properties
    switch (currentItem.type) {
      case 'text':
        setEditedContent(currentItem.content || '');
        setEditedTextColor(currentItem.textColor || '#000000');
        setEditedFont_family(currentItem.font_family || 'inherit');
        setEditedFont_size(currentItem.font_size || '1rem');
        setEditedFont_weight(currentItem.font_weight || 'normal');
        setEditedText_align(currentItem.text_align || 'left');
        setEditedLine_height(currentItem.line_height || 'normal');
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
  
  // Prepare data for saving - using exact field names from database
  const handleSave = () => {
    if (!currentItem) return;
    
    // Base properties for all item types
    let updatedItem = { 
      ...currentItem,
      title: editedTitle,
      backgroundColor: editedBackgroundColor,
      // Convert opacity from 0-100 percentage back to 0-1 range
      opacity: editedOpacity !== undefined ? editedOpacity / 100 : 1,
      border_radius: editedBorder_radius,
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
          font_family: editedFont_family,
          font_size: editedFont_size,
          font_weight: editedFont_weight,
          text_align: editedText_align,
          line_height: editedLine_height
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
  
  // Improved shared properties panel with better UI organization
  const renderSharedProperties = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Common Properties
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
        <Grid container spacing={2}>
          {/* Title (for all items) */}
          <Grid item xs={12}>
            <TextField
              label="Title (Optional)"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <span role="img" aria-label="title">📝</span>
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>
        </Grid>
      </Paper>
          
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        <span role="img" aria-label="appearance" style={{ marginRight: '8px' }}>🎨</span> Appearance
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          {/* Background Color */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" gutterBottom>Background Color</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
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
                />
                <TextField
                  type="color"
                  value={editedBackgroundColor === 'transparent' ? '#ffffff' : editedBackgroundColor}
                  onChange={(e) => setEditedBackgroundColor(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{ input: { sx: { height: '36px' } } }}
                />
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => setEditedBackgroundColor('transparent')}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  Clear
                </Button>
              </Box>
            </Box>
          </Grid>
          
          {/* Opacity Slider with visual feedback */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>
              Opacity: {editedOpacity}%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">0%</Typography>
              <Slider
                value={editedOpacity}
                onChange={(e, newValue) => setEditedOpacity(newValue)}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                sx={{ flex: 1 }}
              />
              <Typography variant="caption" color="text.secondary">100%</Typography>
            </Box>
          </Grid>
          
          {/* Border Radius */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>Border Radius</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: `${editedBorder_radius}px`,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  bgcolor: 'primary.light',
                  opacity: 0.7,
                  transition: 'border-radius 0.2s'
                }}
              />
              <TextField
                type="number"
                value={editedBorder_radius}
                onChange={(e) => setEditedBorder_radius(parseInt(e.target.value) || 0)}
                fullWidth
                size="small"
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                  }
                }}
              />
            </Box>
          </Grid>
          
          {/* Rotation with visual indicator */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>Rotation</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 24, 
                  height: 24, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `rotate(${editedRotation}deg)`,
                  transition: 'transform 0.2s'
                }}
              >
                <ArrowBackIcon fontSize="small" sx={{ transform: 'rotate(135deg)' }} />
              </Box>
              <TextField
                type="number"
                value={editedRotation}
                onChange={(e) => setEditedRotation(parseInt(e.target.value) || 0)}
                fullWidth
                size="small"
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">°</InputAdornment>,
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        <span role="img" aria-label="layers" style={{ marginRight: '8px' }}>📚</span> Layer Position
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Z-Index with visual explanation */}
          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>Layer (Z-Index)</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                type="number"
                value={editedZIndex}
                onChange={(e) => setEditedZIndex(parseInt(e.target.value) || 1)}
                fullWidth
                size="small"
                helperText="Higher numbers appear on top of lower numbers"
              />
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                height: 60,
                mt: 1
              }}>
                {[1, 2, 3].map(idx => (
                  <Paper 
                    key={idx}
                    elevation={idx === editedZIndex ? 8 : 1}
                    sx={{ 
                      position: 'absolute', 
                      width: 40, 
                      height: 40,
                      left: `calc(50% - 20px + ${(idx - 2) * 20}px)`,
                      top: `calc(50% - 20px - ${(idx - 2) * 5}px)`,
                      zIndex: idx,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: idx === editedZIndex ? '2px solid' : '1px solid',
                      borderColor: idx === editedZIndex ? 'primary.main' : 'divider',
                      bgcolor: idx === editedZIndex ? 'primary.light' : 'background.paper',
                      opacity: idx === editedZIndex ? 1 : 0.7,
                      transition: 'all 0.2s'
                    }}
                  >
                    {idx}
                  </Paper>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
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
                  slotProps={{ input: { sx: { height: '40px' } } }}
                />
              </Grid>
              
              {/* Font Family */}
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Font Family</InputLabel>
                  <Select
                    value={editedFont_family}
                    onChange={(e) => setEditedFont_family(e.target.value)}
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
                  value={editedFont_size}
                  onChange={(e) => setEditedFont_size(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g., 16px, 1.2rem"
                />
              </Grid>
              
              {/* Font Weight */}
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Weight</InputLabel>
                  <Select
                    value={editedFont_weight}
                    onChange={(e) => setEditedFont_weight(e.target.value)}
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
                    value={editedText_align}
                    onChange={(e) => setEditedText_align(e.target.value)}
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
                  onChange={(e) => setEditedLine_height(e.target.value)}
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
              borderRadius: `${editedBorder_radius}px`,
              bgcolor: editedBackgroundColor,
              opacity: editedOpacity !== undefined ? editedOpacity / 100 : 1,
              transform: `rotate(${editedRotation}deg)`,
              transition: 'all 0.2s ease'
            }}>
              <Typography 
                variant="body1"
                sx={{ 
                  color: editedTextColor,
                  fontFamily: editedFont_family,
                  fontSize: editedFont_size,
                  fontWeight: editedFont_weight,
                  textAlign: editedText_align,
                  lineHeight: editedLine_height
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
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon color="action" />
                      </InputAdornment>
                    ),
                  }
                }}
              />
              
              <TextField
                label="Custom Title (Optional)"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                placeholder="Custom title for this link"
                helperText="Leave empty to use the website's title"
              />
              
              {/* OpenGraph Preview */}
              <Box sx={{ mt: 3, mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Preview
                </Typography>
                
                <Box sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: `${editedBorder_radius}px`,
                  overflow: 'hidden',
                  bgcolor: editedBackgroundColor || 'transparent',
                  opacity: editedOpacity !== undefined ? editedOpacity / 100 : 1,
                  transform: `rotate(${editedRotation}deg)`,
                  transition: 'all 0.2s ease'
                }}>
                  {editedContent ? (
                    <LinkPreview 
                      url={editedContent} 
                      onDataLoaded={(data) => {
                        // Auto-fill title if user hasn't entered one and this is the first load
                        if (!editedTitle && data?.title && data.title !== editedContent && currentItem.content === editedContent) {
                          setEditedTitle(data.title);
                        }
                      }}
                    />
                  ) : (
                    <Box sx={{ 
                      p: 3, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      bgcolor: '#f8f9fa'
                    }}>
                      <LinkIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" align="center">
                        Enter a URL above to see a preview
                      </Typography>
                    </Box>
                  )}
                </Box>
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
                <Paper 
                  elevation={2}
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    borderRadius: `${editedBorder_radius}px`,
                    bgcolor: editedBackgroundColor || 'transparent',
                    opacity: editedOpacity !== undefined ? editedOpacity / 100 : 1,
                    transform: `rotate(${editedRotation}deg)`,
                    transition: 'all 0.2s ease',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <img 
                    src={currentItem.content} 
                    alt={currentItem.title || "Image"} 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '200px',
                      objectFit: 'contain'
                    }} 
                  />
                </Paper>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  The image content cannot be edited directly. To change the image,
                  you'll need to delete this item and add a new one.
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 'pdf':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              PDF Properties
            </Typography>
            
            {currentItem?.content && (
              <Box sx={{ 
                mt: 2, 
                mb: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <Paper 
                  elevation={2}
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    borderRadius: `${editedBorder_radius}px`,
                    bgcolor: editedBackgroundColor || '#f8f9fa',
                    opacity: editedOpacity !== undefined ? editedOpacity / 100 : 1,
                    transform: `rotate(${editedRotation}deg)`,
                    transition: 'all 0.2s ease',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    height: 200,
                    width: '100%',
                    position: 'relative'
                  }}
                >
                  {currentItem.thumbnail ? (
                    <img 
                      src={currentItem.thumbnail} 
                      alt={currentItem.title || "PDF Preview"} 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '160px',
                        objectFit: 'contain'
                      }} 
                    />
                  ) : (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}>
                      <PdfIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.8, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" align="center">
                        PDF Document
                      </Typography>
                    </Box>
                  )}
                  
                  {/* PDF info footer */}
                  <Box sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <PdfIcon fontSize="small" color="primary" />
                    <Typography variant="caption" fontWeight="medium" noWrap>
                      {editedTitle || currentItem.title || 'PDF Document'}
                    </Typography>
                  </Box>
                </Paper>
                
                <Button
                  component="a"
                  href={currentItem.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  size="small"
                  sx={{ mt: 2 }}
                >
                  View PDF
                </Button>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  The PDF content cannot be edited directly. To change the PDF,
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
      open={open}
      onClose={onClose}
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

export default EditItemDialog;