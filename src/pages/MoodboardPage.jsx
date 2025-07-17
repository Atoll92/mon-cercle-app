// src/pages/MoodboardPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { supabase } from '../supabaseclient';
import LinkPreview from '../components/LinkPreview';
import MediaUpload from '../components/MediaUpload';
import MediaPlayer from '../components/MediaPlayer';
import MoodboardItem from '../components/Moodboard/MoodboardItem';
import MoodboardSettingsDialog from '../components/Moodboard/MoodboardSettingsDialog';
import { updateMoodboard } from '../api/moodboards';
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
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Enhanced EditItemDialog with improved UI and PDF support
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <span role="img" aria-label="title">📝</span>
                    </InputAdornment>
                  )
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
                    InputProps={{ sx: { height: '36px' } }}
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
                  InputProps={{
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
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
                  InputProps={{
                    endAdornment: <InputAdornment position="end">°</InputAdornment>,
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
                    InputProps={{ sx: { height: '40px' } }}
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

// Main Moodboard Component
function MoodboardPage() {
  const { moodboardId } = useParams();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
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
  
  // Refs for stable access in event handlers
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  
  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  
  // State for UI controls
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // State for item creation
  const [newImage, setNewImage] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newText, setNewText] = useState('');
  const [newTextColor, setNewTextColor] = useState('#000000');
  const [newTextBgColor, setNewTextBgColor] = useState('#ffffff');
  const [newLink, setNewLink] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newPdf, setNewPdf] = useState(null);
  const [newPdfUrl, setNewPdfUrl] = useState(''); 
  const [newPdfTitle, setNewPdfTitle] = useState('');
  const [newPdfThumbnail, setNewPdfThumbnail] = useState(null);
  
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
        
        // Check permissions - simplified for micro conclav
        // User can only edit their own moodboard
        let canEdit = false;
        if (user && activeProfile) {
          if (moodboardData.created_by === activeProfile.id) {
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
  }, [moodboardId, user, activeProfile]);
  
  // Add wheel event listener with passive: false for Chrome
  useEffect(() => {
    console.log('Setting up wheel listener, canvas ref:', canvasRef.current);
    
    // Use a timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      console.log('Canvas after timeout:', canvas);
      
      if (!canvas) {
        console.log('Canvas is still null after timeout');
        return;
      }

      const wheelHandler = (e) => {
        // Always prevent default to stop page scroll
        e.preventDefault();
        e.stopPropagation();
        
        // Debug logging
        console.log('Wheel event (native):', {
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaMode: e.deltaMode,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey
        });
        
        // Check if it's a pinch zoom gesture
        if (e.ctrlKey || e.metaKey) {
          // Pinch zoom (Ctrl/Cmd + scroll) - use refs for current values
          const currentScale = scaleRef.current;
          const currentPosition = positionRef.current;
          const zoomDelta = -e.deltaY * 0.01;
          const newScale = Math.min(Math.max(currentScale + zoomDelta, 0.3), 3);
          
          // Get mouse position relative to canvas
          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          // Calculate zoom towards cursor position
          const scaleRatio = newScale / currentScale;
          const newX = mouseX - (mouseX - currentPosition.x) * scaleRatio;
          const newY = mouseY - (mouseY - currentPosition.y) * scaleRatio;
          
          setScale(newScale);
          setPosition({ x: newX, y: newY });
        } else {
          // Two-finger scroll (trackpad pan)
          const deltaX = e.deltaX;
          const deltaY = e.deltaY;
          
          // Invert the scroll direction for more natural panning
          setPosition(prev => ({
            x: prev.x - deltaX,
            y: prev.y - deltaY
          }));
        }
      };

      console.log('Adding wheel event listener');
      // Add wheel event listener with passive: false to allow preventDefault
      canvas.addEventListener('wheel', wheelHandler, { passive: false });

      // Store cleanup function
      return () => {
        console.log('Cleanup: removing wheel event listener');
        canvas.removeEventListener('wheel', wheelHandler);
      };
    }, 200); // Longer delay

    return () => {
      clearTimeout(timer);
    };
  }, [moodboard]); // Depend on moodboard to ensure it runs after loading
  
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
        backgroundColor: '#ffffff',
        x: centerX - 150, // Center the item in view
        y: centerY - 100,
        width: 300,
        height: 200,
        zIndex: items.length + 1,
        created_by: activeProfile?.id || user.id
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
      
      // Check if we have an active profile
      if (!activeProfile) {
        throw new Error('No active profile selected. Please refresh the page.');
      }
      
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
        created_by: activeProfile.id
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
      setNewTextBgColor('#ffffff');
      setTextDialogOpen(false);
      
      setSuccess('Text added successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error adding text:', err);
      setError(err.message || 'Failed to add text');
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
        backgroundColor: '#ffffff',
        x: centerX - 100, // Center the item in view
        y: centerY - 60,
        width: 200,
        height: 120,
        zIndex: items.length + 1,
        created_by: activeProfile?.id || user.id
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
  
  const handleAddPdf = async () => {
    if (!newPdf) return;
    
    try {
      setSaving(true);
      
      // Upload PDF to storage
      const fileExt = newPdf.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `moodboards/${moodboardId}/pdfs/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('shared')
        .upload(filePath, newPdf, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL for the PDF
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
        type: 'pdf',
        content: publicUrl,
        title: newPdfTitle || newPdf.name.replace(/\.[^/.]+$/, ''), // Remove extension
        backgroundColor: '#ffffff',
        x: centerX - 150, // Center the item in view
        y: centerY - 100,
        width: 300,
        height: 300,
        zIndex: items.length + 1,
        created_by: activeProfile?.id || user.id
      };
      
      // If we have a thumbnail, add it to the item
      if (newPdfThumbnail) {
        newItem.thumbnail = newPdfThumbnail;
      }
      
      const { data: itemData, error: itemError } = await supabase
        .from('moodboard_items')
        .insert([newItem])
        .select();
      
      if (itemError) throw itemError;
      
      // Add to local state
      setItems(prev => [...prev, itemData[0]]);
      setSelectedItemId(itemData[0].id);
      
      // Reset form and close dialog
      setNewPdf(null);
      setNewPdfUrl('');
      setNewPdfTitle('');
      setNewPdfThumbnail(null);
      setPdfDialogOpen(false);
      
      setSuccess('PDF added successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error uploading PDF:', err);
      setError('Failed to upload PDF: ' + err.message);
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
// Updated handleUpdateItem function to match database schema exactly
const handleUpdateItem = async (updatedItem) => {
    if (!updatedItem) return;
    
    try {
      setSaving(true);
      
      // Create an object that only includes fields that are in the database
      const itemUpdate = {
        title: updatedItem.title,
        content: updatedItem.content,
        x: updatedItem.x,
        y: updatedItem.y,
        width: updatedItem.width,
        height: updatedItem.height,
        rotation: updatedItem.rotation,
        zIndex: updatedItem.zIndex,
        updated_at: new Date()
      };
      
      // Only add these properties if they exist in the updated item
      // (different item types have different properties)
      if (updatedItem.textColor !== undefined) itemUpdate.textColor = updatedItem.textColor;
      if (updatedItem.backgroundColor !== undefined) itemUpdate.backgroundColor = updatedItem.backgroundColor;
      if (updatedItem.font_family !== undefined) itemUpdate.font_family = updatedItem.font_family;
      if (updatedItem.font_size !== undefined) itemUpdate.font_size = updatedItem.font_size;
      if (updatedItem.font_weight !== undefined) itemUpdate.font_weight = updatedItem.font_weight;
      if (updatedItem.text_align !== undefined) itemUpdate.text_align = updatedItem.text_align;
      if (updatedItem.line_height !== undefined) itemUpdate.line_height = updatedItem.line_height;
      if (updatedItem.opacity !== undefined) itemUpdate.opacity = updatedItem.opacity;
      if (updatedItem.border_radius !== undefined) itemUpdate.border_radius = updatedItem.border_radius;
      
      console.log('Updating item with data:', itemUpdate);
      
      // Update in database
      const { data, error } = await supabase
        .from('moodboard_items')
        .update(itemUpdate)
        .eq('id', updatedItem.id)
        .select();
      
      if (error) throw error;
      
      console.log('Update successful:', data);
      
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
      setError('Failed to update item: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };
  
  // Handle moodboard settings update
  const handleSaveMoodboardSettings = async (updates) => {
    try {
      setSaving(true);
      
      const updatedMoodboard = await updateMoodboard(moodboardId, updates);
      
      // Update local state
      setMoodboard(prev => ({
        ...prev,
        ...updatedMoodboard
      }));
      
      setSettingsDialogOpen(false);
      setSuccess('Moodboard settings updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error updating moodboard settings:', err);
      setError('Failed to update moodboard settings: ' + (err.message || 'Unknown error'));
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
    
    // Check file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
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
            onClick={() => navigate('/dashboard/')}
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
              
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setSettingsDialogOpen(true)}
                size="small"
              >
                Settings
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
      
      <Box
  ref={canvasRef}
  sx={{ 
    flexGrow: 1, 
    position: 'relative', 
    overflow: 'hidden',
    bgcolor: moodboard.background_color || '#f5f5f5', // Use background_color from database
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
    {/* Background grid - Only show if no background_color is set */}
    {!moodboard.background_color && (
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
    )}
    
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
          <ImageIcon sx={{ mr: 1 }} /> Add Media
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
        <MenuItem 
          onClick={() => {
            handleAddMenuClose();
            setPdfDialogOpen(true);
          }}
        >
          <PdfIcon sx={{ mr: 1 }} /> Add PDF
        </MenuItem>
      </Menu>
      
      {/* Upload Media Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Media</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, mb: 2 }}>
            <MediaUpload
              onUpload={async (mediaData) => {
                // Handle the uploaded media
                const newItem = {
                  // Don't include id - let Supabase generate it
                  type: mediaData.mediaType.toLowerCase(),
                  content: mediaData.url,
                  backgroundColor: '#ffffff',
                  x: 50,
                  y: 50,
                  width: mediaData.mediaType === 'AUDIO' ? 300 : 400,
                  height: mediaData.mediaType === 'AUDIO' ? 80 : 300,
                  zIndex: items.length + 1,
                  metadata: {
                    fileName: mediaData.fileName,
                    fileSize: mediaData.fileSize,
                    mimeType: mediaData.mimeType
                  }
                };
                
                try {
                  const { data, error } = await supabase
                    .from('moodboard_items')
                    .insert([{
                      ...newItem,
                      moodboard_id: moodboardId,
                      created_by: activeProfile?.id || user.id
                    }])
                    .select()
                    .single();
                    
                  if (error) throw error;
                  
                  setItems([...items, data]);
                  setUploadDialogOpen(false);
                } catch (error) {
                  console.error('Error adding media:', error);
                  setError('Failed to add media to moodboard');
                }
              }}
              allowedTypes={['IMAGE', 'VIDEO', 'AUDIO']}
              bucket="shared"
              path={`moodboards/${moodboardId}`}
              maxFiles={1}
              showPreview={true}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
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
              onChange={(e) => setNewTextBgColor(e.target.value)}
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

      {/* Add PDF Dialog */}
      <Dialog 
        open={pdfDialogOpen} 
        onClose={() => setPdfDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add PDF Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, mb: 2 }}>
            <input
              accept="application/pdf"
              style={{ display: 'none' }}
              id="upload-pdf-button"
              type="file"
              onChange={(e) => {
                if (!e.target.files || e.target.files.length === 0) {
                  return;
                }
                
                const file = e.target.files[0];
                
                // Check file size (20MB max)
                if (file.size > 20 * 1024 * 1024) {
                  setError('PDF file size must be less than 20MB');
                  return;
                }
                
                setNewPdf(file);
                setNewPdfUrl(URL.createObjectURL(file));
                
                // Auto-set the title based on filename
                if (!newPdfTitle) {
                  const fileName = file.name.replace(/\.[^/.]+$/, '');
                  setNewPdfTitle(fileName);
                }
              }}
            />
            <label htmlFor="upload-pdf-button">
              <Button
                variant="outlined"
                component="span"
                startIcon={<PdfIcon />}
                fullWidth
                sx={{ py: 5, border: '1px dashed' }}
              >
                {newPdfUrl ? 'Change PDF Document' : 'Select a PDF to upload'}
              </Button>
            </label>
            
            {newPdfUrl && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: '#f8f9fa',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <PdfIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="body1" gutterBottom noWrap sx={{ maxWidth: '100%' }}>
                  {newPdf?.name || 'Selected PDF'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {newPdf ? `${(newPdf.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                </Typography>
              </Box>
            )}
            
            <TextField
              label="PDF Title (Optional)"
              value={newPdfTitle}
              onChange={(e) => setNewPdfTitle(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              placeholder="Enter a title for this PDF"
              helperText="If left empty, the filename will be used"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdfDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPdf} 
            variant="contained" 
            disabled={!newPdf || saving}
            startIcon={saving ? <CircularProgress size={20} /> : <PdfIcon />}
          >
            {saving ? 'Uploading...' : 'Add PDF'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Moodboard Settings Dialog */}
      <MoodboardSettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        moodboard={moodboard}
        onSave={handleSaveMoodboardSettings}
        processing={saving}
      />
    </Box>
  );
}

export default MoodboardPage;