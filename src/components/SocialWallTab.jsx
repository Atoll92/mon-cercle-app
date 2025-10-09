import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import MembersDetailModal from './MembersDetailModal';
import CreatePostModal from './CreatePostModal';
import ImageViewerModal from './ImageViewerModal';
import SocialWallHeader from './SocialWall/SocialWallHeader';
import SocialWallGrid from './SocialWall/SocialWallGrid';
import { Paper, Divider, Box, alpha, useTheme } from '@mui/material';
import { fetchNetworkCategories } from '../api/categories';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { getUserProfile } from '../api/networks';
import { useNetwork } from '../context/networkContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useThrottle } from '../hooks/useThrottle';

// Number of items to display per page
const ITEMS_PER_PAGE = 6;

const SocialWallTab = ({
  darkMode = false,
  isAdmin = false,
  networkId,
  onPostDeleted,
  onPostCreated,
  onPostUpdated
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const muiTheme = useTheme();

  // Get network data from context
  const { news: networkNews = [], network } = useNetwork();

  // State for post items
  const [postItems, setPostItems] = useState([]);
  const [initialItemOrder, setInitialItemOrder] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Category filtering state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Scroll state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Theme colors
  const customLightText = muiTheme.palette.custom?.lightText || (darkMode ? '#ffffff' : '#000000');
  const customFadedText = muiTheme.palette.custom?.fadedText || (darkMode ? alpha('#ffffff', 0.7) : alpha('#000000', 0.7));
  const customBorder = muiTheme.palette.custom?.border || (darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1));

  // State for image viewer modal
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });

  // Member detail modal state
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  // Create post modal state
  const [createPostOpen, setCreatePostOpen] = useState(false);

  // Delete post state
  const [deletingPostId, setDeletingPostId] = useState(null);

  // Fetch posts for network
  const fetchPostItemsForNetwork = useCallback(async (currentNetworkId) => {
    if (!currentNetworkId) {
      console.log("Skipping post fetch - network ID not available");
      return;
    }

    try {
      console.log("Fetching posts for network:", currentNetworkId);
      const { data, error } = await supabase
        .from('portfolio_items')
        .select(`
          *,
          profiles!inner (
            id,
            full_name,
            profile_picture_url,
            network_id
          )
        `)
        .eq('profiles.network_id', currentNetworkId);

      if (error) throw error;

      const itemsWithMemberInfo = (data || []).map(item => ({
        ...item,
        itemType: 'post',
        createdAt: item.created_at,
        memberName: item.profiles?.full_name || 'Network Member',
        memberAvatar: item.profiles?.profile_picture_url || '',
        memberId: item.profiles?.id,
        media_url: item.media_url,
        media_type: item.media_type,
        media_metadata: item.media_metadata,
        image_url: item.image_url || item.file_url || ''
      }));

      setPostItems(itemsWithMemberInfo);
      setInitialLoading(false);
    } catch (err) {
      console.error('Error fetching post items:', err);
      setInitialLoading(false);
    }
  }, []);

  // Prepare social wall items
  const socialWallItems = useMemo(() => {
    const newsItems = networkNews ? networkNews.map(item => {
      const authorName = item.author?.full_name || item.profiles?.full_name;
      const authorAvatar = item.author?.profile_picture_url || item.profiles?.profile_picture_url;

      if (!authorName && item.created_by) {
        console.error(`Missing author information for news item ${item.id} created by profile ${item.created_by}`);
      }

      return {
        ...item,
        itemType: 'news',
        createdAt: item.created_at,
        stableId: `news-${item.id}`,
        memberName: authorName || (item.created_by ? 'Unknown Author' : 'Network Admin'),
        memberAvatar: authorAvatar || '',
        memberId: item.created_by || null
      };
    }) : [];

    const postItemsWithIds = postItems.map(item => ({
      ...item,
      stableId: `post-${item.id}`
    }));

    let combinedFeed = [...newsItems, ...postItemsWithIds];

    if (initialItemOrder && initialItemOrder.length > 0) {
      const itemMap = new Map();
      combinedFeed.forEach(item => {
        itemMap.set(item.stableId, item);
      });

      const orderedItems = [];
      initialItemOrder.forEach(stableId => {
        const item = itemMap.get(stableId);
        if (item) {
          orderedItems.push(item);
          itemMap.delete(stableId);
        }
      });

      const newItems = Array.from(itemMap.values());
      newItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      combinedFeed = [...newItems, ...orderedItems];
    } else {
      combinedFeed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return combinedFeed;
  }, [networkNews, postItems, initialItemOrder]);

  // Set initial order once when items are first loaded
  useEffect(() => {
    if (!initialItemOrder && socialWallItems.length > 0) {
      const order = socialWallItems.map(item => item.stableId);
      setInitialItemOrder(order);
    }
  }, [socialWallItems.length, initialItemOrder]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    let items = socialWallItems;

    if (selectedCategory) {
      items = items.filter(item => item.category_id === selectedCategory);
    }

    return [...items].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });
  }, [socialWallItems, selectedCategory]);

  // TEMPORARILY DISABLE infinite scroll to debug stuttering
  // const { displayItems, hasMore, loading, lastItemRef } = useInfiniteScroll(filteredItems, {
  //   itemsPerPage: ITEMS_PER_PAGE,
  //   initialPages: 2
  // });

  // Show all items without infinite scroll
  const displayItems = filteredItems;
  const hasMore = false;
  const loading = false;
  const lastItemRef = () => {};

  // Debug logging
  useEffect(() => {
    console.log('SocialWallTab Debug:', {
      postItemsCount: postItems.length,
      networkNewsCount: networkNews?.length || 0,
      socialWallItemsCount: socialWallItems.length,
      filteredItemsCount: filteredItems.length,
      displayItemsCount: displayItems.length,
      initialLoading,
      loading,
      hasMore
    });
  }, [postItems.length, networkNews?.length, socialWallItems.length, filteredItems.length, displayItems.length, initialLoading, loading, hasMore]);

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    const currentPosition = window.pageYOffset;
    setShowScrollTop(currentPosition > 300);
  }, []);

  const throttledScroll = useThrottle(handleScroll, 150);

  // Scroll listener
  useEffect(() => {
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [throttledScroll]);

  // Fetch post items for the network
  useEffect(() => {
    const currentNetworkId = networkId || network?.id || activeProfile?.network_id;
    if (currentNetworkId) {
      fetchPostItemsForNetwork(currentNetworkId);
    }
  }, [networkId, network?.id, activeProfile?.network_id, fetchPostItemsForNetwork]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!networkId && !activeProfile?.network_id) return;
      const netId = networkId || activeProfile?.network_id;
      const { data, error } = await fetchNetworkCategories(netId, true);
      if (data && !error) {
        setCategories(data);
      }
    };
    loadCategories();
  }, [networkId, activeProfile]);

  // Handle post created
  const handlePostCreated = useCallback((newPost) => {
    if (onPostCreated) {
      onPostCreated(newPost);
    }
    const currentNetworkId = networkId || network?.id || activeProfile?.network_id;
    if (currentNetworkId) {
      fetchPostItemsForNetwork(currentNetworkId);
    }
  }, [onPostCreated, networkId, network?.id, activeProfile?.network_id, fetchPostItemsForNetwork]);

  // Handle post deleted
  const handlePostDeleted = useCallback((postId) => {
    setPostItems(prevItems => prevItems.filter(item => item.id !== postId));
    if (onPostDeleted) {
      onPostDeleted(postId);
    }
  }, [onPostDeleted]);

  // Handle post updated
  const handlePostUpdated = useCallback((updatedPost) => {
    setPostItems(prevItems =>
      prevItems.map(item =>
        item.id === updatedPost.id
          ? { ...item, ...updatedPost, itemType: 'post', createdAt: updatedPost.created_at }
          : item
      )
    );

    if (onPostUpdated) {
      onPostUpdated(updatedPost);
    }
  }, [onPostUpdated]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Handle image click
  const handleImageClick = useCallback((url, title) => {
    setSelectedImage({ url, title });
    setImageViewerOpen(true);
  }, []);

  // Handle member click
  const handleMemberClick = useCallback(async (memberId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!memberId) {
      console.log('No member ID provided, skipping member click');
      return;
    }

    try {
      const member = await getUserProfile(memberId);

      if (member) {
        setSelectedMember(member);
        setMemberModalOpen(true);
      } else {
        throw new Error('Profile not found');
      }
    } catch (err) {
      console.error('Error fetching member details:', err);
      window.location.href = `/profile/${memberId}`;
    }
  }, []);

  // Handle post deletion
  const handleDeletePost = useCallback(async (item, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(t('socialWall.confirmDeletePost'))) {
      return;
    }

    try {
      setDeletingPostId(item.id);

      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', item.id)
        .eq('profile_id', activeProfile?.id || user.id);

      if (error) throw error;

      console.log('Post deleted successfully:', item.id);

      if (onPostDeleted) {
        onPostDeleted(item.id, 'post');
      }

      // Refresh posts
      const currentNetworkId = networkId || network?.id || activeProfile?.network_id;
      if (currentNetworkId) {
        fetchPostItemsForNetwork(currentNetworkId);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert(t('socialWall.deletePostFailed'));
    } finally {
      setDeletingPostId(null);
    }
  }, [t, activeProfile, user, onPostDeleted, networkId, network, fetchPostItemsForNetwork]);

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mt: 1.5,
        position: 'relative',
        borderRadius: 3,
        bgcolor: darkMode ? alpha('#121212', 0.7) : 'background.paper',
        backdropFilter: 'blur(10px)',
        boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
      }}
      elevation={darkMode ? 4 : 1}
    >
      {/* Header with post creation and filters */}
      <SocialWallHeader
        darkMode={darkMode}
        activeProfile={activeProfile}
        user={user}
        categories={categories}
        selectedCategory={selectedCategory}
        showScrollTop={showScrollTop}
        onCreatePostClick={() => setCreatePostOpen(true)}
        onCategoryChange={setSelectedCategory}
        onScrollTop={scrollToTop}
        t={t}
      />

      <Divider sx={{ mb: 3 }} />

      {/* Grid with social wall items */}
      <SocialWallGrid
        items={displayItems}
        categories={categories}
        darkMode={darkMode}
        loading={initialLoading || loading}
        hasMore={hasMore}
        lastItemRef={lastItemRef}
        customFadedText={customFadedText}
        customBorder={customBorder}
        customLightText={customLightText}
        activeProfile={activeProfile}
        user={user}
        onMemberClick={handleMemberClick}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
        onDeletePost={handleDeletePost}
        onImageClick={handleImageClick}
        deletingPostId={deletingPostId}
        t={t}
      />

      {/* Modals */}
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />

      <MembersDetailModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        member={selectedMember}
        darkMode={darkMode}
      />

      <CreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
        darkMode={darkMode}
      />
    </Paper>
  );
};

export default SocialWallTab;
