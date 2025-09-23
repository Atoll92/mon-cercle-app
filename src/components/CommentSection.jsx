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

const CommentSection = ({ itemType, itemId, darkMode, initialCount = 0, onMemberClick, defaultExpanded = false, TopRightElement }) => {
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

  // Helper function to count all comments in nested structure
  const countAllComments = (comments) => {
    return comments.reduce((total, comment) => {
      let count = 1; // Count the comment itself
      if (comment.replies && comment.replies.length > 0) {
        count += countAllComments(comment.replies); // Recursively count replies
      }
      return total + count;
    }, 0);
  };

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await getItemComments(itemType, itemId);
    if (!error && data) {
      setComments(data);
      // Count all comments including nested replies
      const totalCount = countAllComments(data);
      setCommentCount(totalCount);
    }
    setLoading(false);
  };

  // Helper function to add reply to nested comment structure
  const addReplyToTree = (comments, parentId, newReply) => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToTree(comment.replies, parentId, newReply)
        };
      }
      return comment;
    });
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
        // Add reply to nested structure
        setComments(prev => addReplyToTree(prev, replyingTo, data));
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

  // Helper function to remove comment from nested structure
  const removeCommentFromTree = (comments, commentId) => {
    return comments.reduce((acc, comment) => {
      if (comment.id === commentId) {
        // Skip this comment (delete it)
        return acc;
      }
      
      if (comment.replies && comment.replies.length > 0) {
        const filteredReplies = removeCommentFromTree(comment.replies, commentId);
        acc.push({
          ...comment,
          replies: filteredReplies
        });
      } else {
        acc.push(comment);
      }
      return acc;
    }, []);
  };

  const handleDeleteComment = async (commentId, parentId = null) => {
    const { error } = await deleteComment(commentId);
    if (!error) {
      setComments(prev => removeCommentFromTree(prev, commentId));
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

  // Helper function to update comment in nested structure
  const updateCommentInTree = (comments, commentId, updatedComment) => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return { ...updatedComment, replies: comment.replies };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updatedComment)
        };
      }
      return comment;
    });
  };

  const handleEditComment = async (commentId, newContent) => {
    const { data, error } = await updateComment(commentId, newContent);
    if (!error && data) {
      setComments(prev => updateCommentInTree(prev, commentId, data));
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

  const CommentItem = React.memo(({ comment, depth = 0, parentId = null, onOpenMenu }) => {
    const [localEditContent, setLocalEditContent] = useState(comment.content);
    const [showReplies, setShowReplies] = useState(true);
    const isEditing = editingComment === comment.id;
    const editFieldRef = useRef(null);
    const isReply = depth > 0;
    const maxDepth = 6; // Maximum depth before collapsing
    const shouldCollapse = depth >= maxDepth;

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

    const getThreadLineColor = () => {
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.success.main
      ];
      return colors[depth % colors.length];
    };

    return (
      <>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            opacity: comment.is_hidden ? 0.5 : 1,
            ml: depth * 3, // Progressive indentation
            mb: 1.5,
            position: 'relative',
            '&::before': isReply ? {
              content: '""',
              position: 'absolute',
              left: -16,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: alpha(getThreadLineColor(), 0.3),
              borderRadius: 1
            } : undefined
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
              width: Math.max(24, 32 - depth * 2), // Smaller avatars for deeper threads
              height: Math.max(24, 32 - depth * 2),
              bgcolor: getThreadLineColor(),
              cursor: 'pointer',
              fontSize: depth > 2 ? '0.75rem' : '1rem',
              border: isReply ? `2px solid ${alpha(getThreadLineColor(), 0.2)}` : 'none',
              '&:hover': {
                opacity: 0.8,
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
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
              {(activeProfile?.id === comment.profile_id) && (
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
                  sx={{ height: 16, fontSize: '0.65rem', ml: comment.is_hidden && !(activeProfile?.id === comment.profile_id) ? 'auto' : 0 }}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
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
                    color: getThreadLineColor()
                  }
                }}
              >
                Reply
              </Button>
              
              {comment.replies && comment.replies.length > 0 && (
                <Button
                  size="small"
                  onClick={() => setShowReplies(!showReplies)}
                  sx={{
                    textTransform: 'none',
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    py: 0,
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: getThreadLineColor()
                    }
                  }}
                >
                  {showReplies ? '▼' : '▶'} {comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      {/* Reply input field - shown directly below the comment being replied to */}
      {replyingTo === comment.id && user && (
        <Box
          sx={{
            ml: (depth + 1) * 3,
            mb: 2,
            display: 'flex',
            gap: 1,
            mt: 1,
            p: 1.5,
            bgcolor: alpha(getThreadLineColor(), 0.05),
            borderRadius: 1,
            border: `1px solid ${alpha(getThreadLineColor(), 0.2)}`
          }}
        >
          <Avatar
            src={activeProfile?.profile_picture_url || user.profile_picture_url}
            sx={{ 
              width: 28, 
              height: 28,
              bgcolor: getThreadLineColor(),
              border: `2px solid ${alpha(getThreadLineColor(), 0.3)}`
            }}
          >
            {activeProfile?.full_name?.[0] || user?.full_name?.[0] || '?'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1
              }}
            >
              <Typography variant="caption" sx={{ color: getThreadLineColor(), fontWeight: 500 }}>
                Replying to {comment.profile?.full_name || 'Unknown User'}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setReplyingTo(null)}
                sx={{ 
                  p: 0.25,
                  color: theme.palette.text.secondary,
                  '&:hover': { color: getThreadLineColor() }
                }}
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
                      borderColor: alpha(getThreadLineColor(), 0.3)
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(getThreadLineColor(), 0.5)
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: getThreadLineColor()
                    }
                  }
                }}
              />
              <IconButton
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                sx={{
                  color: getThreadLineColor(),
                  '&:disabled': {
                    color: theme.palette.action.disabled
                  },
                  '&:hover': {
                    bgcolor: alpha(getThreadLineColor(), 0.1)
                  }
                }}
              >
                {submitting ? <Spinner size={20} /> : <SendIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Render nested replies with unlimited depth */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <Collapse in={showReplies}>
          <Box sx={{ mt: 1 }}>
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                parentId={comment.id}
                onOpenMenu={onOpenMenu}
              />
            ))}
          </Box>
        </Collapse>
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
      
      {/* Header with button to open comments, comment count and optional top-right element */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
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
        {TopRightElement && (
          <Box>
            {TopRightElement}
          </Box>
        )}
      </Box>
      

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
                    <CommentItem 
                      comment={comment} 
                      depth={0}
                      onOpenMenu={handleOpenMenuCallback} 
                    />
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