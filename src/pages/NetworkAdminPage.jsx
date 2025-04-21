import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import NetworkLogoHeader from '../components/NetworkLogoHeader';
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  CardActions,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tabs,
  Tab,
  Slider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  AdminPanelSettings as AdminIcon,
  PersonRemove as PersonRemoveIcon,
  Event as EventIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Palette as PaletteIcon,
  Check as CheckIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HelpOutline as MaybeIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import ArticleIcon from '@mui/icons-material/Article';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function EventParticipationStats({ eventId }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attending: 0,
    maybe: 0,
    declined: 0,
    total: 0
  });

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true);
      try {
        // Fetch event participations with user profiles
        const { data, error } = await supabase
          .from('event_participations')
          .select(`
            status,
            profiles:profile_id (
              id,
              full_name,
              profile_picture_url,
              contact_email
            )
          `)
          .eq('event_id', eventId);
          
        if (error) throw error;
        
        // Calculate stats
        const newStats = {
          attending: 0,
          maybe: 0,
          declined: 0,
          total: data ? data.length : 0
        };
        
        if (data) {
          data.forEach(participant => {
            if (participant.status) {
              newStats[participant.status]++;
            }
          });
          
          setParticipants(data);
          setStats(newStats);
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      fetchParticipants();
    }
  }, [eventId]);

  if (loading) {
    return <CircularProgress size={20} />;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Participation Stats:
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip 
          icon={<CheckCircleIcon fontSize="small" />}
          label={`${stats.attending} attending`}
          color="success"
          size="small"
          variant="outlined"
        />
        <Chip 
          icon={<MaybeIcon fontSize="small" />}
          label={`${stats.maybe} maybe`}
          color="warning"
          size="small"
          variant="outlined"
        />
        <Chip 
          icon={<CancelIcon fontSize="small" />}
          label={`${stats.declined} declined`}
          color="error"
          size="small"
          variant="outlined"
        />
        <Chip 
          icon={<PeopleIcon fontSize="small" />}
          label={`${stats.total} responses`}
          size="small"
        />
      </Box>
      
      {stats.total > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Participants:
          </Typography>
          <Box sx={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
            {participants.map(participant => (
              <Box 
                key={participant.profiles.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  pb: 1,
                  borderBottom: '1px solid #f0f0f0',
                  '&:last-child': {
                    mb: 0,
                    pb: 0,
                    borderBottom: 'none'
                  }
                }}
              >
                <Avatar 
                  src={participant.profiles.profile_picture_url} 
                  sx={{ width: 30, height: 30, mr: 1 }}
                >
                  {participant.profiles.full_name ? participant.profiles.full_name.charAt(0).toUpperCase() : '?'}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {participant.profiles.full_name || 'Unnamed User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {participant.profiles.contact_email}
                  </Typography>
                </Box>
                <Chip 
                  size="small"
                  label={participant.status}
                  color={
                    participant.status === 'attending' ? 'success' :
                    participant.status === 'maybe' ? 'warning' : 'error'
                  }
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function NetworkAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [profile, setProfile] = useState(null);
  const [network, setNetwork] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [dialogMember, setDialogMember] = useState(null);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [eventDialogMode, setEventDialogMode] = useState('create');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    capacity: ''
  });
  const [eventImageFile, setEventImageFile] = useState(null);
const [eventImagePreview, setEventImagePreview] = useState(null);
const [uploadingEventImage, setUploadingEventImage] = useState(false);
  const [newsPosts, setNewsPosts] = useState([]);
  const [newsTitle, setNewsTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');

  // Theme state
  const [themeSettings, setThemeSettings] = useState({
    backgroundColor: '#ffffff',
    customizing: false
  });
  
  // Logo state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Color presets for theme selection
  const colorPresets = [
    { name: 'White', value: '#ffffff' },
    { name: 'Light Blue', value: '#f0f8ff' },
    { name: 'Light Green', value: '#f0fff0' },
    { name: 'Light Pink', value: '#fff0f5' },
    { name: 'Light Yellow', value: '#fffacd' },
    { name: 'Light Gray', value: '#f5f5f5' }
  ];

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your news post...</p>',
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML())
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get admin's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        setProfile(profileData);
        
        if (profileData.role !== 'admin') {
          setError('You do not have admin privileges.');
          return;
        }
        
        if (!profileData.network_id) {
          setError('You are not part of any network.');
          return;
        }
        
        // Get network info
        const { data: networkData, error: networkError } = await supabase
          .from('networks')
          .select('*')
          .eq('id', profileData.network_id)
          .single();
          
        if (networkError) throw networkError;
        setNetwork(networkData);
        setNetworkName(networkData.name);
        
        // Set theme settings if available
        if (networkData.theme_bg_color) {
          setThemeSettings({
            ...themeSettings,
            backgroundColor: networkData.theme_bg_color
          });
        }
        
        // Set logo preview if available
        if (networkData.logo_url) {
          setLogoPreview(networkData.logo_url);
        }
        
        // Get members
        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('network_id', profileData.network_id)
          .order('full_name', { ascending: true });
          
        if (membersError) throw membersError;
        setMembers(membersData || []);

        const { data: newsData, error: newsError } = await supabase
          .from('network_news')
          .select('*')
          .eq('network_id', profileData.network_id)
          .order('created_at', { ascending: false });

        if (newsError) console.error('News error:', newsError);
        setNewsPosts(newsData || []);

        // Get events
        const { data: eventsData, error: eventsError } = await supabase
          .from('network_events')
          .select('*')
          .eq('network_id', profileData.network_id)
          .order('date', { ascending: true });
          
        if (eventsError) throw eventsError;
        setEvents(eventsData || []);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load network information.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Member management functions
  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }
    
    try {
      setInviting(true);
      setError(null);
      setMessage('');
      
      // Check if user already exists
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, network_id, contact_email, full_name')
        .eq('contact_email', inviteEmail)
        .maybeSingle();
          
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      if (existingUser) {
        if (existingUser.network_id === network.id) {
          setMessage('This user is already in your network.');
          return;
        }
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ network_id: network.id })
          .eq('id', existingUser.id);
            
        if (updateError) throw updateError;

        try {
          await supabase.functions.invoke('network-invite', {
            body: {
              toEmail: existingUser.contact_email,
              networkName: network.name,
              inviterName: profile.full_name || 'Network Admin',
              type: 'existing_user'
            }
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
        
        setMessage(`User ${inviteEmail} added to your network! Email notification sent.`);
        const { data: updatedMembers } = await supabase
          .from('profiles')
          .select('*')
          .eq('network_id', network.id)
          .order('full_name', { ascending: true });
        setMembers(updatedMembers || []);
      } else {
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .insert([{ 
            email: inviteEmail, 
            network_id: network.id, 
            invited_by: user.id,
            status: 'pending',
            role: 'member'
          }])
          .select()
          .single();
            
        if (inviteError) throw inviteError;
        
        const inviteToken = btoa(`invite:${invitation.id}:${network.id}`);
        const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mon-cercle-app.vercel.app' 
        : window.location.origin;
      const inviteLink = `${baseUrl}/signup?invite=${inviteToken}`;        
        try {
          await supabase.functions.invoke('network-invite', {
            body: {
              toEmail: inviteEmail,
              networkName: network.name,
              inviterName: profile.full_name || 'Network Admin',
              inviteLink: inviteLink,
              type: 'new_user'
            }
          });
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError);
          throw new Error('Failed to send invitation email. Please try again.');
        }
        
        setMessage(`Invitation sent to ${inviteEmail}!`);
      }
      
      setInviteEmail('');
      
    } catch (error) {
      console.error('Error inviting user:', error);
      setError(error.message || 'Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateNetwork = async (e) => {
    e.preventDefault();
    
    if (!networkName.trim()) {
      setMessage('Network name cannot be empty.');
      return;
    }
    
    try {
      setUpdating(true);
      setError(null);
      setMessage('');
      
      const { error } = await supabase
        .from('networks')
        .update({ name: networkName })
        .eq('id', network.id);
        
      if (error) throw error;
      
      setNetwork({ ...network, name: networkName });
      setMessage('Network updated successfully!');
      
    } catch (error) {
      console.error('Error updating network:', error);
      setError('Failed to update network. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Save theme settings
  const handleSaveTheme = async () => {
    try {
      setUpdating(true);
      setError(null);
      setMessage('');

      const { error } = await supabase
        .from('networks')
        .update({ theme_bg_color: themeSettings.backgroundColor })
        .eq('id', network.id);

      if (error) throw error;

      setNetwork({
        ...network,
        theme_bg_color: themeSettings.backgroundColor
      });

      setMessage('Theme settings updated successfully!');
      setThemeSettings({
        ...themeSettings,
        customizing: false
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      setError('Failed to update theme settings. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Handle logo file selection
  const handleLogoChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      setLogoFile(null);
      return;
    }
    
    const file = event.target.files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF).');
      return;
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file must be less than 5MB.');
      return;
    }
    
    setLogoFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Upload and save logo
  const handleSaveLogo = async () => {
    if (!logoFile) {
      setError('Please select a logo image first.');
      return;
    }
    
    try {
      setUploadingLogo(true);
      setError(null);
      setMessage('');
      
      // Create a unique file path in the 'networks' bucket
      const filePath = `${network.id}/${Date.now()}-${logoFile.name}`;
      
      // Upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from('networks')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('networks')
        .getPublicUrl(filePath);
      
      // Update the network record with the logo URL
      const { error: updateError } = await supabase
        .from('networks')
        .update({ logo_url: publicUrl })
        .eq('id', network.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setNetwork({
        ...network,
        logo_url: publicUrl
      });
      
      setMessage('Network logo updated successfully!');
      setLogoFile(null);
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError('Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };
  
  // Remove logo
  const handleRemoveLogo = async () => {
    if (!network.logo_url) return;
    
    try {
      setUploadingLogo(true);
      setError(null);
      setMessage('');
      
      // Extract the file path from the URL
      const urlParts = network.logo_url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('networks') + 1).join('/');
      
      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('networks')
        .remove([filePath]);
      
      // Don't throw an error if the file doesn't exist (it might have been deleted already)
      if (deleteError && deleteError.message !== 'The resource was not found') {
        console.warn('Error deleting logo file:', deleteError);
      }
      
      // Update the network record to remove the logo URL
      const { error: updateError } = await supabase
        .from('networks')
        .update({ logo_url: null })
        .eq('id', network.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setNetwork({
        ...network,
        logo_url: null
      });
      
      setLogoPreview(null);
      setMessage('Network logo removed successfully!');
      
    } catch (error) {
      console.error('Error removing logo:', error);
      setError('Failed to remove logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Member management dialog functions
  const confirmAction = (action, member) => {
    setDialogAction(action);
    setDialogMember(member);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setDialogAction(null);
    setDialogMember(null);
  };

  const handleConfirmedAction = async () => {
    setOpenDialog(false);
    
    if (dialogAction === 'remove') {
      await handleRemoveMember(dialogMember.id);
    } else if (dialogAction === 'toggleAdmin') {
      await handleToggleAdmin(dialogMember.id, dialogMember.role);
    }
    
    setDialogAction(null);
    setDialogMember(null);
  };

  const handleRemoveMember = async (memberId) => {
    if (memberId === user.id) {
      setError('You cannot remove yourself from the network.');
      return;
    }
    
    try {
      setError(null);
      setMessage('');
      
      const { error } = await supabase
        .from('profiles')
        .update({ network_id: null })
        .eq('id', memberId);
        
      if (error) throw error;
      
      setMembers(members.filter(member => member.id !== memberId));
      setMessage('Member removed from network.');
      
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member. Please try again.');
    }
  };

  const exportParticipantsList = async (eventId) => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('network_events')
        .select('*')
        .eq('id', eventId)
        .single();
        
      if (eventError) throw eventError;
      
      // Fetch participants
      const { data: participants, error: participantsError } = await supabase
        .from('event_participations')
        .select(`
          status,
          profiles:profile_id (
            id,
            full_name,
            contact_email,
            role
          )
        `)
        .eq('event_id', eventId);
        
      if (participantsError) throw participantsError;
      
      // Convert to CSV format
      let csvContent = "Name,Email,Status,Role\n";
      
      participants.forEach(participant => {
        const profile = participant.profiles;
        csvContent += `"${profile.full_name || 'Unnamed User'}","${profile.contact_email}","${participant.status}","${profile.role || 'member'}"\n`;
      });
      
      // Create downloadable link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `participants-${eventData.title.replace(/\s+/g, '-')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage('Participants list exported successfully!');
    } catch (error) {
      console.error('Error exporting participants:', error);
      setError('Failed to export participants list');
    }
  };

  const handleToggleAdmin = async (memberId, currentRole) => {
    if (memberId === user.id) {
      setError('You cannot change your own admin status.');
      return;
    }
    
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    
    try {
      setError(null);
      setMessage('');
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId);
        
      if (error) throw error;
      
      setMembers(members.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole } 
          : member
      ));
      
      setMessage(`User ${newRole === 'admin' ? 'promoted to admin' : 'changed to regular member'}.`);
      
    } catch (error) {
      console.error('Error updating member role:', error);
      setError('Failed to update member role. Please try again.');
    }
  };

  const handleNewsSubmit = async () => {
    if (!newsTitle.trim() || !editorContent) {
      setError('Please fill in both title and content');
      return;
    }
  
    try {
      setUpdating(true);
      
      const { data, error } = await supabase
        .from('network_news')
        .insert([{
          title: newsTitle,
          content: editorContent,
          network_id: network.id,
          created_by: user.id
        }])
        .select();
  
      if (error) throw error;
      
      setNewsPosts([data[0], ...newsPosts]);
      setNewsTitle('');
      editor.commands.clearContent();
      setMessage('News post published successfully!');
  
    } catch (error) {
      console.error('News error:', error);
      setError('Failed to publish news post');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleDeleteNews = async (postId) => {
    try {
      const { error } = await supabase
        .from('network_news')
        .delete()
        .eq('id', postId);
  
      if (error) throw error;
      
      setNewsPosts(newsPosts.filter(post => post.id !== postId));
      setMessage('News post deleted successfully');
  
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete news post');
    }
  };

  // Event management functions
  const handleOpenEventDialog = (mode, event = null) => {
    setEventDialogMode(mode);
    setSelectedEvent(event);
    setEventImageFile(null);
    
    if (mode === 'edit' && event) {
      setEventForm({
        title: event.title,
        date: event.date.split('T')[0],
        location: event.location,
        description: event.description || '',
        capacity: event.capacity || ''
      });
      
      // Set image preview if the event has one
      if (event.cover_image_url) {
        setEventImagePreview(event.cover_image_url);
      } else {
        setEventImagePreview(null);
      }
    } else {
      setEventForm({
        title: '',
        date: '',
        location: '',
        description: '',
        capacity: ''
      });
      setEventImagePreview(null);
    }
    
    setOpenEventDialog(true);
  };

  const handleEventSubmit = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.location) {
      setError('Please fill in all required fields (Title, Date, Location)');
      return;
    }
  
    try {
      setUpdating(true);
      
      // Prepare event data
      const eventData = {
        title: eventForm.title,
        date: new Date(eventForm.date).toISOString(),
        location: eventForm.location,
        description: eventForm.description,
        capacity: eventForm.capacity || null,
        network_id: network.id,
        created_by: user.id
      };
  
      // Add image if available (for edit mode)
      if (selectedEvent?.cover_image_url && !eventImageFile) {
        eventData.cover_image_url = selectedEvent.cover_image_url;
      }
  
      if (eventDialogMode === 'create') {
        // First create the event to get the ID
        const { data, error } = await supabase
          .from('network_events')
          .insert([eventData])
          .select();
          
        if (error) throw error;
        
        // If we have an image, upload it and update the event
        if (eventImageFile) {
          try {
            const imageUrl = await uploadEventImage(data[0].id);
            
            // Update the event with the image URL
            const { error: updateError } = await supabase
              .from('network_events')
              .update({ cover_image_url: imageUrl })
              .eq('id', data[0].id);
              
            if (updateError) throw updateError;
            
            // Update the local data
            data[0].cover_image_url = imageUrl;
          } catch (imageError) {
            console.error('Error with image upload:', imageError);
            // Continue anyway, the event is created
          }
        }
        
        setEvents([...events, data[0]]);
        setMessage('Event created successfully!');
      } else {
        // For edit mode
        // If we have a new image, upload it
        if (eventImageFile) {
          try {
            const imageUrl = await uploadEventImage(selectedEvent.id);
            eventData.cover_image_url = imageUrl;
          } catch (imageError) {
            console.error('Error with image upload:', imageError);
            // Continue anyway with the update
          }
        }
        
        const { data, error } = await supabase
          .from('network_events')
          .update(eventData)
          .eq('id', selectedEvent.id)
          .select();
          
        if (error) throw error;
        
        setEvents(events.map(e => e.id === selectedEvent.id ? data[0] : e));
        setMessage('Event updated successfully!');
      }
      
      setOpenEventDialog(false);
      
      // Reset image state
      setEventImageFile(null);
      setEventImagePreview(null);
    } catch (error) {
      console.error('Event error:', error);
      setError(`Failed to ${eventDialogMode} event. Please try again.`);
    } finally {
      setUpdating(false);
    }
  };
  

  const handleDeleteEvent = async (eventId) => {
    try {
      const { error } = await supabase
        .from('network_events')
        .delete()
        .eq('id', eventId);
      if (error) throw error;
      setEvents(events.filter(e => e.id !== eventId));
      setMessage('Event deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete event');
    }
  };

  const formatEventDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleEventImageChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      setEventImageFile(null);
      setEventImagePreview(null);
      return;
    }
    
    const file = event.target.files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF).');
      return;
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be less than 5MB.');
      return;
    }
    
    setEventImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setEventImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Add this function to upload the image
  const uploadEventImage = async (eventId) => {
    if (!eventImageFile) return null;
    
    try {
      setUploadingEventImage(true);
      
      // Create a unique file path in the events bucket
      const filePath = `${eventId}/${Date.now()}-${eventImageFile.name}`;
      
      // Upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, eventImageFile, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading event image:', error);
      throw error;
    } finally {
      setUploadingEventImage(false);
    }
  };

  // Helper function to determine if a color is dark
  const isColorDark = (hexColor) => {
    // Remove the # if it exists
    hexColor = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate brightness (standard formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return true if dark
    return brightness < 128;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            component={Link}
            to="/dashboard"
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            Network Admin Panel
          </Typography>
        </Box>
      </Paper>

      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Network Settings" icon={<AdminIcon />} />
          <Tab label="Members" icon={<PersonAddIcon />} />
          <Tab label="News" icon={<ArticleIcon />} />
          <Tab label="Events" icon={<EventIcon />} />
          <Tab label="Theme & Branding" icon={<PaletteIcon />} />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Network Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <form onSubmit={handleUpdateNetwork}>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Network Name"
                      value={networkName}
                      onChange={(e) => setNetworkName(e.target.value)}
                      required
                      variant="outlined"
                    />
                  </Box>
                  <Button 
                    type="submit" 
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Update Network'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Invite Members
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <form onSubmit={handleInvite}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      variant="outlined"
                    />
                    <Button 
                      type="submit" 
                      variant="contained"
                      color="primary"
                      startIcon={<PersonAddIcon />}
                      disabled={inviting}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {inviting ? 'Sending...' : 'Send Invite'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Network Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Network ID: {network?.id}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Created At: {new Date(network?.created_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Total Members: {members.length}
                  </Typography>
                  <Typography variant="subtitle1">
                    Admin Members: {members.filter(m => m.role === 'admin').length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Network Members ({members.length})
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {members.length > 0 ? (
              <TableContainer>
                <Table aria-label="members table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map(member => (
                      <TableRow 
                        key={member.id}
                        sx={member.id === user.id ? { 
                          backgroundColor: 'rgba(25, 118, 210, 0.08)' 
                        } : {}}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              src={member.profile_picture_url}
                              sx={{ mr: 2, width: 32, height: 32 }}
                            >
                              {member.full_name?.charAt(0).toUpperCase() || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="body1">
                                {member.full_name || 'Unnamed User'}
                                {member.id === user.id && ' (You)'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {member.contact_email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={member.role || 'member'} 
                            color={member.role === 'admin' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              component={Link}
                              to={`/profile/${member.id}`}
                            >
                              View
                            </Button>
                            {member.id !== user.id && (
                              <>
                                <Button 
                                  size="small"
                                  variant="outlined"
                                  color={member.role === 'admin' ? 'warning' : 'info'}
                                  startIcon={<AdminIcon />}
                                  onClick={() => confirmAction('toggleAdmin', member)}
                                >
                                  {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                </Button>
                                <Button 
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<PersonRemoveIcon />}
                                  onClick={() => confirmAction('remove', member)}
                                >
                                  Remove
                                </Button>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography align="center" sx={{ py: 3 }}>
                No members found in your network.
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Create News Post
          </Typography>
          <TextField
            fullWidth
            label="Post Title"
            value={newsTitle}
            onChange={(e) => setNewsTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Paper sx={{ 
            p: 2, 
            border: '1px solid #ddd',
            minHeight: '300px',
            '& .tiptap': {
              minHeight: '250px',
              padding: '8px',
              '&:focus-visible': {
                outline: 'none'
              }
            }
          }}>
            <EditorContent editor={editor} />
          </Paper>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleNewsSubmit}
              startIcon={<SaveIcon />}
            >
              Publish Post
            </Button>
            <Button
              variant="outlined"
              onClick={() => editor.commands.clearContent()}
            >
              Clear
            </Button>
          </Box>
        </Card>

        <Typography variant="h5" gutterBottom>
          Previous Posts
        </Typography>
        {newsPosts.map(post => (
          <Card key={post.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">{post.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                Posted by {members.find(m => m.id === post.created_by)?.full_name || 'Admin'} • 
                {new Date(post.created_at).toLocaleDateString()}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <div 
                className="tiptap-output"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                color="error"
                onClick={() => handleDeleteNews(post.id)}
                startIcon={<DeleteIcon />}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
    <Typography variant="h5">Network Events</Typography>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() => handleOpenEventDialog('create')}
    >
      New Event
    </Button>
  </Box>

  <Grid container spacing={3}>
  {events.map(event => (
    <Grid item xs={12} md={6} lg={4} key={event.id}>
      <Card>
        {event.cover_image_url && (
          <Box sx={{ 
            height: 140, 
            overflow: 'hidden',
            position: 'relative'
          }}>
            <img
              src={event.cover_image_url}
              alt={event.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        )}
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              {event.title}
            </Typography>
            <Box>
              <IconButton onClick={() => handleOpenEventDialog('edit', event)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={() => handleDeleteEvent(event.id)}>
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {formatEventDate(event.date)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {event.location}
          </Typography>
          {event.description && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              {event.description}
            </Typography>
          )}
          {event.capacity && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Capacity: {event.capacity}
            </Typography>
          )}
          
          {/* Add Event Participation Stats component */}
          <EventParticipationStats eventId={event.id} />
        </CardContent>
      </Card>
    </Grid>
  ))}
</Grid>
</TabPanel>

      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Background Color
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Current Background Color
                  </Typography>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 100, 
                      backgroundColor: themeSettings.backgroundColor,
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: isColorDark(themeSettings.backgroundColor) ? '#ffffff' : '#000000'
                    }}
                  >
                    <Typography variant="body1">
                      {themeSettings.backgroundColor}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select a Preset Color
                  </Typography>
                  <Grid container spacing={2}>
                    {colorPresets.map((color) => (
                      <Grid item key={color.value}>
                        <Box
                          onClick={() => setThemeSettings({...themeSettings, backgroundColor: color.value})}
                          sx={{
                            width: 60,
                            height: 60,
                            backgroundColor: color.value,
                            border: themeSettings.backgroundColor === color.value 
                              ? '3px solid #1976d2' 
                              : '1px solid #ddd',
                            borderRadius: 1,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          {themeSettings.backgroundColor === color.value && (
                            <CheckIcon sx={{ color: isColorDark(color.value) ? '#ffffff' : '#000000' }} />
                          )}
                        </Box>
                        <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
                          {color.name}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Custom Color
                  </Typography>
                  <TextField
                    fullWidth
                    label="Hex Color Code"
                    placeholder="#RRGGBB"
                    value={themeSettings.backgroundColor}
                    onChange={(e) => setThemeSettings({...themeSettings, backgroundColor: e.target.value})}
                    sx={{ mb: 2 }}
                    inputProps={{
                      pattern: "#[0-9A-Fa-f]{6}",
                      maxLength: 7
                    }}
                  />
                </Box>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveTheme}
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Background Color'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Network Logo
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Current Logo
                  </Typography>
                  
                  {logoPreview ? (
                    <Box 
                      sx={{ 
                        width: '100%',
                        height: 200,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        padding: 2,
                        mb: 2
                      }}
                    >
                      <img 
                        src={logoPreview} 
                        alt="Network Logo" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain' 
                        }} 
                      />
                    </Box>
                  ) : (
                    <Box 
                      sx={{ 
                        width: '100%',
                        height: 200,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '1px dashed #aaa',
                        borderRadius: 1,
                        backgroundColor: '#f9f9f9',
                        mb: 2
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No logo uploaded
                      </Typography>
                    </Box>
                  )}
                  
                  <input
                    accept="image/*"
                    id="logo-upload"
                    type="file"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                  <label htmlFor="logo-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<AddIcon />}
                    >
                      Select New Logo
                    </Button>
                  </label>
                    
                    {logoPreview && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo}
                      >
                        Remove Logo
                      </Button>
                    )}
                  </Box>
                </Box>
                
                {logoFile && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected file: {logoFile.name}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveLogo}
                      disabled={uploadingLogo}
                      sx={{ mt: 1 }}
                    >
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                  </Box>
                )}
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  Recommended logo size: 250x250 pixels. Max file size: 5MB.
                  Supported formats: PNG, JPG, GIF.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Event Dialog */}
      <Dialog open={openEventDialog} onClose={() => setOpenEventDialog(false)} maxWidth="md" fullWidth>
  <DialogTitle>
    {eventDialogMode === 'create' ? 'Create New Event' : 'Edit Event'}
  </DialogTitle>
  <DialogContent>
    <Grid container spacing={3} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <TextField
          autoFocus={!eventImagePreview}
          margin="dense"
          label="Event Title"
          fullWidth
          required
          value={eventForm.title}
          onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Date"
          type="date"
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
          value={eventForm.date}
          onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Location"
          fullWidth
          required
          value={eventForm.location}
          onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Capacity (optional)"
          type="number"
          fullWidth
          value={eventForm.capacity}
          onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
          sx={{ mb: 2 }}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" gutterBottom>
          Event Cover Image
        </Typography>
        
        <Box sx={{ 
          width: '100%', 
          height: 200, 
          border: '1px dashed #ccc',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#f8f8f8'
        }}>
          {eventImagePreview ? (
            <img 
              src={eventImagePreview} 
              alt="Event cover preview" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }} 
            />
          ) : (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <ImageIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No cover image selected
              </Typography>
            </Box>
          )}
        </Box>
        
        <input
          accept="image/*"
          id="event-cover-upload"
          type="file"
          onChange={handleEventImageChange}
          style={{ display: 'none' }}
        />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <label htmlFor="event-cover-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<ImageIcon />}
              size="small"
            >
              {eventImagePreview ? 'Change Image' : 'Add Cover Image'}
            </Button>
          </label>
          
          {eventImagePreview && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                setEventImageFile(null);
                setEventImagePreview(null);
              }}
            >
              Remove Image
            </Button>
          )}
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Recommended size: 1200x600 pixels. Max: 5MB.
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={eventForm.description}
          onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
        />
      </Grid>
    </Grid>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenEventDialog(false)}>Cancel</Button>
    {eventDialogMode === 'edit' && (
      <Button 
        onClick={() => exportParticipantsList(selectedEvent.id)}
        variant="outlined"
        color="secondary"
        startIcon={<PeopleIcon />}
      >
        Export Participants
      </Button>
    )}
    <Button 
      onClick={handleEventSubmit} 
      variant="contained" 
      disabled={updating || uploadingEventImage}
    >
      {(updating || uploadingEventImage) ? <CircularProgress size={24} /> : 'Save Event'}
    </Button>
  </DialogActions>
</Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogAction === 'remove' ? 'Remove Member' : 
           dialogAction === 'toggleAdmin' && dialogMember?.role === 'admin' ? 'Remove Admin Privileges' : 
           'Grant Admin Privileges'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction === 'remove' ? 
              `Are you sure you want to remove ${dialogMember?.full_name || 'this user'}?` : 
              dialogAction === 'toggleAdmin' && dialogMember?.role === 'admin' ? 
                `Remove admin privileges from ${dialogMember?.full_name || 'this user'}?` : 
                `Grant admin privileges to ${dialogMember?.full_name || 'this user'}?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleConfirmedAction} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default NetworkAdminPage;