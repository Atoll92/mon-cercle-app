import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha
} from '@mui/material';
import {
  Save as SaveIcon,
  Language as DomainIcon,
  Comment as CommentsIcon,
  Email as NewsletterIcon,
  RssFeed as RssIcon,
  Search as SeoIcon,
  Share as SocialIcon,
  Info as AboutIcon,
  Transform as ConvertIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { updateBlogSettings, convertBlogToNetwork } from '../../../api/blog';

const SettingSection = ({ title, icon: Icon, children }) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Icon sx={{ color: 'text.secondary' }} />
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );
};

const BlogSettingsTab = ({ network, activeProfile, onNetworkUpdate }) => {
  const theme = useTheme();
  const themeColor = network?.theme_color || theme.palette.primary.main;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Blog settings
    comments_enabled: true,
    comment_moderation: true,
    anonymous_comments: true,
    newsletter_enabled: true,
    rss_enabled: true,
    about_page_content: '',
    social_links: {
      twitter: '',
      linkedin: '',
      instagram: '',
      website: ''
    },
    // SEO settings
    meta_title: '',
    meta_description: '',
    og_image_url: '',
    // Domain settings
    custom_domain: ''
  });

  // Load current settings
  useEffect(() => {
    if (network) {
      const blogSettings = network.blog_settings || {};
      const seoSettings = network.seo_settings || {};

      setSettings({
        comments_enabled: blogSettings.comments_enabled !== false,
        comment_moderation: blogSettings.comment_moderation !== false,
        anonymous_comments: blogSettings.anonymous_comments !== false,
        newsletter_enabled: blogSettings.newsletter_enabled !== false,
        rss_enabled: blogSettings.rss_enabled !== false,
        about_page_content: blogSettings.about_page_content || '',
        social_links: {
          twitter: blogSettings.social_links?.twitter || '',
          linkedin: blogSettings.social_links?.linkedin || '',
          instagram: blogSettings.social_links?.instagram || '',
          website: blogSettings.social_links?.website || ''
        },
        meta_title: seoSettings.meta_title || '',
        meta_description: seoSettings.meta_description || '',
        og_image_url: seoSettings.og_image_url || '',
        custom_domain: network.custom_domain || ''
      });
    }
  }, [network]);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await updateBlogSettings(network.id, {
        blog_settings: {
          comments_enabled: settings.comments_enabled,
          comment_moderation: settings.comment_moderation,
          anonymous_comments: settings.anonymous_comments,
          newsletter_enabled: settings.newsletter_enabled,
          rss_enabled: settings.rss_enabled,
          about_page_content: settings.about_page_content,
          social_links: settings.social_links
        },
        seo_settings: {
          meta_title: settings.meta_title,
          meta_description: settings.meta_description,
          og_image_url: settings.og_image_url
        },
        custom_domain: settings.custom_domain || null
      });

      setSuccess('Settings saved successfully');

      if (onNetworkUpdate) {
        onNetworkUpdate();
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle convert to network
  const handleConvert = async () => {
    try {
      setConverting(true);
      await convertBlogToNetwork(network.id);
      setConvertDialogOpen(false);

      if (onNetworkUpdate) {
        onNetworkUpdate();
      }

      // Redirect to network admin
      window.location.href = `/network/${network.id}/admin`;
    } catch (err) {
      console.error('Error converting blog:', err);
      setError('Failed to convert blog to network');
    } finally {
      setConverting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Blog Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Configure your blog's features and appearance
      </Typography>

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

      {/* Comments Section */}
      <SettingSection title="Comments" icon={CommentsIcon}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.comments_enabled}
              onChange={(e) => setSettings(prev => ({ ...prev, comments_enabled: e.target.checked }))}
            />
          }
          label="Enable comments on posts"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.comment_moderation}
              onChange={(e) => setSettings(prev => ({ ...prev, comment_moderation: e.target.checked }))}
              disabled={!settings.comments_enabled}
            />
          }
          label="Require comment approval before publishing"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.anonymous_comments}
              onChange={(e) => setSettings(prev => ({ ...prev, anonymous_comments: e.target.checked }))}
              disabled={!settings.comments_enabled}
            />
          }
          label="Allow anonymous comments (visitors without accounts)"
        />
      </SettingSection>

      {/* Newsletter Section */}
      <SettingSection title="Newsletter" icon={NewsletterIcon}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.newsletter_enabled}
              onChange={(e) => setSettings(prev => ({ ...prev, newsletter_enabled: e.target.checked }))}
            />
          }
          label="Show newsletter signup form"
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Collect email addresses from visitors. You can export the subscriber list from the Subscribers tab.
        </Typography>
      </SettingSection>

      {/* RSS Section */}
      <SettingSection title="RSS Feed" icon={RssIcon}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.rss_enabled}
              onChange={(e) => setSettings(prev => ({ ...prev, rss_enabled: e.target.checked }))}
            />
          }
          label="Enable RSS feed"
        />
        {settings.rss_enabled && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            RSS feed URL: <code>{import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-rss/{network.subdomain}</code>
          </Typography>
        )}
      </SettingSection>

      {/* About Section */}
      <SettingSection title="About Page" icon={AboutIcon}>
        <TextField
          label="About Content"
          value={settings.about_page_content}
          onChange={(e) => setSettings(prev => ({ ...prev, about_page_content: e.target.value }))}
          multiline
          rows={4}
          fullWidth
          placeholder="Tell visitors about yourself and your blog..."
        />
      </SettingSection>

      {/* Social Links Section */}
      <SettingSection title="Social Links" icon={SocialIcon}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Twitter URL"
            value={settings.social_links.twitter}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              social_links: { ...prev.social_links, twitter: e.target.value }
            }))}
            placeholder="https://twitter.com/yourusername"
            size="small"
          />
          <TextField
            label="LinkedIn URL"
            value={settings.social_links.linkedin}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              social_links: { ...prev.social_links, linkedin: e.target.value }
            }))}
            placeholder="https://linkedin.com/in/yourusername"
            size="small"
          />
          <TextField
            label="Instagram URL"
            value={settings.social_links.instagram}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              social_links: { ...prev.social_links, instagram: e.target.value }
            }))}
            placeholder="https://instagram.com/yourusername"
            size="small"
          />
          <TextField
            label="Website URL"
            value={settings.social_links.website}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              social_links: { ...prev.social_links, website: e.target.value }
            }))}
            placeholder="https://yourwebsite.com"
            size="small"
          />
        </Box>
      </SettingSection>

      {/* SEO Section */}
      <SettingSection title="SEO Settings" icon={SeoIcon}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Meta Title"
            value={settings.meta_title}
            onChange={(e) => setSettings(prev => ({ ...prev, meta_title: e.target.value }))}
            placeholder={network.name || 'Blog title'}
            helperText="Appears in browser tabs and search results"
            size="small"
          />
          <TextField
            label="Meta Description"
            value={settings.meta_description}
            onChange={(e) => setSettings(prev => ({ ...prev, meta_description: e.target.value }))}
            placeholder="A brief description of your blog"
            helperText="Appears in search engine results (max 160 characters)"
            multiline
            rows={2}
            size="small"
          />
          <TextField
            label="Social Share Image URL"
            value={settings.og_image_url}
            onChange={(e) => setSettings(prev => ({ ...prev, og_image_url: e.target.value }))}
            placeholder="https://example.com/image.jpg"
            helperText="Image shown when your blog is shared on social media"
            size="small"
          />
        </Box>
      </SettingSection>

      {/* Custom Domain Section */}
      <SettingSection title="Custom Domain" icon={DomainIcon}>
        <TextField
          label="Custom Domain"
          value={settings.custom_domain}
          onChange={(e) => setSettings(prev => ({ ...prev, custom_domain: e.target.value }))}
          placeholder="blog.yourdomain.com"
          helperText="Point a CNAME record to your blog's subdomain"
          fullWidth
          size="small"
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Default URL: <code>{network.subdomain}.conclav.club</code>
        </Typography>
      </SettingSection>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            bgcolor: themeColor,
            '&:hover': { bgcolor: alpha(themeColor, 0.9) }
          }}
        >
          Save Settings
        </Button>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Convert to Network */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'warning.main',
          borderRadius: 2,
          bgcolor: alpha(theme.palette.warning.main, 0.05)
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <ConvertIcon sx={{ color: 'warning.main', mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Convert to Full Network
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Transform your blog into a full community network with members, events, files, and more.
                This action cannot be undone. Your blog posts will remain accessible.
              </Typography>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<ConvertIcon />}
                onClick={() => setConvertDialogOpen(true)}
              >
                Convert to Network
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Convert Confirmation Dialog */}
      <Dialog open={convertDialogOpen} onClose={() => setConvertDialogOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Convert Blog to Network?
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This will convert your blog into a full community network with:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Member management and invitations</li>
            <li>Events and calendar</li>
            <li>File sharing</li>
            <li>Wiki/documentation</li>
            <li>Full admin dashboard</li>
          </Box>
          <Typography sx={{ mt: 2 }} color="warning.main">
            This action cannot be undone. Your existing blog posts will be preserved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConvert}
            disabled={converting}
          >
            {converting ? <CircularProgress size={20} /> : 'Convert to Network'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlogSettingsTab;
