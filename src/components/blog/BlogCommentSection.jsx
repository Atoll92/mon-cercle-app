import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
  Paper,
  IconButton,
  Collapse,
  CircularProgress,
  Divider,
  alpha
} from '@mui/material';
import {
  Reply as ReplyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
  Check as ApprovedIcon
} from '@mui/icons-material';
import {
  fetchBlogComments,
  addBlogComment,
  getBlogCommentCount
} from '../../api/blog';
import { getBrowserLanguage, createTranslator } from '../../utils/publicTranslation';

// Single Comment Item
const CommentItem = ({
  comment,
  depth = 0,
  blogSettings,
  themeColor,
  onReply,
  t,
  language
}) => {
  const [showReplies, setShowReplies] = useState(depth < 2);
  const hasReplies = comment.replies && comment.replies.length > 0;

  // Format date based on language
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('publicBlog.comments.justNow');
    if (diffMins < 60) return t('publicBlog.comments.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('publicBlog.comments.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('publicBlog.comments.daysAgo', { count: diffDays });
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale);
  };

  // Get author name
  const authorName = comment.profile?.full_name || comment.author_name || 'Anonymous';
  const authorAvatar = comment.profile?.profile_picture_url;

  // Calculate indent
  const maxDepth = 4;
  const effectiveDepth = Math.min(depth, maxDepth);
  const indent = effectiveDepth * 24;

  return (
    <Box sx={{ ml: `${indent}px` }}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          py: 2,
          borderLeft: depth > 0 ? `2px solid ${alpha(themeColor, 0.2)}` : 'none',
          pl: depth > 0 ? 2 : 0
        }}
      >
        {/* Avatar */}
        <Avatar
          src={authorAvatar}
          sx={{
            width: 36,
            height: 36,
            bgcolor: alpha(themeColor, 0.2),
            color: themeColor,
            fontSize: '0.9rem'
          }}
        >
          {authorName[0]?.toUpperCase()}
        </Avatar>

        {/* Content */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {authorName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(comment.created_at)}
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            {comment.content}
          </Typography>

          {/* Reply button */}
          {blogSettings.comments_enabled && (
            <Button
              size="small"
              startIcon={<ReplyIcon sx={{ fontSize: 16 }} />}
              onClick={() => onReply(comment)}
              sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
            >
              {t('publicBlog.comments.reply')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Replies toggle */}
      {hasReplies && (
        <>
          <Button
            size="small"
            onClick={() => setShowReplies(!showReplies)}
            startIcon={showReplies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ ml: indent + 52, color: 'text.secondary', fontSize: '0.75rem' }}
          >
            {showReplies ? t('publicBlog.comments.hideReplies') : t('publicBlog.comments.showReplies')} {comment.replies.length} {comment.replies.length === 1 ? t('publicBlog.comments.reply_one') : t('publicBlog.comments.reply_other')}
          </Button>

          <Collapse in={showReplies}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                blogSettings={blogSettings}
                themeColor={themeColor}
                onReply={onReply}
                t={t}
                language={language}
              />
            ))}
          </Collapse>
        </>
      )}
    </Box>
  );
};

