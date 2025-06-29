import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PostCard from './PostCard';
import ImageViewerModal from './ImageViewerModal';
import WidgetHeader from './shared/WidgetHeader';
import WidgetSkeleton from './shared/WidgetSkeleton';
import WidgetEmptyState from './shared/WidgetEmptyState';
import WidgetErrorState from './shared/WidgetErrorState';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useProfile } from '../context/profileContext';
import { getCommentCount } from '../api/comments';
import {
  Box,
  Button
} from '@mui/material';
import {
  Work as WorkIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';

const LatestPostsWidget = ({ networkId, onMemberClick, darkMode = false }) => {
  const { activeProfile } = useProfile();
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  const [commentCount, setCommentCount] = useState(0);

  // First fetch network members
  const { data: members } = useSupabaseQuery(
    () => supabase
      .from('profiles')
      .select('id')
      .eq('network_id', networkId),
    [networkId],
    { enabled: !!networkId }
  );

  const memberIds = members?.map(m => m.id) || [];
  const memberIdsString = memberIds.length > 0 ? memberIds.sort().join(',') : '';

  // Then fetch latest post from members
  const { data: latestPost, loading, error } = useSupabaseQuery(
    () => memberIds.length > 0 ? supabase
      .from('portfolio_items')
      .select(`
        *,
        profiles:profile_id (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .in('profile_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .single() : Promise.resolve({ data: null, error: null }),
    [memberIdsString],
    { enabled: memberIds.length > 0 }
  );

  // Fetch comment count for the latest post
  useEffect(() => {
    const fetchCommentCount = async () => {
      if (latestPost) {
        const { count } = await getCommentCount('post', latestPost.id);
        setCommentCount(count || 0);
      }
    };
    
    fetchCommentCount();
  }, [latestPost]);

  if (loading || !networkId) {
    return <WidgetSkeleton showHeader={true} contentLines={3} showImage={true} />;
  }

  if (error) {
    return (
      <WidgetErrorState
        icon={<WorkIcon color="primary" />}
        title="Latest Post"
        error={error}
      />
    );
  }

  if (!latestPost || memberIds.length === 0) {
    return (
      <WidgetEmptyState
        icon={<WorkIcon color="primary" />}
        title="Latest Post"
        emptyIcon={<WorkIcon />}
        emptyMessage="No portfolio posts yet"
        emptySubMessage="Be the first to share your work!"
      />
    );
  }

  // Image click handler
  const handleImageClick = (url, title) => {
    setSelectedImage({ url, title });
    setImageViewerOpen(true);
  };

  // Check if current user owns the post
  const isOwner = latestPost.profile_id === activeProfile?.id;

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: darkMode ? 'grey.900' : 'background.paper',
      borderRadius: 2,
      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <WidgetHeader
        icon={<WorkIcon color="primary" />}
        title="Latest Post"
        viewAllLink={`/network/${networkId}?tab=social`}
      />
      
      <Box sx={{ flex: 1, p: 2 }}>
        <PostCard
          post={latestPost}
          author={latestPost.profiles}
          darkMode={darkMode}
          isOwner={isOwner}
          onImageClick={handleImageClick}
          onAuthorClick={onMemberClick}
          commentCount={commentCount}
          sx={{ height: '100%' }}
        />
      </Box>
      
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
    </Box>
  );
};

export default LatestPostsWidget;