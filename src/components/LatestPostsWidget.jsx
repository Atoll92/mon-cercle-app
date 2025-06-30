import { useState } from 'react';
import { Link } from 'react-router-dom';
import PostCard from './PostCard';
import WidgetHeader from './shared/WidgetHeader';
import WidgetSkeleton from './shared/WidgetSkeleton';
import WidgetEmptyState from './shared/WidgetEmptyState';
import WidgetErrorState from './shared/WidgetErrorState';
import CreatePostModal from './CreatePostModal';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useProfile } from '../context/profileContext';
import {
  Box,
  Button,
  Stack
} from '@mui/material';
import {
  Work as WorkIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import FlexFlowBox from './FlexFlowBox';

const LatestPostsWidget = ({ networkId, onMemberClick, darkMode = false, onPostUpdated, onPostDeleted }) => {
  const { activeProfile } = useProfile();
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);

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

  // Then fetch latest 2 posts from members
  const { data: latestPosts, loading, error, refetch } = useSupabaseQuery(
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
      .limit(2) : Promise.resolve({ data: [], error: null }),
    [memberIdsString],
    { enabled: memberIds.length > 0 }
  );

  // Handle post creation callback
  const handlePostCreated = () => {
    setCreatePostModalOpen(false);
    // Refresh posts data
    refetch();
    if (onPostUpdated) {
      onPostUpdated();
    }
  };

  if (loading || !networkId) {
    return <WidgetSkeleton showHeader={true} contentLines={3} showImage={true} />;
  }

  if (error) {
    return (
      <WidgetErrorState
        icon={<WorkIcon color="primary" />}
        title="Latest Posts"
        error={error}
      />
    );
  }

  if (!latestPosts || latestPosts.length === 0 || memberIds.length === 0) {
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
          title="Latest Posts"
          action={
            <Button
              variant="contained"
              size="small"
              onClick={() => setCreatePostModalOpen(true)}
              startIcon={<AddIcon />}
            >
              Create Post
            </Button>
          }
        />
        
        <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WidgetEmptyState
            emptyIcon={<WorkIcon />}
            emptyMessage="No portfolio posts yet"
            emptySubMessage="Be the first to share your work!"
          />
        </Box>
        
        <CreatePostModal
          open={createPostModalOpen}
          onClose={() => setCreatePostModalOpen(false)}
          onPostCreated={handlePostCreated}
        />
      </Box>
    );
  }

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
        title="Latest Posts"
        viewAllLink={`/network/${networkId}?tab=social`}
      />
      
        <FlexFlowBox>
          <Button
                variant="contained"
                size="small"
                onClick={() => setCreatePostModalOpen(true)}
                startIcon={<AddIcon />}
                sx={{ m: 2, alignSelf: 'center' }}
              >
                Create Post
          </Button>
          <>
          {latestPosts.map((post) => {
            const isOwner = post.profile_id === activeProfile?.id;
            return (
              <PostCard
                key={post.id}
                post={post}
                author={post.profiles}
                onPostUpdated={onPostUpdated}
                onPostDeleted={onPostDeleted}
              />
            );
          })}
          </>
        </FlexFlowBox>
      
      <CreatePostModal
        open={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </Box>
  );
};

export default LatestPostsWidget;