// Comment Form
const CommentForm = ({
  postId,
  parentComment,
  blogSettings,
  themeColor,
  onCancel,
  onCommentAdded,
  t
}) => {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError(t('publicBlog.comments.errorEmptyComment'));
      return;
    }

    if (blogSettings.anonymous_comments && !authorName.trim()) {
      setError(t('publicBlog.comments.errorEmptyName'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await addBlogComment({
        post_id: postId,
        content: content.trim(),
        author_name: authorName.trim() || null,
        author_email: authorEmail.trim() || null,
        parent_comment_id: parentComment?.id || null
      });

      setSuccess(true);
      setContent('');
      setAuthorName('');
      setAuthorEmail('');

      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(t('publicBlog.comments.errorFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert
        severity="success"
        sx={{ mb: 2 }}
        onClose={() => {
          setSuccess(false);
          if (onCancel) onCancel();
        }}
      >
        {blogSettings.comment_moderation
          ? t('publicBlog.comments.successModerated')
          : t('publicBlog.comments.successPosted')}
      </Alert>
    );
  }

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: alpha(themeColor, 0.02)
      }}
    >
      {parentComment && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {t('publicBlog.comments.replyingTo')}{' '}
            <strong>{parentComment.profile?.full_name || parentComment.author_name || t('publicBlog.comments.anonymous')}</strong>
          </Typography>
          <Button size="small" onClick={onCancel} sx={{ ml: 1 }}>
            {t('publicBlog.comments.cancel')}
          </Button>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Anonymous user fields */}
      {blogSettings.anonymous_comments && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label={t('publicBlog.comments.name')}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            size="small"
            required
            sx={{ flex: 1 }}
          />
          <TextField
            label={t('publicBlog.comments.emailOptional')}
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            helperText={t('publicBlog.comments.emailNotPublic')}
          />
        </Box>
      )}

      <TextField
        placeholder={parentComment ? t('publicBlog.comments.writeReply') : t('publicBlog.comments.writeComment')}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        multiline
        rows={3}
        fullWidth
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {blogSettings.comment_moderation && (
          <Typography variant="caption" color="text.secondary">
            <TimeIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
            {t('publicBlog.comments.commentsRequireApproval')}
          </Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: themeColor,
            '&:hover': { bgcolor: alpha(themeColor, 0.9) },
            ml: 'auto'
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : t('publicBlog.comments.postComment')}
        </Button>
      </Box>
    </Paper>
  );
};

// Main Comment Section
const BlogCommentSection = ({ postId, blogSettings, themeColor, language: propLanguage }) => {
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);

  // Use provided language or detect from browser
  const language = propLanguage || getBrowserLanguage();
  const t = useMemo(() => createTranslator(language), [language]);

  // Load comments
  const loadComments = async () => {
    try {
      setLoading(true);
      const [commentsData, count] = await Promise.all([
        fetchBlogComments(postId),
        getBlogCommentCount(postId)
      ]);
      setComments(commentsData);
      setCommentCount(count);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const handleReply = (comment) => {
    setReplyingTo(comment);
  };

  const handleCommentAdded = () => {
    // Reload comments after new comment
    // Note: If moderation is on, the new comment won't appear until approved
    if (!blogSettings.comment_moderation) {
      loadComments();
    }
    setReplyingTo(null);
  };

  if (!blogSettings.comments_enabled) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        {commentCount > 0
          ? t('publicBlog.comments.titleWithCount', { count: commentCount })
          : t('publicBlog.comments.title')}
      </Typography>

      {/* Main comment form */}
      {!replyingTo && (
        <CommentForm
          postId={postId}
          blogSettings={blogSettings}
          themeColor={themeColor}
          onCommentAdded={handleCommentAdded}
          t={t}
        />
      )}

      {/* Reply form */}
      {replyingTo && (
        <CommentForm
          postId={postId}
          parentComment={replyingTo}
          blogSettings={blogSettings}
          themeColor={themeColor}
          onCancel={() => setReplyingTo(null)}
          onCommentAdded={handleCommentAdded}
          t={t}
        />
      )}

      {/* Comments list */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={30} />
        </Box>
      ) : comments.length > 0 ? (
        <Box sx={{ mt: 3 }}>
          {comments.map((comment) => (
            <React.Fragment key={comment.id}>
              <CommentItem
                comment={comment}
                blogSettings={blogSettings}
                themeColor={themeColor}
                onReply={handleReply}
                t={t}
                language={language}
              />
              <Divider sx={{ my: 1 }} />
            </React.Fragment>
          ))}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {t('publicBlog.comments.noComments')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BlogCommentSection;
