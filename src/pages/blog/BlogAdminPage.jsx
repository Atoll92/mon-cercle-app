import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  Container,
  Button
} from '@mui/material';
import { useAuth } from '../../context/authcontext';
import { useProfile } from '../../context/profileContext';
import { fetchBlogBySubdomain, fetchBlogComments } from '../../api/blog';
import { supabase } from '../../supabaseclient';
import BlogAdminLayout from '../../components/admin/blog/BlogAdminLayout';
import { lazyWithRetry } from '../../utils/lazyWithRetry';

// Lazy load tab components
const BlogPostsTab = lazyWithRetry(() => import('../../components/admin/blog/BlogPostsTab'));
const BlogCommentsTab = lazyWithRetry(() => import('../../components/admin/blog/BlogCommentsTab'));
const BlogSubscribersTab = lazyWithRetry(() => import('../../components/admin/blog/BlogSubscribersTab'));
const BlogAnalyticsTab = lazyWithRetry(() => import('../../components/admin/blog/BlogAnalyticsTab'));
const BlogThemeTab = lazyWithRetry(() => import('../../components/admin/blog/BlogThemeTab'));
const BlogSettingsTab = lazyWithRetry(() => import('../../components/admin/blog/BlogSettingsTab'));

const BlogAdminPage = () => {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile, profiles, isLoadingProfiles } = useProfile();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [pendingCommentsCount, setPendingCommentsCount] = useState(0);

  // Load blog and verify access
  useEffect(() => {
    const loadBlog = async () => {
      // Wait for profiles to finish loading
      if (isLoadingProfiles) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const blogData = await fetchBlogBySubdomain(subdomain);

        if (!blogData) {
          setError('Blog not found');
          return;
        }

        // Check if user has admin access
        // User must have a profile in this blog/network with admin role
        // OR be the creator of the blog (for just-created blogs where profile context hasn't updated yet)
        const hasProfileAccess = Array.isArray(profiles) && profiles.some(
          p => p.network_id === blogData.id && (p.role === 'admin' || p.role === 'super_admin')
        );

        // The RPC doesn't return created_by, so we need to check directly
        let isCreator = false;
        if (!hasProfileAccess) {
          const { data: networkData } = await supabase
            .from('networks')
            .select('created_by')
            .eq('id', blogData.id)
            .single();
          isCreator = networkData?.created_by === user?.id;
        }

        console.log('Blog access check:', {
          blogId: blogData.id,
          userId: user?.id,
          hasProfileAccess,
          isCreator,
          profilesCount: profiles?.length
        });

        if (!hasProfileAccess && !isCreator) {
          setError('You do not have permission to access this blog admin');
          return;
        }

        setBlog(blogData);

        // Fetch pending comments count
        try {
          const comments = await fetchBlogComments(blogData.id, { status: 'pending' });
          setPendingCommentsCount(comments?.length || 0);
        } catch (commentErr) {
          console.error('Error fetching pending comments:', commentErr);
        }
      } catch (err) {
        console.error('Error loading blog:', err);
        setError('Failed to load blog');
      } finally {
        setLoading(false);
      }
    };

    if (subdomain && user && !isLoadingProfiles) {
      loadBlog();
    }
  }, [subdomain, user, profiles, isLoadingProfiles]);

  // Handle network update (refresh blog data)
  const handleNetworkUpdate = async () => {
    const blogData = await fetchBlogBySubdomain(subdomain);
    if (blogData) {
      setBlog(blogData);
    }
  };

  if (loading || isLoadingProfiles) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !blog) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Container maxWidth="sm">
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Blog not found'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </Container>
      </Box>
    );
  }

  // Find the profile for this blog
  const blogProfile = profiles?.find(p => p.network_id === blog.id);

  // Render tab content based on active tab
  const renderTabContent = () => {
    const tabProps = {
      network: blog,
      activeProfile: blogProfile || activeProfile,
      onNetworkUpdate: handleNetworkUpdate
    };

    const TabLoader = () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );

    switch (activeTab) {
      case 0:
        return (
          <Suspense fallback={<TabLoader />}>
            <BlogPostsTab {...tabProps} />
          </Suspense>
        );
      case 1:
        return (
          <Suspense fallback={<TabLoader />}>
            <BlogCommentsTab
              {...tabProps}
              onCommentsChange={(count) => setPendingCommentsCount(count)}
            />
          </Suspense>
        );
      case 2:
        return (
          <Suspense fallback={<TabLoader />}>
            <BlogSubscribersTab {...tabProps} />
          </Suspense>
        );
      case 3:
        return (
          <Suspense fallback={<TabLoader />}>
            <BlogAnalyticsTab {...tabProps} />
          </Suspense>
        );
      case 4:
        return (
          <Suspense fallback={<TabLoader />}>
            <BlogThemeTab {...tabProps} />
          </Suspense>
        );
      case 5:
        return (
          <Suspense fallback={<TabLoader />}>
            <BlogSettingsTab {...tabProps} />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<TabLoader />}>
            <BlogPostsTab {...tabProps} />
          </Suspense>
        );
    }
  };

  return (
    <BlogAdminLayout
      network={blog}
      activeProfile={blogProfile || activeProfile}
      onNetworkUpdate={handleNetworkUpdate}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pendingCommentsCount={pendingCommentsCount}
    >
      {renderTabContent()}
    </BlogAdminLayout>
  );
};

export default BlogAdminPage;
