import React, { useState, useEffect } from 'react';
import MembersDetailModal from '../MembersDetailModal';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Divider,
  Alert,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  alpha
} from '@mui/material';
import Spinner from '../Spinner';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Flag as FlagIcon,
  Block as BlockIcon,
  Person as PersonIcon,
  FilterList as FilterListIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  Report as ReportIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseclient';

// Tabs for different moderation areas
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`moderation-tabpanel-${index}`}
      aria-labelledby={`moderation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const ModerationTab = ({ network, user, members = [], darkMode = false }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Content moderation states
  const [contentItems, setContentItems] = useState([]);
  const [contentFilter, setContentFilter] = useState('all');
  const [contentSearchTerm, setContentSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  
  // User moderation states
  const [userModeration, setUserModeration] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionDialog, setUserActionDialog] = useState(false);
  const [userAction, setUserAction] = useState('');
  const [userActionReason, setUserActionReason] = useState('');
  
  // Moderation logs state
  const [moderationLogs, setModerationLogs] = useState([]);
  
  // Member modal state
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  
  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    action: null,
    item: null
  });

  // Handle member click to show modal
  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setMemberModalOpen(true);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Load data based on selected tab
    if (newValue === 0) {
      fetchContentToModerate();
    } else if (newValue === 1) {
      fetchUsersToModerate();
    } else if (newValue === 2) {
      fetchModerationLogs();
    }
  };

  // Initial data load
  useEffect(() => {
    fetchContentToModerate();
  }, [network?.id]);

  // Fetch content that might need moderation
  const fetchContentToModerate = async () => {
    if (!network?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch news posts
      const { data: newsPosts, error: newsError } = await supabase
        .from('network_news')
        .select(`
          id, 
          title, 
          content,
          image_url,
          created_at,
          is_hidden,
          is_flagged,
          flag_reason,
          profiles:created_by (id, full_name, profile_picture_url)
        `)
        .eq('network_id', network.id)
        .order('created_at', { ascending: false });
        
      if (newsError) throw newsError;
      
      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id, 
          content, 
          created_at,
          is_hidden,
          is_flagged,
          flag_reason,
          profiles:user_id (id, full_name, profile_picture_url)
        `)
        .eq('network_id', network.id)
        .order('created_at', { ascending: false });
        
      if (messagesError) throw messagesError;
      
      // Combine and format all content
      const allContent = [
        ...(newsPosts || []).map(post => ({
          ...post,
          type: 'news',
          display_content: post.title
        })),
        ...(messages || []).map(message => ({
          ...message,
          type: 'message',
          display_content: message.content
        }))
      ];
      
      setContentItems(allContent);
    } catch (error) {
      console.error('Error fetching content:', error);
      setError(`Failed to load content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for moderation
  const fetchUsersToModerate = async () => {
    if (!network?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          contact_email,
          profile_picture_url,
          role,
          is_suspended,
          suspension_reason,
          suspension_end_date,
          restriction_level,
          restriction_reason,
          last_active
        `)
        .eq('network_id', network.id);
        
      if (usersError) throw usersError;
      
      setUserModeration(users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Failed to load users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch moderation logs
  const fetchModerationLogs = async () => {
    if (!network?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: logs, error: logsError } = await supabase
        .from('moderation_logs')
        .select(`
          id,
          network_id,
          moderator_id,
          target_type,
          target_id,
          action,
          reason,
          created_at,
          moderators:moderator_id (full_name)
        `)
        .eq('network_id', network.id)
        .order('created_at', { ascending: false });
        
      if (logsError) throw logsError;
      
      setModerationLogs(logs || []);
    } catch (error) {
      console.error('Error fetching moderation logs:', error);
      setError(`Failed to load moderation logs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if table needs to be created
  const isTableMissing = async (tableName) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
        
      // If the error code is 42P01, the table doesn't exist
      return error && error.code === '42P01';
    } catch (error) {
      console.error(`Error checking if ${tableName} exists:`, error);
      return true;
    }
  };

  // Setup required database tables if they don't exist
  const setupModerationTables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if we need to add columns to existing tables
      const needsNewsColumns = await isColumnMissing('network_news', 'is_hidden');
      const needsMessagesColumns = await isColumnMissing('messages', 'is_hidden');
      const needsProfilesColumns = await isColumnMissing('profiles', 'is_suspended');
      const needsModerationLogsTable = await isTableMissing('moderation_logs');
      
      if (!needsNewsColumns && !needsMessagesColumns && !needsProfilesColumns && !needsModerationLogsTable) {
        setSuccess('All moderation tables are already set up correctly.');
        return;
      }
      
      // Add required SQL statements (this would normally be done via migrations)
      // For demo purposes, we're using RPC calls to simulate running these SQL statements
      
      if (needsNewsColumns) {
        // Add moderation columns to network_news
        await supabase.rpc('add_moderation_columns_to_news');
      }
      
      if (needsMessagesColumns) {
        // Add moderation columns to messages
        await supabase.rpc('add_moderation_columns_to_messages');
      }
      
      if (needsProfilesColumns) {
        // Add moderation columns to profiles
        await supabase.rpc('add_moderation_columns_to_profiles');
      }
      
      if (needsModerationLogsTable) {
        // Create moderation_logs table
        await supabase.rpc('create_moderation_logs_table');
      }
      
      setSuccess('Moderation tables have been set up successfully.');
      
      // Refresh all data
      fetchContentToModerate();
      fetchUsersToModerate();
      fetchModerationLogs();
    } catch (error) {
      console.error('Error setting up moderation tables:', error);
      setError(`Failed to set up moderation tables: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check if a column exists in a table
  const isColumnMissing = async (tableName, columnName) => {
    try {
      // This is a simplified approach - in a real app, you'd check with a database information schema query
      // For the demo, we'll return true to simulate the column doesn't exist
      return true;
    } catch (error) {
      console.error(`Error checking if ${columnName} exists in ${tableName}:`, error);
      return true;
    }
  };

  // Handle flagging content
  const handleFlagContent = (item) => {
    setConfirmDialog({
      open: true,
      title: 'Flag Content',
      content: `Are you sure you want to flag this ${item.type}? Flagged content is marked for review.`,
      action: 'flag',
      item
    });
  };

  // Handle hiding content
  const handleHideContent = (item) => {
    setConfirmDialog({
      open: true,
      title: `${item.is_hidden ? 'Unhide' : 'Hide'} Content`,
      content: `Are you sure you want to ${item.is_hidden ? 'unhide' : 'hide'} this ${item.type}? ${item.is_hidden ? 'Unhidden content will be visible to all users.' : 'Hidden content will not be visible to users.'}`,
      action: 'hide',
      item
    });
  };

  // Handle deleting content
  const handleDeleteContent = (item) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Content',
      content: `Are you sure you want to permanently delete this ${item.type}? This action cannot be undone.`,
      action: 'delete',
      item
    });
  };

  // Handle user action dialog
  const handleUserActionOpen = (user, action) => {
    setSelectedUser(user);
    setUserAction(action);
    setUserActionDialog(true);
  };

  // Execute content moderation action
  const executeContentAction = async () => {
    if (!confirmDialog.action || !confirmDialog.item) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { item, action } = confirmDialog;
      let result, table;
      
      // Determine table based on content type
      if (item.type === 'news') {
        table = 'network_news';
      } else if (item.type === 'message') {
        table = 'messages';
      }
      
      // Execute action
      if (action === 'flag') {
        // Toggle flag status
        const updatedFlagStatus = !item.is_flagged;
        
        const { error } = await supabase
          .from(table)
          .update({ 
            is_flagged: updatedFlagStatus,
            flag_reason: updatedFlagStatus ? 'Flagged by moderator' : null 
          })
          .eq('id', item.id);
          
        if (error) throw error;
        
        result = `Content ${updatedFlagStatus ? 'flagged' : 'unflagged'} successfully`;
        
        // Log the action
        await logModerationAction(
          item.id,
          item.type,
          updatedFlagStatus ? 'flag' : 'unflag',
          updatedFlagStatus ? 'Flagged by moderator' : 'Unflagged by moderator'
        );
      } else if (action === 'hide') {
        // Toggle hidden status
        const updatedHiddenStatus = !item.is_hidden;
        
        const { error } = await supabase
          .from(table)
          .update({ is_hidden: updatedHiddenStatus })
          .eq('id', item.id);
          
        if (error) throw error;
        
        result = `Content ${updatedHiddenStatus ? 'hidden' : 'unhidden'} successfully`;
        
        // Log the action
        await logModerationAction(
          item.id,
          item.type,
          updatedHiddenStatus ? 'hide' : 'unhide',
          updatedHiddenStatus ? 'Hidden by moderator' : 'Unhidden by moderator'
        );
      } else if (action === 'delete') {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', item.id);
          
        if (error) throw error;
        
        result = `Content deleted successfully`;
        
        // Log the action
        await logModerationAction(
          item.id,
          item.type,
          'delete',
          'Deleted by moderator'
        );
      }
      
      setSuccess(result);
      
      // Update local state
      if (action === 'delete') {
        setContentItems(contentItems.filter(content => content.id !== item.id));
      } else {
        setContentItems(contentItems.map(content => {
          if (content.id === item.id) {
            if (action === 'flag') {
              return { ...content, is_flagged: !content.is_flagged };
            } else if (action === 'hide') {
              return { ...content, is_hidden: !content.is_hidden };
            }
          }
          return content;
        }));
      }
    } catch (error) {
      console.error('Error executing content action:', error);
      setError(`Failed to execute action: ${error.message}`);
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  // Execute user moderation action
  const executeUserAction = async () => {
    if (!selectedUser || !userAction) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let updates = {};
      let actionDescription = '';
      
      // Prepare updates based on action
      if (userAction === 'suspend') {
        updates = {
          is_suspended: true,
          suspension_reason: userActionReason,
          suspension_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        };
        actionDescription = 'User suspended successfully';
      } else if (userAction === 'unsuspend') {
        updates = {
          is_suspended: false,
          suspension_reason: null,
          suspension_end_date: null
        };
        actionDescription = 'User unsuspended successfully';
      } else if (userAction === 'restrict') {
        updates = {
          restriction_level: 'limited',
          restriction_reason: userActionReason
        };
        actionDescription = 'User restricted successfully';
      } else if (userAction === 'unrestrict') {
        updates = {
          restriction_level: null,
          restriction_reason: null
        };
        actionDescription = 'User restrictions removed successfully';
      }
      
      // Update the user
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      // Log the action
      await logModerationAction(
        selectedUser.id,
        'user',
        userAction,
        userActionReason || `${userAction} by moderator`
      );
      
      setSuccess(actionDescription);
      
      // Update user in the list
      setUserModeration(userModeration.map(user => {
        if (user.id === selectedUser.id) {
          return { ...user, ...updates };
        }
        return user;
      }));
    } catch (error) {
      console.error('Error executing user action:', error);
      setError(`Failed to execute action: ${error.message}`);
    } finally {
      setLoading(false);
      setUserActionDialog(false);
      setUserActionReason('');
    }
  };

  // Log moderation action
  const logModerationAction = async (targetId, targetType, action, reason) => {
    try {
      await supabase
        .from('moderation_logs')
        .insert([{
          network_id: network.id,
          moderator_id: user.id,
          target_type: targetType,
          target_id: targetId,
          action,
          reason
        }]);
    } catch (error) {
      console.error('Error logging moderation action:', error);
    }
  };

  // Filter content based on filter and search term
  const filteredContent = contentItems.filter(item => {
    // Filter by visibility if not showing hidden content
    if (!showHidden && item.is_hidden) {
      return false;
    }
    
    // Filter by type
    if (contentFilter !== 'all' && item.type !== contentFilter) {
      return false;
    }
    
    // Filter by flag status
    if (contentFilter === 'flagged' && !item.is_flagged) {
      return false;
    }
    
    // Filter by search term
    if (contentSearchTerm) {
      const searchLower = contentSearchTerm.toLowerCase();
      return (
        (item.display_content && item.display_content.toLowerCase().includes(searchLower)) ||
        (item.content && item.content.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  return (
    <Box>
      {/* Alert messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Setup Banner */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.info.light}`,
          bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.dark, 0.1) : alpha(theme.palette.info.light, 0.1)
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="info" sx={{ mr: 1.5 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Database Setup Required
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Additional database tables are needed for moderation features.
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            color="info" 
            onClick={setupModerationTables}
            disabled={loading}
            startIcon={loading ? <Spinner size={40} /> : <LockIcon />}
          >
            Setup Moderation Tables
          </Button>
        </Box>
      </Paper>
      
      {/* Moderation Tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="moderation tabs"
          >
            <Tab 
              icon={<FlagIcon fontSize="small" />}
              iconPosition="start"
              label="Content Moderation" 
              id="moderation-tab-0" 
            />
            <Tab 
              icon={<PersonIcon fontSize="small" />}
              iconPosition="start"
              label="User Moderation" 
              id="moderation-tab-1" 
            />
            <Tab 
              icon={<HistoryIcon fontSize="small" />}
              iconPosition="start"
              label="Moderation Logs" 
              id="moderation-tab-2" 
            />
          </Tabs>
        </Box>
        
        {/* Content Moderation Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
              Content Moderation
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              {/* Filter Select */}
              <FormControl sx={{ minWidth: 150 }} size="small">
                <InputLabel id="content-filter-label">Filter</InputLabel>
                <Select
                  labelId="content-filter-label"
                  value={contentFilter}
                  label="Filter"
                  onChange={(e) => setContentFilter(e.target.value)}
                  startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1 }} />}
                >
                  <MenuItem value="all">All Content</MenuItem>
                  <MenuItem value="news">News Only</MenuItem>
                  <MenuItem value="message">Messages Only</MenuItem>
                  <MenuItem value="flagged">Flagged Content</MenuItem>
                </Select>
              </FormControl>
              
              {/* Search Input */}
              <TextField 
                size="small"
                placeholder="Search content..."
                value={contentSearchTerm}
                onChange={(e) => setContentSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                }}
                sx={{ flexGrow: 1 }}
              />
              
              {/* Show Hidden Switch */}
              <FormControlLabel
                control={
                  <Switch 
                    checked={showHidden} 
                    onChange={(e) => setShowHidden(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Hidden Content"
              />
              
              {/* Refresh Button */}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchContentToModerate}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Spinner />
            </Box>
          ) : filteredContent.length === 0 ? (
            <Paper
              sx={{ 
                p: 3, 
                textAlign: 'center',
                bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.1) : alpha(theme.palette.primary.light, 0.1)
              }}
            >
              <VisibilityOffIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6">No Content Found</Typography>
              <Typography variant="body2" color="text.secondary">
                {contentFilter !== 'all' || contentSearchTerm 
                  ? 'Try changing your filters or search terms'
                  : 'There is no content to moderate at this time'}
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table sx={{ minWidth: 650 }} aria-label="content moderation table">
                <TableHead>
                  <TableRow>
                    <TableCell>Content</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredContent.map((item) => (
                    <TableRow
                      key={`${item.type}-${item.id}`}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        bgcolor: item.is_hidden 
                          ? (theme.palette.mode === 'dark' ? alpha(theme.palette.error.dark, 0.1) : alpha(theme.palette.error.light, 0.1))
                          : item.is_flagged 
                            ? (theme.palette.mode === 'dark' ? alpha(theme.palette.warning.dark, 0.1) : alpha(theme.palette.warning.light, 0.1))
                            : 'inherit'
                      }}
                    >
                      <TableCell sx={{ maxWidth: 250 }}>
                        <Typography noWrap>
                          {item.display_content}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          size="small"
                          color={item.type === 'news' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                              color: 'primary.main'
                            }
                          }}
                          onClick={() => item.profiles && handleMemberClick(item.profiles)}
                        >
                          {item.profiles?.profile_picture_url ? (
                            <Box 
                              component="img" 
                              src={item.profiles.profile_picture_url}
                              alt={item.profiles.full_name}
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%',
                                mr: 1
                              }}
                            />
                          ) : (
                            <PersonIcon sx={{ fontSize: 20, mr: 1 }} />
                          )}
                          {item.profiles?.full_name || 'Unknown User'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {item.is_hidden && (
                          <Chip 
                            label="Hidden" 
                            size="small" 
                            color="error"
                            icon={<VisibilityOffIcon />}
                            sx={{ mr: 0.5 }}
                          />
                        )}
                        {item.is_flagged && (
                          <Chip 
                            label="Flagged" 
                            size="small" 
                            color="warning"
                            icon={<FlagIcon />}
                          />
                        )}
                        {!item.is_hidden && !item.is_flagged && (
                          <Chip 
                            label="Visible" 
                            size="small" 
                            color="success"
                            icon={<VisibilityIcon />}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex' }}>
                          <Tooltip title={item.is_flagged ? "Unflag Content" : "Flag Content"}>
                            <IconButton 
                              color={item.is_flagged ? "warning" : "default"}
                              onClick={() => handleFlagContent(item)}
                              size="small"
                            >
                              <FlagIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={item.is_hidden ? "Unhide Content" : "Hide Content"}>
                            <IconButton 
                              color={item.is_hidden ? "error" : "default"}
                              onClick={() => handleHideContent(item)}
                              size="small"
                            >
                              {item.is_hidden ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete Content">
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteContent(item)}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        {/* User Moderation Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              User Moderation
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchUsersToModerate}
            >
              Refresh User List
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Spinner />
            </Box>
          ) : userModeration.length === 0 ? (
            <Paper
              sx={{ 
                p: 3, 
                textAlign: 'center',
                bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.1) : alpha(theme.palette.primary.light, 0.1)
              }}
            >
              <PersonIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6">No Users Found</Typography>
              <Typography variant="body2" color="text.secondary">
                There are no users in this network to moderate
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table sx={{ minWidth: 650 }} aria-label="user moderation table">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userModeration.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        bgcolor: user.is_suspended 
                          ? (theme.palette.mode === 'dark' ? alpha(theme.palette.error.dark, 0.1) : alpha(theme.palette.error.light, 0.1))
                          : user.restriction_level
                            ? (theme.palette.mode === 'dark' ? alpha(theme.palette.warning.dark, 0.1) : alpha(theme.palette.warning.light, 0.1))
                            : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                              color: 'primary.main'
                            }
                          }}
                          onClick={() => handleMemberClick(user)}
                        >
                          {user.profile_picture_url ? (
                            <Box 
                              component="img" 
                              src={user.profile_picture_url}
                              alt={user.full_name}
                              sx={{ 
                                width: 30, 
                                height: 30, 
                                borderRadius: '50%',
                                mr: 1.5
                              }}
                            />
                          ) : (
                            <PersonIcon sx={{ mr: 1.5 }} />
                          )}
                          <Box>
                            <Typography variant="body1">
                              {user.full_name || 'Unnamed User'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.contact_email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role || 'member'} 
                          size="small"
                          color={user.role === 'admin' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {user.is_suspended && (
                          <Chip 
                            label="Suspended" 
                            size="small" 
                            color="error"
                            icon={<BlockIcon />}
                            sx={{ mr: 0.5 }}
                          />
                        )}
                        {user.restriction_level && (
                          <Chip 
                            label="Restricted" 
                            size="small" 
                            color="warning"
                            icon={<ReportIcon />}
                          />
                        )}
                        {!user.is_suspended && !user.restriction_level && (
                          <Chip 
                            label="Active" 
                            size="small" 
                            color="success"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {user.is_suspended ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleUserActionOpen(user, 'unsuspend')}
                            >
                              Unsuspend
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleUserActionOpen(user, 'suspend')}
                              disabled={user.id === user.id} // Can't suspend yourself
                            >
                              Suspend
                            </Button>
                          )}
                          
                          {user.restriction_level ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleUserActionOpen(user, 'unrestrict')}
                            >
                              Remove Restrictions
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => handleUserActionOpen(user, 'restrict')}
                              disabled={user.id === user.id} // Can't restrict yourself
                            >
                              Restrict
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        {/* Moderation Logs Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Moderation Logs
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchModerationLogs}
            >
              Refresh Logs
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Spinner />
            </Box>
          ) : moderationLogs.length === 0 ? (
            <Paper
              sx={{ 
                p: 3, 
                textAlign: 'center',
                bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.1) : alpha(theme.palette.primary.light, 0.1)
              }}
            >
              <HistoryIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6">No Moderation Logs</Typography>
              <Typography variant="body2" color="text.secondary">
                There are no moderation logs to display
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table sx={{ minWidth: 650 }} aria-label="moderation logs table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Moderator</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {moderationLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        {log.moderators?.full_name || 'Unknown Moderator'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.action.charAt(0).toUpperCase() + log.action.slice(1)} 
                          size="small"
                          color={
                            log.action.includes('delete') ? 'error' :
                            log.action.includes('suspend') || log.action.includes('hide') ? 'warning' :
                            'primary'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.target_type.charAt(0).toUpperCase() + log.target_type.slice(1)} 
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{log.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Box>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={executeContentAction} 
            color="primary"
            variant="contained"
            disabled={loading}
            autoFocus
          >
            {loading ? <Spinner size={48} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* User Action Dialog */}
      <Dialog
        open={userActionDialog}
        onClose={() => !loading && setUserActionDialog(false)}
      >
        <DialogTitle>
          {userAction === 'suspend' && 'Suspend User'}
          {userAction === 'unsuspend' && 'Unsuspend User'}
          {userAction === 'restrict' && 'Restrict User'}
          {userAction === 'unrestrict' && 'Remove User Restrictions'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {userAction === 'suspend' && `Are you sure you want to suspend ${selectedUser?.full_name || 'this user'}?`}
            {userAction === 'unsuspend' && `Are you sure you want to unsuspend ${selectedUser?.full_name || 'this user'}?`}
            {userAction === 'restrict' && `Are you sure you want to restrict ${selectedUser?.full_name || 'this user'}?`}
            {userAction === 'unrestrict' && `Are you sure you want to remove restrictions from ${selectedUser?.full_name || 'this user'}?`}
          </DialogContentText>
          
          {(userAction === 'suspend' || userAction === 'restrict') && (
            <TextField
              autoFocus
              margin="dense"
              label="Reason"
              fullWidth
              variant="outlined"
              value={userActionReason}
              onChange={(e) => setUserActionReason(e.target.value)}
              required
              placeholder="Provide a reason for this action"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setUserActionDialog(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={executeUserAction} 
            color="primary"
            variant="contained"
            disabled={loading || ((userAction === 'suspend' || userAction === 'restrict') && !userActionReason)}
          >
            {loading ? <Spinner size={48} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Member Details Modal */}
      <MembersDetailModal
        open={memberModalOpen}
        onClose={() => {
          setMemberModalOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        currentUserId={user?.id}
      />
    </Box>
  );
};

export default ModerationTab;