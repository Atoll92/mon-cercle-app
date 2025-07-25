// src/pages/WikiPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
// Import the useTheme hook from your ThemeProvider
import { useTheme } from '../components/ThemeProvider';
import { useTranslation } from '../hooks/useTranslation';

import {
  Container,
  Paper,
  Typography,
  Box,
  Breadcrumbs,
  Divider,
  Button,
  Chip,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip
} from '@mui/material';
import Spinner from '../components/Spinner';
import MemberDetailsModal from '../components/MembersDetailModal';

import {
  Edit as EditIcon,
  History as HistoryIcon,
  DeleteOutline as DeleteIcon,
  MoreVert as MoreVertIcon,
  Comment as CommentIcon,
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

const WikiPage = () => {
  const { t } = useTranslation();
  const { networkId, pageSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  // Get theme information including darkMode state
  const { darkMode } = useTheme();
  
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [comments, setComments] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  
  // For viewing a specific revision
  const [viewingRevision, setViewingRevision] = useState(null);
  
  // For dialog confirmations
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [performing, setPerforming] = useState(false);

  // Fetch page and related data
  useEffect(() => {
    const fetchData = async () => {
      if (!networkId || !pageSlug) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch the user's profile
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, network_id')
            .eq('id', activeProfile.id)
            .single();
            
          if (!profileError) {
            setUserProfile(profileData);
            setIsAdmin(profileData.role === 'admin' && profileData.network_id === networkId);
          }
        }
        
        // Fetch page
        const { data: pageData, error: pageError } = await supabase
          .from('wiki_pages')
          .select(`
            *,
            creator:created_by(id, full_name, profile_picture_url),
            editor:last_edited_by(id, full_name, profile_picture_url)
          `)
          .eq('network_id', networkId)
          .eq('slug', pageSlug)
          .single();
          
        if (pageError) {
          if (pageError.code === 'PGRST116') {
            setError('Page not found. It may have been deleted or never existed.');
          } else {
            throw pageError;
          }
          return;
        }
        
        // Increment view count
        const { error: updateError } = await supabase
          .from('wiki_pages')
          .update({ views_count: pageData.views_count + 1 })
          .eq('id', pageData.id);
          
        if (updateError) console.error('Error updating view count:', updateError);
        
        setPage(pageData);
        
        // Fetch categories for this page
        const { data: categoryData, error: categoryError } = await supabase
          .from('wiki_page_categories')
          .select(`
            categories:category_id(id, name, slug)
          `)
          .eq('page_id', pageData.id);
          
        if (!categoryError && categoryData) {
          setCategories(categoryData.map(c => c.categories));
        }
        
        // Fetch revisions
        const { data: revisionData, error: revisionError } = await supabase
          .from('wiki_revisions')
          .select(`
            *,
            creator:created_by(id, full_name, profile_picture_url),
            approver:approved_by(id, full_name, profile_picture_url)
          `)
          .eq('page_id', pageData.id)
          .order('revision_number', { ascending: false });
          
        if (!revisionError) {
          setRevisions(revisionData || []);
        }
        
        // Fetch comments
        const { data: commentData, error: commentError } = await supabase
          .from('wiki_comments')
          .select(`
            *,
            profiles:profile_id(id, full_name, profile_picture_url),
            hider:hidden_by(id, full_name)
          `)
          .eq('page_id', pageData.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: true });
          
        if (!commentError) {
          setComments(commentData || []);
        }
        
      } catch (error) {
        console.error('Error fetching wiki page:', error);
        setError('Failed to load the wiki page. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [networkId, pageSlug, user]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    navigate(`/network/${networkId}/wiki/edit/${pageSlug}`);
    handleMenuClose();
  };

  const confirmDelete = () => {
    setShowDeleteDialog(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      setPerforming(true);
      
      const { error } = await supabase
        .from('wiki_pages')
        .delete()
        .eq('id', page.id);
        
      if (error) throw error;
      
      setShowDeleteDialog(false);
      navigate(`/network/${networkId}/wiki`);
    } catch (error) {
      console.error('Error deleting page:', error);
      setError('Failed to delete the page. Please try again.');
    } finally {
      setPerforming(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      setSubmittingComment(true);
      
      const { error } = await supabase
        .from('wiki_comments')
        .insert({
          page_id: page.id,
          profile_id: activeProfile.id,
          content: commentText.trim()
        });
        
      if (error) throw error;
      
      // Refresh comments
      const { data: newComments, error: fetchError } = await supabase
        .from('wiki_comments')
        .select(`
          *,
          profiles:profile_id(id, full_name, profile_picture_url),
          hider:hidden_by(id, full_name)
        `)
        .eq('page_id', page.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });
        
      if (!fetchError) {
        setComments(newComments || []);
      }
      
      setCommentText('');
      setShowCommentBox(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleHideComment = async (commentId) => {
    try {
      const { error } = await supabase
        .from('wiki_comments')
        .update({
          is_hidden: true,
          hidden_by: activeProfile.id,
          hidden_at: new Date().toISOString()
        })
        .eq('id', commentId);
        
      if (error) throw error;
      
      // Update comments list
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error hiding comment:', error);
      setError('Failed to hide comment. Please try again.');
    }
  };

  const handleViewRevision = (revision) => {
    setViewingRevision(revision);
    setShowRevisionHistory(false);
  };

  const handleApproveRevision = async (revision) => {
    try {
      setPerforming(true);
      
      // First, update the revision
      const { error: revisionError } = await supabase
        .from('wiki_revisions')
        .update({
          is_approved: true,
          approved_by: activeProfile.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', revision.id);
        
      if (revisionError) throw revisionError;
      
      // Then, update the main page with this revision's content
      const { error: pageError } = await supabase
        .from('wiki_pages')
        .update({
          content: revision.content,
          last_edited_by: revision.created_by,
          updated_at: new Date().toISOString(),
          is_published: true
        })
        .eq('id', page.id);
        
      if (pageError) throw pageError;
      
      // Refresh the page data
      const { data: pageData, error: fetchError } = await supabase
        .from('wiki_pages')
        .select(`
          *,
          creator:created_by(id, full_name, profile_picture_url),
          editor:last_edited_by(id, full_name, profile_picture_url)
        `)
        .eq('id', page.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      setPage(pageData);
      
      // Refresh the revisions
      const { data: revisionsData, error: revError } = await supabase
        .from('wiki_revisions')
        .select(`
          *,
          creator:created_by(id, full_name, profile_picture_url),
          approver:approved_by(id, full_name, profile_picture_url)
        `)
        .eq('page_id', page.id)
        .order('revision_number', { ascending: false });
        
      if (revError) throw revError;
      
      setRevisions(revisionsData || []);
      setViewingRevision(null);
      setShowApproveDialog(false);
    } catch (error) {
      console.error('Error approving revision:', error);
      setError('Failed to approve revision. Please try again.');
    } finally {
      setPerforming(false);
    }
  };

  const handleRejectRevision = async (revision) => {
    try {
      const { error } = await supabase
        .from('wiki_revisions')
        .delete()
        .eq('id', revision.id);
        
      if (error) throw error;
      
      // Refresh revisions
      const { data, error: fetchError } = await supabase
        .from('wiki_revisions')
        .select(`
          *,
          creator:created_by(id, full_name, profile_picture_url),
          approver:approved_by(id, full_name, profile_picture_url)
        `)
        .eq('page_id', page.id)
        .order('revision_number', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      setRevisions(data || []);
      setViewingRevision(null);
    } catch (error) {
      console.error('Error rejecting revision:', error);
      setError('Failed to reject revision. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Spinner size={120} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            component={Link}
            to={`/network/${networkId}/wiki`}
            startIcon={<ArrowBackIcon />}
          >
            Back to Wiki
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!page) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>
              Page Not Found
            </Typography>
            <Typography variant="body1" paragraph>
              The wiki page you're looking for doesn't exist.
            </Typography>
            <Button
              component={Link}
              to={`/network/${networkId}/wiki`}
              startIcon={<ArrowBackIcon />}
            >
              Back to Wiki
            </Button>
            <Button
              component={Link}
              to={`/network/${networkId}/wiki/new`}
              sx={{ ml: 2 }}
              variant="contained"
            >
              Create This Page
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  const displayContent = viewingRevision ? viewingRevision.content : page.content;

  // Dark mode styling adjustments for the wiki content
  const wikiContentStyles = {
    // Add custom styles for the wiki content area depending on dark mode
    color: darkMode ? 'inherit' : 'inherit',
    '& a': {
      color: darkMode ? '#90caf9' : '#1976d2', // Different link colors for dark/light mode
    },
    '& img': {
      maxWidth: '100%',
      height: 'auto',
      // Optional: add a subtle border in dark mode for better visibility of images
      ...(darkMode && {
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }),
    },
    '& pre, & code': {
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      padding: '0.2em 0.4em',
      borderRadius: '3px',
      fontFamily: 'monospace',
    },
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      marginBottom: '1rem',
    },
    '& th, & td': {
      border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
      padding: '8px',
    },
    '& th': {
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    '& blockquote': {
      borderLeft: darkMode ? '4px solid rgba(255, 255, 255, 0.2)' : '4px solid rgba(0, 0, 0, 0.1)',
      margin: '1em 0',
      padding: '0 1em',
    },
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Breadcrumb navigation */}
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs>
            <Link to={`/network/${networkId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              Network
            </Link>
            <Link to={`/network/${networkId}/wiki`} style={{ textDecoration: 'none', color: 'inherit' }}>
              Wiki
            </Link>
            <Typography color="textPrimary">{page.title}</Typography>
          </Breadcrumbs>
        </Box>

        {viewingRevision && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => setViewingRevision(null)}>
                Back to Current Version
              </Button>
            }
          >
            You are viewing revision #{viewingRevision.revision_number} created by {viewingRevision.creator?.full_name || 'Unknown'} on {formatDate(viewingRevision.created_at)}
            {isAdmin && !viewingRevision.is_approved && (
              <Box sx={{ mt: 1 }}>
                <Button 
                  size="small" 
                  startIcon={<ApproveIcon />} 
                  variant="outlined" 
                  color="success"
                  onClick={() => setShowApproveDialog(true)}
                  sx={{ mr: 1 }}
                >
                  Approve & Publish
                </Button>
                <Button 
                  size="small" 
                  startIcon={<RejectIcon />} 
                  variant="outlined" 
                  color="error"
                  onClick={() => handleRejectRevision(viewingRevision)}
                >
                  Reject
                </Button>
              </Box>
            )}
          </Alert>
        )}

        {/* Page header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {page.title}
          </Typography>
          
          <Box>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleEdit}>
                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                Edit
              </MenuItem>
              <MenuItem onClick={() => {
                setShowRevisionHistory(!showRevisionHistory);
                handleMenuClose();
              }}>
                <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
                View History
              </MenuItem>
              {isAdmin && (
                <MenuItem onClick={confirmDelete} sx={{ color: 'error.main' }}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete
                </MenuItem>
              )}
            </Menu>
          </Box>
        </Box>

        {/* Categories */}
        {categories.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {categories.map(category => (
              <Chip 
                key={category.id}
                label={category.name}
                component={Link}
                to={`/network/${networkId}/wiki/category/${category.slug}`}
                clickable
                size="small"
                color="primary"
                variant="outlined"
                icon={<CategoryIcon fontSize="small" />}
                sx={{ mr: 1 }}
              />
            ))}
          </Box>
        )}

        {/* Page metadata */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', color: 'text.secondary', flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ mr: 3 }}>
            Created by {page.creator?.full_name || 'Unknown'} on {formatDate(page.created_at)}
          </Typography>
          
          {page.last_edited_by && (
            <Typography variant="body2" sx={{ mr: 3 }}>
              Last edited by {page.editor?.full_name || 'Unknown'} on {formatDate(page.updated_at)}
            </Typography>
          )}
          
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
            <ViewIcon fontSize="small" sx={{ mr: 0.5 }} />
            {page.views_count} views
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Page content - with dark mode styling */}
        <Box sx={{ mb: 4 }}>
          {displayContent ? (
            <Box className="wiki-content" sx={wikiContentStyles}>
              <div 
                className="prose max-w-none" 
                dangerouslySetInnerHTML={{ __html: displayContent }}
              />
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              This page has no content yet. Click the edit button to add content.
            </Typography>
          )}
        </Box>

        {/* Comments section */}
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Comments ({comments.length})
            </Typography>
            
            {user && (
              <Button 
                startIcon={<CommentIcon />}
                onClick={() => setShowCommentBox(!showCommentBox)}
              >
                {t('dashboard.comment')}
              </Button>
            )}
          </Box>
          
          {showCommentBox && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Write your comment here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  onClick={() => setShowCommentBox(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained"
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || submittingComment}
                >
                  {submittingComment ? 'Submitting...' : t('dashboard.comment')}
                </Button>
              </Box>
            </Box>
          )}
          
          {comments.length > 0 ? (
            <List>
              {comments.map(comment => (
                <ListItem 
                  key={comment.id}
                  alignItems="flex-start"
                  sx={{ 
                    pb: 2, 
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' } 
                  }}
                  secondaryAction={
                    isAdmin && (
                      <Tooltip title="Hide comment">
                        <IconButton 
                          edge="end" 
                          onClick={() => handleHideComment(comment.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={comment.profiles?.profile_picture_url}
                      onClick={() => {
                        if (comment.profiles) {
                          setSelectedMember(comment.profiles);
                          setShowMemberDetailsModal(true);
                        }
                      }}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8
                        }
                      }}
                    >
                      {comment.profiles?.full_name?.charAt(0) || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle2"
                        onClick={() => {
                          if (comment.profiles) {
                            setSelectedMember(comment.profiles);
                            setShowMemberDetailsModal(true);
                          }
                        }}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            color: 'primary.main',
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {comment.profiles?.full_name || 'Unknown User'}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block', my: 1 }}
                        >
                          {comment.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Posted on {formatDate(comment.created_at)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No comments yet. Be the first to comment!
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Revision history sidebar - with dark mode compatible styling */}
      {showRevisionHistory && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Revision History
            </Typography>
            <Button 
              size="small"
              onClick={() => setShowRevisionHistory(false)}
            >
              Close
            </Button>
          </Box>
          
          {revisions.length > 0 ? (
            <List>
              {revisions.map(revision => (
                <ListItem 
                  key={revision.id}
                  button
                  onClick={() => handleViewRevision(revision)}
                  sx={{ 
                    borderLeft: revision.is_approved ? '3px solid #4caf50' : 
                              viewingRevision?.id === revision.id ? '3px solid #2196f3' : 'none',
                    pl: revision.is_approved || viewingRevision?.id === revision.id ? 2 : 3,
                    backgroundColor: viewingRevision?.id === revision.id ? 
                      (darkMode ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)') : 'inherit'
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="body2" component="span">
                          Revision #{revision.revision_number}
                        </Typography>
                        {revision.is_approved && (
                          <Chip 
                            label="Published" 
                            size="small" 
                            color="success" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Created by {revision.creator?.full_name || 'Unknown'} on {formatDate(revision.created_at)}
                        </Typography>
                        {revision.comment && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            "{revision.comment}"
                          </Typography>
                        )}
                        {revision.is_approved && revision.approver && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Approved by {revision.approver.full_name} on {formatDate(revision.approved_at)}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No revisions available for this page.
            </Typography>
          )}
        </Paper>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the page "{page.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            disabled={performing}
          >
            {performing ? 'Deleting...' : 'Delete Page'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve revision dialog */}
      <Dialog
        open={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
      >
        <DialogTitle>Approve Revision</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to approve revision #{viewingRevision?.revision_number}?
          </Typography>
          <Typography>
            This will publish the changes to the main page, making them visible to all users.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApproveDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => handleApproveRevision(viewingRevision)}
            color="primary"
            variant="contained"
            disabled={performing}
          >
            {performing ? 'Publishing...' : 'Approve & Publish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal
          open={showMemberDetailsModal}
          onClose={() => {
            setShowMemberDetailsModal(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
        />
      )}
    </Container>
  );
};

export default WikiPage;