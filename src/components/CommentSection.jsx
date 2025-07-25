import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useTranslation } from '../hooks/useTranslation';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Avatar,
  Collapse,
  Fade,
  alpha,
  useTheme,
  Divider,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import Spinner from './Spinner';
import MemberDetailsModal from './MembersDetailModal';
import {
  ChatBubbleOutline as CommentIcon,
  Send as SendIcon,
  MoreVert as MoreIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
  VisibilityOff as HideIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { getItemComments, addComment, deleteComment, toggleCommentVisibility } from '../api/comments';
import { formatDistanceToNow } from 'date-fns';

const CommentSection = ({ itemType, itemId, darkMode, isAdmin = false, initialCount = 0, onMemberClick }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const theme = useTheme();
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(initialCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);

  // Update comment count when initialCount changes
  useEffect(() => {
    setCommentCount(initialCount);
  }, [initialCount]);

  // Fetch comments when expanded
  useEffect(() => {
    if (showComments && user) {
      fetchComments();
    }
  }, [showComments, itemType, itemId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await getItemComments(itemType, itemId);
    if (!error && data) {
      setComments(data);
      // Count all comments including replies
      const totalCount = data.reduce((acc, comment) => {
        return acc + 1 + (comment.replies?.length || 0);
      }, 0);
      setCommentCount(totalCount);
    }
    setLoading(false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;
    
    if (!activeProfile) {
      console.error('No active profile selected');
      return;
    }

    setSubmitting(true);
    const { data, error } = await addComment(
      itemType,
      itemId,
      activeProfile.id,
      newComment.trim(),
      replyingTo
    );

    if (!error && data) {
      if (replyingTo) {
        // Add reply to parent comment
        setComments(prev => prev.map(comment => {
          if (comment.id === replyingTo) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data]
            };
          }
          return comment;
        }));
      } else {
        // Add new top-level comment
        setComments(prev => [data, ...prev]);
      }
      setCommentCount(prev => prev + 1);
      setNewComment('');
      setReplyingTo(null);
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId, parentId = null) => {
    const { error } = await deleteComment(commentId, itemType);
    if (!error) {
      if (parentId) {
        // Remove reply
        setComments(prev => prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.filter(r => r.id !== commentId)
            };
          }
          return comment;
        }));
      } else {
        // Remove top-level comment
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
      setCommentCount(prev => prev - 1);
    }
    handleCloseMenu();
  };

  const handleToggleVisibility = async (commentId) => {
    const comment = comments.find(c => c.id === commentId);
    const { error } = await toggleCommentVisibility(commentId, !comment.is_hidden, itemType);
    if (!error) {
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, is_hidden: !c.is_hidden } : c
      ));
    }
    handleCloseMenu();
  };

  const handleOpenMenu = (event, comment) => {
    setAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedComment(null);
  };

  // Default member click handler that opens MemberDetailsModal
  const handleDefaultMemberClick = (profile) => {
    setSelectedMember(profile);
    setShowMemberDetailsModal(true);
  };

  const CommentItem = ({ comment, isReply = false, parentId = null }) => (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        opacity: comment.is_hidden ? 0.5 : 1,
        ml: isReply ? 6 : 0,
        mb: isReply ? 1 : 2
      }}
    >
      <Avatar
        src={comment.profile?.profile_picture_url}
        onClick={() => {
          if (onMemberClick) {
            onMemberClick(comment.profile_id);
          } else if (comment.profile) {
            handleDefaultMemberClick(comment.profile);
          }
        }}
        sx={{
          width: isReply ? 28 : 32,
          height: isReply ? 28 : 32,
          bgcolor: theme.palette.primary.main,
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8
          }
        }}
      >
        {comment.profile?.full_name?.[0] || '?'}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography
            variant="body2"
            onClick={(e) => {
              if (onMemberClick) {
                onMemberClick(comment.profile_id, e);
              } else if (comment.profile) {
                handleDefaultMemberClick(comment.profile);
              }
            }}
            sx={{
              fontWeight: 500,
              color: theme.palette.text.primary,
              cursor: 'pointer',
              '&:hover': {
                color: theme.palette.primary.main,
                textDecoration: 'underline'
              },
              transition: 'color 0.2s ease'
            }}
          >
            {comment.profile?.full_name || 'Unknown User'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.75rem'
            }}
          >
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </Typography>
          {comment.is_hidden && (
            <Chip
              label="Hidden"
              size="small"
              sx={{ height: 16, fontSize: '0.65rem' }}
            />
          )}
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.primary,
            mb: 0.5,
            fontSize: '0.875rem',
            lineHeight: 1.5
          }}
        >
          {comment.content}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isReply && (
            <Button
              size="small"
              startIcon={<ReplyIcon sx={{ fontSize: 14 }} />}
              onClick={() => setReplyingTo(comment.id)}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                minWidth: 'auto',
                py: 0,
                '&:hover': {
                  bgcolor: 'transparent',
                  color: theme.palette.primary.main
                }
              }}
            >
              Reply
            </Button>
          )}
          {(user?.id === comment.profile_id || isAdmin) && (
            <IconButton
              size="small"
              onClick={(e) => handleOpenMenu(e, comment)}
              sx={{
                p: 0.5,
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary
                }
              }}
            >
              <MoreIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ mt: 2 }}>
      {/* Subtle comment toggle */}
      <Button
        startIcon={<CommentIcon sx={{ fontSize: 18 }} />}
        onClick={() => setShowComments(!showComments)}
        sx={{
          textTransform: 'none',
          color: theme.palette.text.secondary,
          fontSize: '0.875rem',
          py: 0.5,
          px: 1,
          minHeight: 'auto',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main
          }
        }}
      >
        {commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : t('dashboard.comment')}
      </Button>

      {/* Comments section */}
      <Collapse in={showComments}>
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: darkMode 
              ? alpha(theme.palette.background.paper, 0.3)
              : alpha(theme.palette.background.paper, 0.5),
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          {/* Comment input */}
          {user && (
            <Box sx={{ mb: 2 }}>
              {replyingTo && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                    p: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderRadius: 1
                  }}
                >
                  <Typography variant="caption" color="primary">
                    Replying to comment
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setReplyingTo(null)}
                    sx={{ p: 0.25 }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Avatar
                  src={user.profile_picture_url}
                  sx={{ width: 32, height: 32 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  disabled={submitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem',
                      bgcolor: theme.palette.background.paper,
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.2)
                      }
                    }
                  }}
                />
                <IconButton
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  sx={{
                    color: theme.palette.primary.main,
                    '&:disabled': {
                      color: theme.palette.action.disabled
                    }
                  }}
                >
                  {submitting ? <Spinner size={40} /> : <SendIcon />}
                </IconButton>
              </Box>
            </Box>
          )}

          <Divider sx={{ mb: 2, borderColor: alpha(theme.palette.divider, 0.1) }} />

          {/* Comments list */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Spinner size={48} />
            </Box>
          ) : comments.length === 0 ? (
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: theme.palette.text.secondary,
                py: 2
              }}
            >
              No comments yet. Be the first to comment!
            </Typography>
          ) : (
            <Box>
              {comments.map(comment => (
                <Fade in key={comment.id}>
                  <Box>
                    <CommentItem comment={comment} />
                    {/* Replies */}
                    {comment.replies?.map(reply => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        isReply
                        parentId={comment.id}
                      />
                    ))}
                  </Box>
                </Fade>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            boxShadow: theme.shadows[2]
          }
        }}
      >
        {user?.id === selectedComment?.profile_id && (
          <MenuItem
            onClick={() => handleDeleteComment(selectedComment.id, selectedComment.parent_comment_id)}
            sx={{ fontSize: '0.875rem' }}
          >
            <DeleteIcon sx={{ fontSize: 18, mr: 1 }} />
            Delete
          </MenuItem>
        )}
        {isAdmin && (
          <MenuItem
            onClick={() => handleToggleVisibility(selectedComment?.id)}
            sx={{ fontSize: '0.875rem' }}
          >
            <HideIcon sx={{ fontSize: 18, mr: 1 }} />
            {selectedComment?.is_hidden ? 'Unhide' : 'Hide'}
          </MenuItem>
        )}
      </Menu>

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal
          open={showMemberDetailsModal}
          onClose={() => {
            setShowMemberDetailsModal(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          darkMode={darkMode}
        />
      )}
    </Box>
  );
};

export default CommentSection;