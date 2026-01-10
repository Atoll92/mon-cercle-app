import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as FeaturedIcon,
  StarBorder as UnfeaturedIcon,
  Visibility as PublishedIcon,
  VisibilityOff as DraftIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  Collections as GalleryIcon
} from '@mui/icons-material';
import {
  fetchBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  toggleFeaturedPost
} from '../../../api/blog';
import MediaUpload from '../../MediaUpload';
import LazyImage from '../../LazyImage';
import { useTranslation } from '../../../hooks/useTranslation';

const BlogPostsTab = ({ network, activeProfile }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const themeColor = network?.theme_color || theme.palette.primary.main;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_published: true,
    is_featured: false,
    media_items: []
  });

  // Load posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBlogPosts(network.id, { includeUnpublished: true });
      setPosts(data);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (network?.id) {
      loadPosts();
    }
  }, [network?.id]);

  // Listen for create post event from sidebar
  useEffect(() => {
    const handleCreatePost = () => {
      handleNewPost();
    };

    window.addEventListener('blog-create-post', handleCreatePost);
    return () => window.removeEventListener('blog-create-post', handleCreatePost);
  }, []);

  // Handle menu
  const handleMenuOpen = (event, post) => {
    setMenuAnchor(event.currentTarget);
    setSelectedPost(post);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedPost(null);
  };

  // Handle edit
  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      content: post.content || '',
      is_published: post.is_published,
      is_featured: post.is_featured,
      media_items: post.media_metadata?.media_items || (post.media_url ? [{
        url: post.media_url,
        type: post.media_type,
        metadata: post.media_metadata
      }] : [])
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  // Handle new post
  const handleNewPost = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      is_published: true,
      is_featured: false,
      media_items: []
    });
    setEditDialogOpen(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);

      const postData = {
        network_id: network.id,
        title: formData.title,
        content: formData.content,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        media_items: formData.media_items,
        created_by: activeProfile.id
      };

      if (editingPost) {
        await updateBlogPost(editingPost.id, postData);
      } else {
        await createBlogPost(postData);
      }

      setEditDialogOpen(false);
      loadPosts();
    } catch (err) {
      console.error('Error saving post:', err);
      setError('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteBlogPost(postToDelete.id);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      loadPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  };

  // Handle feature toggle
  const handleToggleFeatured = async (post) => {
    try {
      await toggleFeaturedPost(post.id, !post.is_featured);
      loadPosts();
    } catch (err) {
      console.error('Error toggling featured:', err);
    }
    handleMenuClose();
  };

  // Handle media upload
  const handleMediaUploaded = (uploadedItems) => {
    // Ensure uploadedItems is always an array
    const items = Array.isArray(uploadedItems) ? uploadedItems : [uploadedItems];
    setFormData(prev => ({
      ...prev,
      media_items: [...prev.media_items, ...items]
    }));
  };

  const handleRemoveMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      media_items: prev.media_items.filter((_, i) => i !== index)
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          {t('admin.blog.posts.title', 'Blog Posts')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewPost}
          sx={{
            bgcolor: themeColor,
            '&:hover': { bgcolor: alpha(themeColor, 0.9) }
          }}
        >
          {t('admin.blog.posts.newPost', 'New Post')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Posts List */}
      {posts.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {posts.map((post) => (
            <Card
              key={post.id}
              elevation={0}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: alpha(themeColor, 0.3),
                  boxShadow: `0 4px 12px ${alpha(themeColor, 0.08)}`
                }
              }}
            >
              {/* Media Preview */}
              {post.media_url && (
                <Box
                  sx={{
                    position: 'relative',
                    width: { xs: '100%', sm: 160 },
                    minWidth: { sm: 160 },
                    height: { xs: 120, sm: 100 },
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100'
                  }}
                >
                  {post.media_type === 'image' ? (
                    <LazyImage
                      src={post.media_url}
                      alt={post.title}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100'
                      }}
                    >
                      {post.media_type === 'video' && <VideoIcon sx={{ fontSize: 36, color: 'grey.500' }} />}
                      {post.media_type === 'audio' && <AudioIcon sx={{ fontSize: 36, color: 'grey.500' }} />}
                      {post.media_type === 'pdf' && <PdfIcon sx={{ fontSize: 36, color: 'error.main' }} />}
                    </Box>
                  )}
                  {/* Multiple media indicator */}
                  {post.media_metadata?.media_items?.length > 1 && (
                    <Chip
                      icon={<GalleryIcon sx={{ fontSize: 12 }} />}
                      label={post.media_metadata.media_items.length}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        height: 20,
                        '& .MuiChip-label': { px: 0.5, fontSize: '0.7rem' }
                      }}
                    />
                  )}
                </Box>
              )}

              {/* Content */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <CardContent sx={{ flex: 1, py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  {/* Header row with title and actions */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3
                      }}
                    >
                      {post.title || t('admin.blog.posts.noTitle', '(No title)')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(post)}
                        sx={{
                          bgcolor: alpha(themeColor, 0.08),
                          '&:hover': { bgcolor: alpha(themeColor, 0.15) }
                        }}
                      >
                        <EditIcon sx={{ fontSize: 18, color: themeColor }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, post)}
                      >
                        <MoreIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Content Preview */}
                  {post.content && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8rem'
                      }}
                    >
                      {post.content.replace(/<[^>]*>/g, '').substring(0, 120)}
                    </Typography>
                  )}

                  {/* Footer with status and meta */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    {/* Status Chips */}
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {post.is_featured && (
                        <Chip
                          icon={<FeaturedIcon sx={{ fontSize: 12 }} />}
                          label={t('admin.blog.posts.featured', 'Featured')}
                          size="small"
                          sx={{
                            height: 20,
                            bgcolor: alpha(themeColor, 0.1),
                            color: themeColor,
                            '& .MuiChip-label': { px: 0.5, fontSize: '0.7rem' },
                            '& .MuiChip-icon': { ml: 0.5 }
                          }}
                        />
                      )}
                      <Chip
                        label={post.is_published ? t('admin.blog.posts.published', 'Published') : t('admin.blog.posts.draft', 'Draft')}
                        size="small"
                        sx={{
                          height: 20,
                          bgcolor: post.is_published ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
                          color: post.is_published ? 'success.main' : 'text.secondary',
                          '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' }
                        }}
                      />
                    </Box>

                    {/* Meta */}
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {formatDate(post.published_at || post.created_at)} • {post.view_count || 0} {t('admin.blog.posts.views', 'views')}
                    </Typography>
                  </Box>
                </CardContent>
              </Box>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('admin.blog.posts.noPosts', 'No posts yet')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('admin.blog.posts.noPostsDescription', 'Create your first blog post to get started')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewPost}
            sx={{
              bgcolor: themeColor,
              '&:hover': { bgcolor: alpha(themeColor, 0.9) }
            }}
          >
            {t('admin.blog.posts.createFirstPost', 'Create First Post')}
          </Button>
        </Box>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleToggleFeatured(selectedPost)}>
          {selectedPost?.is_featured ? (
            <>
              <UnfeaturedIcon sx={{ mr: 1 }} /> {t('admin.blog.posts.removeFeatured', 'Remove Featured')}
            </>
          ) : (
            <>
              <FeaturedIcon sx={{ mr: 1 }} /> {t('admin.blog.posts.setAsFeatured', 'Set as Featured')}
            </>
          )}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setPostToDelete(selectedPost);
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> {t('admin.blog.posts.delete', 'Delete')}
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPost ? t('admin.blog.posts.editPost', 'Edit Post') : t('admin.blog.posts.newPost', 'New Post')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label={t('admin.blog.posts.form.title', 'Title')}
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              sx={{ mb: 3 }}
            />

            <TextField
              label={t('admin.blog.posts.form.content', 'Content')}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              multiline
              rows={6}
              fullWidth
              sx={{ mb: 3 }}
            />

            {/* Media Upload */}
            <Typography variant="subtitle2" gutterBottom>
              {t('admin.blog.posts.form.media', 'Media')}
            </Typography>
            <MediaUpload
              onUpload={handleMediaUploaded}
              maxFiles={10}
              autoUpload={true}
              allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
              bucket="networks"
              path={`blog/${network.id}`}
            />

            {/* Media Preview */}
            {formData.media_items.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {formData.media_items.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      width: 100,
                      height: 100,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {item.type === 'image' ? (
                      <LazyImage
                        src={item.url}
                        alt=""
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.100'
                        }}
                      >
                        {item.type === 'video' && <VideoIcon sx={{ fontSize: 32, color: 'grey.500' }} />}
                        {item.type === 'audio' && <AudioIcon sx={{ fontSize: 32, color: 'grey.500' }} />}
                        {item.type === 'pdf' && <PdfIcon sx={{ fontSize: 32, color: 'error.main' }} />}
                      </Box>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveMedia(index)}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {/* Options */}
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_published}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  />
                }
                label={t('admin.blog.posts.form.publishImmediately', 'Publish immediately')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  />
                }
                label={t('admin.blog.posts.form.featureThisPost', 'Feature this post')}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>{t('admin.blog.posts.form.cancel', 'Cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: themeColor,
              '&:hover': { bgcolor: alpha(themeColor, 0.9) }
            }}
          >
            {saving ? <CircularProgress size={20} /> : (editingPost ? t('admin.blog.posts.form.saveChanges', 'Save Changes') : t('admin.blog.posts.form.createPost', 'Create Post'))}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('admin.blog.posts.deletePost', 'Delete Post?')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admin.blog.posts.deletePostConfirm', 'Are you sure you want to delete "{{title}}"? This action cannot be undone.', { title: postToDelete?.title || t('admin.blog.posts.noTitle', '(No title)') })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('admin.blog.posts.form.cancel', 'Cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            {t('admin.blog.posts.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlogPostsTab;
