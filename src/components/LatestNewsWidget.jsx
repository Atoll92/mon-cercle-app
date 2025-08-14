import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import NewsCard from './NewsCard';
import WidgetHeader from './shared/WidgetHeader';
import WidgetSkeleton from './shared/WidgetSkeleton';
import WidgetEmptyState from './shared/WidgetEmptyState';
import WidgetErrorState from './shared/WidgetErrorState';
import CreateNewsModal from './CreateNewsModal';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { isNetworkAdmin } from '../api/profiles';
import { useProfile } from '../context/profileContext';
import {
  Box,
  Button
} from '@mui/material';
import {
  Campaign as AnnouncementIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';

const LatestAnnouncementsWidget = ({ networkId, onMemberClick, darkMode = false }) => {
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [createAnnouncementModalOpen, setCreateAnnouncementModalOpen] = useState(false);
  const { activeProfile } = useProfile();

  // Check if user is network admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (activeProfile?.id && networkId) {
        const adminStatus = await isNetworkAdmin(activeProfile.id, networkId);
        setIsAdmin(adminStatus);
      }
    };
    checkAdminStatus();
  }, [activeProfile?.id, networkId]);

  const { data: latestAnnouncements, loading, error, refetch } = useSupabaseQuery(
    () => supabase
      .from('network_news')
      .select(`
        id,
        title,
        content,
        image_url,
        image_caption,
        media_url,
        media_type,
        media_metadata,
        created_at,
        profiles!network_news_created_by_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq('network_id', networkId)
      .order('created_at', { ascending: false })
      .limit(2),
    [networkId],
    { enabled: !!networkId }
  );

  const handleAnnouncementCreated = (newPost) => {
    setCreateAnnouncementModalOpen(false);
    // Refresh the announcements list
    refetch();
  };


  if (loading) {
    return <WidgetSkeleton showHeader={true} contentLines={3} showImage={true} />;
  }

  if (error) {
    return (
      <WidgetErrorState 
        icon={<AnnouncementIcon color="primary" />}
        title={t('dashboard.widgets.latestAnnouncements')}
        error={error}
      />
    );
  }

  if (!latestAnnouncements || latestAnnouncements.length === 0) {
    return (
      <Box sx={{ 
        width: '100%',
        height: '100%',
        minHeight: 400,
        maxHeight: 600,
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: darkMode ? 'grey.900' : 'background.paper',
        borderRadius: 2,
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <WidgetHeader
          icon={<AnnouncementIcon color="primary" />}
          title={t('dashboard.widgets.latestAnnouncements')}
          action={
            isAdmin && (
              <Button
                variant="contained"
                size="small"
                onClick={() => setCreateAnnouncementModalOpen(true)}
                startIcon={<AddIcon />}
              >
                Create Announcement
              </Button>
            )
          }
        />
        
        <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WidgetEmptyState
            emptyIcon={<AnnouncementIcon />}
            emptyMessage="No announcements yet"
            emptySubMessage={isAdmin ? "Create the first announcement for your network!" : "Check back later for updates from your network."}
          />
        </Box>
        
        <CreateNewsModal
          open={createAnnouncementModalOpen}
          onClose={() => setCreateAnnouncementModalOpen(false)}
          networkId={networkId}
          onNewsCreated={handleAnnouncementCreated}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      minHeight: 400,
      maxHeight: 600,
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: darkMode ? 'grey.900' : 'background.paper',
      borderRadius: 2,
      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden'
    }}>
      <WidgetHeader
        icon={<AnnouncementIcon color="primary" />}
        title={t('dashboard.widgets.latestAnnouncements')}
        viewAllLink={`/network/${networkId}?tab=news`}
        action={
          isAdmin && (
            <Button
              variant="contained"
              size="small"
              onClick={() => setCreateAnnouncementModalOpen(true)}
              startIcon={<AddIcon />}
            >
              Create Announcement
            </Button>
          )
        }
      />
      <Box sx={{ 
        flex: 1,
        p: 2,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {latestAnnouncements.map((news) => (
          <Box
            key={news.id}
            sx={{
              width: '100%'
            }}
          >
            <NewsCard
              news={news}
              networkId={networkId}
              onMemberClick={onMemberClick}
            />
          </Box>
        ))}
      </Box>
      
      <CreateNewsModal
        open={createAnnouncementModalOpen}
        onClose={() => setCreateAnnouncementModalOpen(false)}
        networkId={networkId}
        onNewsCreated={handleAnnouncementCreated}
      />
    </Box>
  );
};

export default LatestAnnouncementsWidget;