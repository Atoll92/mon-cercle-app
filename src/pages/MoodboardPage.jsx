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
import MoodboardCanvas from '../components/Moodboard/MoodboardCanvas';
import MoodboardSettingsDialog from '../components/Moodboard/MoodboardSettingsDialog';
import MoodboardItemPanel from '../components/Moodboard/MoodboardItemPanel';
import { updateMoodboard } from '../api/moodboards';
import { useMoodboardCanvas } from '../hooks/useMoodboardCanvas';
import Spinner from '../components/Spinner';
import UserContent from '../components/UserContent';
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
  Alert,
  Menu,
  MenuItem,
  Fade,
  Container,
  alpha,
  useTheme,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Image as ImageIcon,
  TextFields as TextFieldsIcon,
  Link as LinkIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Share as ShareIcon,
  PictureAsPdf as PdfIcon,
  Settings as SettingsIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';


// Main Moodboard Component
function MoodboardPage() {
  const { moodboardId } = useParams();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State for moodboard data
  const [moodboard, setMoodboard] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const originalItemsRef = useRef([]);
  
  // Use moodboard canvas hook for viewport control
  const {
    scale,
    position,
    isDraggingCanvas,
    canvasRef,
    handleCanvasMouseDown: hookHandleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset
  } = useMoodboardCanvas({
    items, // Pass items for boundary calculations
    boundaryPaddingRatio: 1 // 100% of viewport for more generous boundaries
  });
  
  // State for UI controls
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  // Side panel state
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
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
        const loadedItems = itemsData || [];
        setItems(loadedItems);
        // Store original items for comparison
        originalItemsRef.current = JSON.parse(JSON.stringify(loadedItems));
        
      } catch (err) {
        console.error('Error fetching moodboard:', err);
        setError('Failed to load moodboard data. It may not exist or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMoodboard();
  }, [moodboardId, user, activeProfile]);
  
  // Add wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add wheel event listener with passive: false to allow preventDefault
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);
  
  // Wrapper for canvas mouse down to pass selectedItemId
  const handleCanvasMouseDown = (e) => {
    hookHandleCanvasMouseDown(e, selectedItemId);
  };
  
  // Handle item selection and deselection
  const handleSelectItem = (itemId) => {
    setSelectedItemId(itemId);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setSidePanelOpen(true);
    }
  };
  
  const handleCanvasClick = () => {
    setSelectedItemId(null);
    setSidePanelOpen(false);
    setSelectedItem(null);
  };
  
  // Debounced autosave function
  const performAutoSave = useCallback(async (itemsToSave) => {
    if (!isEditable) return;
    
    try {
      setAutoSaveStatus('saving');
      
      // Save all items that have changed
      for (const item of itemsToSave) {
        const { error } = await supabase
          .from('moodboard_items')
          .update({
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            zIndex: item.zIndex || itemsToSave.indexOf(item) + 1,
            rotation: item.rotation,
            opacity: item.opacity,
            border_radius: item.border_radius,
            backgroundColor: item.backgroundColor,
            textColor: item.textColor,
            font_family: item.font_family,
            font_size: item.font_size,
            font_weight: item.font_weight,
            text_align: item.text_align,
            line_height: item.line_height,
            title: item.title,
            content: item.content,
            updated_at: new Date()
          })
          .eq('id', item.id);
        
        if (error) throw error;
      }
      
      setAutoSaveStatus('saved');
      setHasUnsavedChanges(false);
      // Update original items reference
      originalItemsRef.current = JSON.parse(JSON.stringify(itemsToSave));
      
    } catch (err) {
      console.error('Auto-save error:', err);
      setAutoSaveStatus('error');
      setError('Failed to auto-save changes');
    }
  }, [isEditable]);

  // Trigger autosave when items change
  useEffect(() => {
    if (!items.length || loading || !isEditable) return;
    
    // Skip if we haven't loaded initial items yet
    if (!originalItemsRef.current || originalItemsRef.current.length === 0) {
      return;
    }
    
    // Check if items have actually changed
    const hasChanges = JSON.stringify(items) !== JSON.stringify(originalItemsRef.current);
    
    if (hasChanges) {
      setHasUnsavedChanges(true);
      setAutoSaveStatus('saving');
      
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set new timeout for autosave (1.5 seconds delay)
      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave(items);
      }, 1500);
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [items, loading, isEditable, performAutoSave]);

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

  // Cancel edit and revert to original state
  const handleCancelEdit = () => {
    if (hasUnsavedChanges && window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      setItems(JSON.parse(JSON.stringify(originalItemsRef.current)));
      setHasUnsavedChanges(false);
      setAutoSaveStatus('saved');
      setError(null);
    }
  };
  
  const handleEditItem = (item) => {
    // No longer needed - editing happens in side panel
  };
  
  const handleDeleteItem = useCallback(async (itemId) => {
    try {
      const { error } = await supabase
        .from('moodboard_items')
        .delete()
        .eq('id', itemId);
        
      if (error) throw error;
      
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      setSelectedItemId(null);
      setSidePanelOpen(false);
      setSelectedItem(null);
      
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  }, []);
  
  // Add keyboard event listener for delete
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if backspace key is pressed and an item is selected
      if (e.key === 'Backspace' && selectedItemId && isEditable) {
        // Prevent default browser back navigation
        e.preventDefault();
        
        // Don't delete if user is typing in an input field
        const activeElement = document.activeElement;
        const isInputField = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true'
        );
        
        if (!isInputField) {
          if (window.confirm('Are you sure you want to delete this item?')) {
            handleDeleteItem(selectedItemId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItemId, isEditable, handleDeleteItem]);
  
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
      
      // First, load the image to get its dimensions
      const img = new Image();
      const imageUrl = URL.createObjectURL(newImage);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      // Calculate the aspect ratio and appropriate size
      const aspectRatio = img.width / img.height;
      const maxWidth = 400;
      const maxHeight = 400;
      
      let itemWidth, itemHeight;
      
      if (aspectRatio > 1) {
        // Landscape image
        itemWidth = Math.min(img.width, maxWidth);
        itemHeight = itemWidth / aspectRatio;
      } else {
        // Portrait or square image
        itemHeight = Math.min(img.height, maxHeight);
        itemWidth = itemHeight * aspectRatio;
      }
      
      // Clean up the object URL
      URL.revokeObjectURL(imageUrl);
      
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
      
      // Create new item with calculated dimensions
      const newItem = {
        moodboard_id: moodboardId,
        type: 'image',
        content: publicUrl,
        backgroundColor: 'transparent', // Start with transparent background for images
        x: centerX - itemWidth / 2, // Center the item in view
        y: centerY - itemHeight / 2,
        width: itemWidth,
        height: itemHeight,
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
      
      // Don't show success message with autosave
      
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
      
      // Calculate text dimensions by creating a temporary element
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.padding = '16px'; // Match the padding in the text item (p: 2 = 16px)
      tempDiv.style.fontSize = '1rem'; // Default font size
      tempDiv.style.lineHeight = 'normal';
      tempDiv.style.fontFamily = 'inherit';
      tempDiv.style.whiteSpace = 'pre-wrap';
      tempDiv.style.wordBreak = 'break-word';
      tempDiv.style.overflowWrap = 'break-word';
      
      // Set a reasonable max width for measurement
      const maxWidth = 400;
      const minWidth = 200;
      const minHeight = 100;
      const maxHeight = 600;
      
      tempDiv.style.width = `${maxWidth}px`;
      tempDiv.innerText = newText;
      
      document.body.appendChild(tempDiv);
      
      // Measure the actual content height
      const contentHeight = tempDiv.scrollHeight;
      
      // Try to find optimal width by testing different widths
      let optimalWidth = maxWidth;
      let optimalHeight = contentHeight;
      
      // If content is short, try smaller widths
      if (contentHeight < 150) {
        for (let testWidth = minWidth; testWidth <= maxWidth; testWidth += 50) {
          tempDiv.style.width = `${testWidth}px`;
          const testHeight = tempDiv.scrollHeight;
          
          // Find a good aspect ratio (not too wide, not too tall)
          const aspectRatio = testWidth / testHeight;
          if (aspectRatio >= 1 && aspectRatio <= 3 && testHeight <= maxHeight) {
            optimalWidth = testWidth;
            optimalHeight = testHeight;
            if (testHeight >= minHeight) break; // Good enough
          }
        }
      }
      
      // Clean up
      document.body.removeChild(tempDiv);
      
      // Ensure minimum and maximum bounds
      const itemWidth = Math.max(minWidth, Math.min(maxWidth, optimalWidth));
      const itemHeight = Math.max(minHeight, Math.min(maxHeight, optimalHeight));
      
      // Calculate position based on current view
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const centerX = (canvasRect.width / 2 - position.x) / scale;
      const centerY = (canvasRect.height / 2 - position.y) / scale;
      
      // Create new item with calculated dimensions
      const newItem = {
        moodboard_id: moodboardId,
        type: 'text',
        content: newText,
        textColor: newTextColor,
        backgroundColor: newTextBgColor,
        x: centerX - itemWidth / 2, // Center the item in view
        y: centerY - itemHeight / 2,
        width: itemWidth,
        height: itemHeight,
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
      
      // Don't show success message with autosave
      
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
      
      // Don't show success message with autosave
      
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
      
      // Don't show success message with autosave
      
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
      
      // Don't show success message with autosave
      
    } catch (err) {
      console.error('Error saving moodboard:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };
  
  // Improved updateItem method
    // Handle item updates from side panel
  const handleUpdateItem = async (updatedItem) => {
    if (!updatedItem) return;
    
    // Update the item in state - autosave will handle the database update
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    );
    
    // Update selected item to reflect changes
    setSelectedItem(updatedItem);
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
      // Settings updated - autosave will handle it
      
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
          height: '100vh',
          paddingTop: 0
        }}
      >
        <Spinner size={120} color="primary" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading moodboard...
        </Typography>
      </Box>
    );
  }
  
  if (error && !moodboard) {
    return (
      <Container maxWidth="md" sx={{ 
        paddingTop: 0,
        mt: 0 
      }}>
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
      <Container maxWidth="md" sx={{ 
        paddingTop: 0,
        mt: 0 
      }}>
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
          position: 'sticky',
          top: 0,
          zIndex: 1200,
          display: 'flex', 
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
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
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
              
              {/* Auto-save status indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
                {autoSaveStatus === 'saving' && (
                  <>
                    <Spinner size={32} />
                    <Typography variant="caption" color="text.secondary">
                      Saving...
                    </Typography>
                  </>
                )}
                {autoSaveStatus === 'saved' && !hasUnsavedChanges && (
                  <>
                    <CloudDoneIcon fontSize="small" color="success" />
                    <Typography variant="caption" color="success.main">
                      All changes saved
                    </Typography>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <CloudOffIcon fontSize="small" color="error" />
                    <Typography variant="caption" color="error">
                      Save failed
                    </Typography>
                  </>
                )}
              </Box>
              
              {hasUnsavedChanges && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  size="small"
                >
                  Cancel Edit
                </Button>
              )}
              
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
              position: 'fixed', 
              top: '70px', // Below sticky toolbar
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
      
      {/* Success alert no longer needed with autosave
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
      */}
      
      {/* Permission indicator */}
      <Box
        sx={{ 
          position: 'fixed',
          top: 'calc(80px + 56px + 1rem)', // Account for NetworkHeader + fixed toolbar
          left: '1rem',
          zIndex: 1001,
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
      
      <MoodboardCanvas
        backgroundColor={moodboard.background_color || '#f5f5f5'}
        scale={scale}
        position={position}
        isDraggingCanvas={isDraggingCanvas}
        canvasRef={canvasRef}
        onCanvasClick={handleCanvasClick}
        onCanvasMouseDown={handleCanvasMouseDown}
        onCanvasMouseMove={handleCanvasMouseMove}
        onCanvasMouseUp={handleCanvasMouseUp}
        onCanvasMouseLeave={handleCanvasMouseUp}
        showGrid={!moodboard.background_color}
        height="100%" // Fill available space
      >
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
      </MoodboardCanvas>

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
                // Calculate position based on current view
                const canvasRect = canvasRef.current.getBoundingClientRect();
                const centerX = (canvasRect.width / 2 - position.x) / scale;
                const centerY = (canvasRect.height / 2 - position.y) / scale;
                
                let itemWidth = 400;
                let itemHeight = 300;
                
                // For images, load them to get aspect ratio
                if (mediaData.mediaType === 'IMAGE') {
                  try {
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                      img.onload = resolve;
                      img.onerror = () => resolve(); // Continue even if loading fails
                      img.src = mediaData.url;
                    });
                    
                    if (img.width && img.height) {
                      const aspectRatio = img.width / img.height;
                      const maxWidth = 400;
                      const maxHeight = 400;
                      
                      if (aspectRatio > 1) {
                        // Landscape
                        itemWidth = Math.min(img.width, maxWidth);
                        itemHeight = itemWidth / aspectRatio;
                      } else {
                        // Portrait or square
                        itemHeight = Math.min(img.height, maxHeight);
                        itemWidth = itemHeight * aspectRatio;
                      }
                    }
                  } catch (err) {
                    console.warn('Could not load image dimensions:', err);
                    // Use default dimensions if loading fails
                  }
                } else if (mediaData.mediaType === 'AUDIO') {
                  itemWidth = 300;
                  itemHeight = 80;
                } else if (mediaData.mediaType === 'VIDEO') {
                  // Videos typically have 16:9 aspect ratio
                  itemWidth = 400;
                  itemHeight = 225;
                }
                
                // Handle the uploaded media
                const newItem = {
                  // Don't include id - let Supabase generate it
                  type: mediaData.mediaType.toLowerCase(),
                  content: mediaData.url,
                  backgroundColor: mediaData.mediaType === 'IMAGE' ? 'transparent' : '#ffffff',
                  x: centerX - itemWidth / 2,
                  y: centerY - itemHeight / 2,
                  width: itemWidth,
                  height: itemHeight,
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
            overflow: 'hidden' // No scrollbars
          }}>
            <UserContent
              content={newText || 'Preview of your text will appear here'}
              html={false}
              component="div"
              sx={{
                color: newTextColor,
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTextDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddText} 
            variant="contained" 
            disabled={!newText.trim() || saving}
            startIcon={saving ? <Spinner size={40} /> : <TextFieldsIcon />}
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
            startIcon={saving ? <Spinner size={40} /> : <LinkIcon />}
          >
            {saving ? 'Adding...' : 'Add Link'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Side Panel for editing selected item */}
      <MoodboardItemPanel
        open={sidePanelOpen}
        item={selectedItem}
        moodboardId={moodboardId}
        onClose={() => {
          setSidePanelOpen(false);
          setSelectedItemId(null);
          setSelectedItem(null);
        }}
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteItem}
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
            startIcon={saving ? <Spinner size={40} /> : <PdfIcon />}
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