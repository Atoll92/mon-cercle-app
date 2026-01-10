import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Delete as DeleteIcon,
  AccessTime as PendingIcon,
  CheckCircle as ApprovedIcon,
  Block as RejectedIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import {
  approveBlogComment,
  rejectBlogComment,
  deleteBlogComment
} from '../../../api/blog';

const BlogCommentsTab = ({ network, activeProfile }) => {
  const theme = useTheme();
  const themeColor = network?.theme_color || theme.palette.primary.main;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0=pending, 1=approved, 2=rejected
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Load all comments for the network's posts
  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch comments for the network (we need to get all posts first)
      const { data: posts, error: postsError } = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/blog_posts?network_id=eq.${network.id}&select=id`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      ).then(r => r.json());

      if (postsError) throw postsError;

      const postIds = posts?.map(p => p.id) || [];

      if (postIds.length === 0) {
        setComments([]);
        return;
      }

      // Fetch all comments for these posts
      const { data: commentsData, error: commentsError } = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/blog_comments?post_id=in.(${postIds.join(',')})&select=*,post:blog_posts(id,title),profile:profiles(id,full_name,profile_picture_url)&order=created_at.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      ).then(r => r.json());

      if (commentsError) throw commentsError;
      setComments(commentsData || []);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (network?.id) {
      loadComments();
    }
  }, [network?.id]);

  // Derive status from is_approved and is_hidden fields
  const getStatus = (comment) => {
    if (comment.is_hidden) return 'rejected';
    if (comment.is_approved) return 'approved';
    return 'pending';
  };

  // Filter comments by status
  const getFilteredComments = () => {
    switch (tabValue) {
      case 0:
        return comments.filter(c => getStatus(c) === 'pending');
      case 1:
        return comments.filter(c => getStatus(c) === 'approved');
      case 2:
        return comments.filter(c => getStatus(c) === 'rejected');
      default:
        return comments;
    }
  };

  const filteredComments = getFilteredComments();
  const pendingCount = comments.filter(c => getStatus(c) === 'pending').length;
  const approvedCount = comments.filter(c => getStatus(c) === 'approved').length;
  const rejectedCount = comments.filter(c => getStatus(c) === 'rejected').length;

  // Handle approve
  const handleApprove = async (comment) => {
    try {
      setActionLoading(comment.id);
      await approveBlogComment(comment.id);
      loadComments();
    } catch (err) {
      console.error('Error approving comment:', err);
      setError('Failed to approve comment');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject
  const handleReject = async (comment) => {
    try {
      setActionLoading(comment.id);
      await rejectBlogComment(comment.id);
      loadComments();
    } catch (err) {
      console.error('Error rejecting comment:', err);
      setError('Failed to reject comment');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteBlogComment(commentToDelete.id);
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
      loadComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get author name
  const getAuthorName = (comment) => {
    return comment.profile?.full_name || comment.author_name || 'Anonymous';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Comment Moderation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review and moderate comments on your blog posts
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={(e, v) => setTabValue(v)}
        sx={{ mb: 3 }}
      >
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PendingIcon sx={{ fontSize: 18 }} />
              Pending
              {pendingCount > 0 && (
                <Chip
                  label={pendingCount}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: alpha(themeColor, 0.1),
                    color: themeColor
                  }}
                />
              )}
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ApprovedIcon sx={{ fontSize: 18 }} />
              Approved ({approvedCount})
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RejectedIcon sx={{ fontSize: 18 }} />
              Rejected ({rejectedCount})
            </Box>
          }
        />
      </Tabs>

      {/* Comments List */}
      {filteredComments.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredComments.map((comment) => (
            <Card
              key={comment.id}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Avatar */}
                  <Avatar
                    src={comment.profile?.profile_picture_url}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: alpha(themeColor, 0.2),
                      color: themeColor
                    }}
                  >
                    {getAuthorName(comment)[0]?.toUpperCase()}
                  </Avatar>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {getAuthorName(comment)}
                      </Typography>
                      {comment.author_email && (
                        <Typography variant="caption" color="text.secondary">
                          ({comment.author_email})
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        • {formatDate(comment.created_at)}
                      </Typography>
                    </Box>

                    {/* Post reference */}
                    {comment.post && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        On: "{comment.post.title || 'Untitled post'}"
                      </Typography>
                    )}

                    {/* Reply indicator */}
                    {comment.parent_comment_id && (
                      <Chip
                        icon={<ReplyIcon sx={{ fontSize: 14 }} />}
                        label="Reply"
                        size="small"
                        sx={{ height: 20, mb: 1 }}
                      />
                    )}

                    {/* Comment content */}
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </Typography>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      {getStatus(comment) === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={actionLoading === comment.id ? <CircularProgress size={14} color="inherit" /> : <ApproveIcon />}
                            onClick={() => handleApprove(comment)}
                            disabled={actionLoading === comment.id}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => handleReject(comment)}
                            disabled={actionLoading === comment.id}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {getStatus(comment) === 'approved' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<RejectIcon />}
                          onClick={() => handleReject(comment)}
                          disabled={actionLoading === comment.id}
                        >
                          Unapprove
                        </Button>
                      )}

                      {getStatus(comment) === 'rejected' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleApprove(comment)}
                          disabled={actionLoading === comment.id}
                        >
                          Approve
                        </Button>
                      )}

                      <Tooltip title="Delete permanently">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setCommentToDelete(comment);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {tabValue === 0 ? 'No pending comments' :
             tabValue === 1 ? 'No approved comments' : 'No rejected comments'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 0
              ? 'All comments have been reviewed!'
              : 'Comments will appear here once they are reviewed.'}
          </Typography>
        </Box>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Comment?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this comment? This action cannot be undone.
          </Typography>
          {commentToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                "{commentToDelete.content?.substring(0, 100)}..."
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlogCommentsTab;
