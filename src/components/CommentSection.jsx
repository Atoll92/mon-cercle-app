import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useTranslation } from '../hooks/useTranslation';
import UserContent from './UserContent';
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
  Edit as EditIcon,
  VisibilityOff as HideIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { getItemComments, addComment, updateComment, deleteComment, toggleCommentVisibility } from '../api/comments';
import { formatTimeAgo } from '../utils/dateFormatting';

const CommentSection = ({ itemType, itemId, darkMode, isAdmin = false, initialCount = 0, onMemberClick, defaultExpanded = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const theme = useTheme();
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(initialCount);
  const [showComments, setShowComments] = useState(defaultExpanded);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

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
    const { error } = await deleteComment(commentId);
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
    const { error } = await toggleCommentVisibility(commentId, !comment.is_hidden);
    if (!error) {
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, is_hidden: !c.is_hidden } : c
      ));
    }
    handleCloseMenu();
  };

  const handleOpenMenu = (event, comment) => {
    event.stopPropagation();
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom,
      left: rect.left
    });
    setSelectedComment(comment);
  };

  const handleCloseMenu = () => {
    setMenuPosition(null);
    setSelectedComment(null);
  };

  const handleEditComment = async (commentId, newContent) => {
    const { data, error } = await updateComment(commentId, newContent);
    if (!error && data) {
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return { ...data, replies: comment.replies };
        }
        // Check if it's a reply being edited
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === commentId ? data : reply
            )
          };
        }
        return comment;
      }));
      setEditingComment(null);
      setEditContent('');
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
    handleCloseMenu();
  };

  // Default member click handler that opens MemberDetailsModal
  const handleDefaultMemberClick = (profile) => {
    setSelectedMember(profile);
    setShowMemberDetailsModal(true);
  };

  const handleOpenMenuCallback = useCallback((event, comment) => {
    handleOpenMenu(event, comment);
  }, []);

  const CommentItem = React.memo(({ comment, isReply = false, parentId = null, onOpenMenu }) => {
    const [localEditContent, setLocalEditContent] = useState(comment.content);
    const isEditing = editingComment === comment.id;
    const editFieldRef = useRef(null);

    useEffect(() => {
      if (isEditing && editContent === '') {
        // Only set initial content when starting to edit
        setLocalEditContent(comment.content);
        // Set cursor to end of content after render
        setTimeout(() => {
          if (editFieldRef.current) {
            const input = editFieldRef.current.querySelector('textarea');
            if (input) {
              input.focus();
              input.setSelectionRange(input.value.length, input.value.length);
            }
          }
        }, 0);
      }
    }, [isEditing]);

    const handleLocalEdit = (e) => {
      setLocalEditContent(e.target.value);
    };

    return (
      <>
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
                {formatTimeAgo(comment.created_at)}
              </Typography>
              {comment.edited_at && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.7rem',
                    fontStyle: 'italic'
                  }}
                >
                  (edited)
                </Typography>
              )}
              {(activeProfile?.id === comment.profile_id || isAdmin) && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMenu(e, comment);
                  }}
                  sx={{
                    p: 0.25,
                    ml: 'auto',
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: theme.palette.text.primary
                    }
                  }}
                >
                  <MoreIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              {comment.is_hidden && (
                <Chip
                  label="Hidden"
                  size="small"
                  sx={{ height: 16, fontSize: '0.65rem', ml: comment.is_hidden && !((activeProfile?.id === comment.profile_id || isAdmin)) ? 'auto' : 0 }}
                />
              )}
            </Box>
            {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  ref={editFieldRef}
                  fullWidth
                  size="small"
                  multiline
                  value={localEditContent}
                  onChange={handleLocalEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (localEditContent.trim()) {
                        handleEditComment(comment.id, localEditContent);
                      }
                    }
                    if (e.key === 'Escape') {
                      setEditingComment(null);
                      setEditContent('');
                    }
                  }}
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem',
                      bgcolor: theme.palette.background.paper
                    }
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleEditComment(comment.id, localEditContent)}
                  disabled={!localEditContent.trim()}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent('');
                  }}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            ) : (
              <UserContent
                content={comment.content}
                component="div"
                maxLines={3}
                sx={{
                  color: theme.palette.text.primary,
                  mb: 0.5,
                  fontSize: '0.875rem',
                  lineHeight: 1.5
                }}
              />
            )}
            {!isReply && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              </Box>
            )}
          </Box>
        </Box>
      {/* Reply input field - shown directly below the comment being replied to */}
      {replyingTo === comment.id && user && (
        <Box
          sx={{
            ml: isReply ? 6 : 4,
            mb: 2,
            display: 'flex',
            gap: 1
          }}
        >
          <Avatar
            src={user.profile_picture_url}
            sx={{ width: 28, height: 28 }}
          />
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1
              }}
            >
              <Typography variant="caption" color="primary">
                Replying to {comment.profile?.full_name || 'Unknown User'}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setReplyingTo(null)}
                sx={{ p: 0.25 }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Write a reply..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                disabled={submitting}
                autoFocus
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
                {submitting ? <Spinner size={20} /> : <SendIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}
    </>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary rerenders
    // Only rerender if the comment data, edit state, or reply state changes
    return (
      prevProps.comment.id === nextProps.comment.id &&
      prevProps.comment.content === nextProps.comment.content &&
      prevProps.comment.edited_at === nextProps.comment.edited_at &&
      prevProps.comment.is_hidden === nextProps.comment.is_hidden &&
      prevProps.isReply === nextProps.isReply &&
      prevProps.parentId === nextProps.parentId
    );
  });

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
          {/* Top-level comment input */}
          {user && !replyingTo && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Avatar
                  src={user.profile_picture_url}
                  sx={{ width: 32, height: 32 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Write a comment..."
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
                    <CommentItem comment={comment} onOpenMenu={handleOpenMenuCallback} />
                    {/* Replies */}
                    {comment.replies?.map(reply => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        isReply
                        parentId={comment.id}
                        onOpenMenu={handleOpenMenuCallback}
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
        open={Boolean(menuPosition)}
        onClose={handleCloseMenu}
        anchorReference="anchorPosition"
        anchorPosition={menuPosition}
        sx={{
          '& .MuiPaper-root': {
            boxShadow: theme.shadows[2]
          }
        }}
      >
        {activeProfile?.id === selectedComment?.profile_id && (
          <MenuItem
            onClick={() => startEditing(selectedComment)}
            sx={{ fontSize: '0.875rem' }}
          >
            <EditIcon sx={{ fontSize: 18, mr: 1 }} />
            Edit
          </MenuItem>
        )}
        {activeProfile?.id === selectedComment?.profile_id && (
          <MenuItem
            onClick={() => handleDeleteComment(selectedComment.id, selectedComment.parent_comment_id)}
            sx={{ fontSize: '0.875rem' }}
          >
            <DeleteIcon sx={{ fontSize: 18, mr: 1 }} />
            Delete
          </MenuItem>
        )}
        {/* Hide functionality not implemented yet
        {isAdmin && (
          <MenuItem
            onClick={() => handleToggleVisibility(selectedComment?.id)}
            sx={{ fontSize: '0.875rem' }}
          >
            <HideIcon sx={{ fontSize: 18, mr: 1 }} />
            {selectedComment?.is_hidden ? 'Unhide' : 'Hide'}
          </MenuItem>
        )}
        */}
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