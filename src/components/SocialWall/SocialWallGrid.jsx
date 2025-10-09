import React from 'react';
import { Box, Typography } from '@mui/material';
import PostCard from '../PostCard';
import NewsCard from './NewsCard';
import Spinner from '../Spinner';
import { useCardAnimations } from '../../hooks/useCardAnimations';

/**
 * SocialWallGrid - Grid layout for social wall items
 * Uses CSS Grid for left-to-right, top-to-bottom ordering
 */
const SocialWallGrid = React.memo(({
  items = [],
  categories = [],
  darkMode = false,
  loading = false,
  hasMore = true,
  lastItemRef,
  customFadedText,
  customBorder,
  activeProfile,
  user,
  onMemberClick,
  onPostUpdated,
  onPostDeleted,
  onDeletePost,
  onImageClick,
  deletingPostId,
  customLightText,
  t,
}) => {
  // TEMPORARILY DISABLE animations to debug
  const setAnimationRef = useCardAnimations({ enabled: false });

  // Show loading spinner if we have no items and not explicitly done loading
  if (items.length === 0 && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Spinner size={64} />
      </Box>
    );
  }

  // Show empty state if we have no items and we're done loading
  if (items.length === 0 && !loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color={customFadedText}>
          {t('socialWall.noActivity')}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* CSS Columns for masonry layout (orders by column but packs tightly) */}
      <Box
        sx={{
          columnCount: {
            xs: 1,
            sm: 2,
            md: 3,
          },
          columnGap: '24px',
          width: '100%',
          '& > *': {
            breakInside: 'avoid',
            marginBottom: '24px',
            display: 'inline-block',
            width: '100%',
          }
        }}
      >
        {items.map((item, index) => {
          const isRefItem = index === items.length - 1 ||
            (items.length > 10 && index % 10 === 0 && index > items.length - 10);

          const cardId = item.stableId || `${item.itemType}-${item.id}`;

          try {
            // Handle posts with PostCard component
            if (item.itemType === 'post') {
            const author = {
              id: item.memberId,
              full_name: item.memberName,
              profile_picture_url: item.memberAvatar
            };

            return (
              <Box
                key={cardId}
                data-social-wall-card="true"
                data-item-type="post"
                data-item-id={item.id}
                ref={(el) => {
                  setAnimationRef(index)(el);
                  if (isRefItem && lastItemRef) {
                    lastItemRef(el);
                  }
                }}
              >
                <PostCard
                  post={item}
                  author={author}
                  category={item.category_id ? categories.find(c => c.id === item.category_id) : null}
                  darkMode={darkMode}
                  isOwner={item.profile_id === (activeProfile?.id || user?.id)}
                  onAuthorClick={onMemberClick}
                  onPostUpdated={onPostUpdated}
                  onPostDeleted={onPostDeleted}
                  sx={{
                    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: darkMode ? '0 6px 20px rgba(0,0,0,0.25)' : '0 6px 20px rgba(0,0,0,0.08)'
                    }
                  }}
                />
              </Box>
            );
          }

          // Handle news items with NewsCard component
          return (
            <Box
              key={cardId}
              data-social-wall-card="true"
              data-item-type="news"
              data-item-id={item.id}
              ref={(el) => {
                setAnimationRef(index)(el);
                if (isRefItem && lastItemRef) {
                  lastItemRef(el);
                }
              }}
            >
              <NewsCard
                item={item}
                category={item.category_id ? categories.find(c => c.id === item.category_id) : null}
                darkMode={darkMode}
                isUserPost={item.itemType === 'post' && item.memberId === user?.id}
                deletingPostId={deletingPostId}
                customLightText={customLightText}
                customFadedText={customFadedText}
                customBorder={customBorder}
                onMemberClick={onMemberClick}
                onDeletePost={onDeletePost}
                onImageClick={onImageClick}
                t={t}
              />
            </Box>
          );
          } catch (error) {
            console.error('Error rendering card:', { item, error });
            return (
              <Box key={cardId}>
                <Typography color="error">Error rendering item {item.id}</Typography>
              </Box>
            );
          }
        })}
      </Box>

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <Spinner size={64} />
        </Box>
      )}

      {/* End of content message */}
      {!hasMore && items.length > 0 && !loading && (
        <Box
          sx={{
            textAlign: 'center',
            py: 3,
            color: customFadedText,
            borderTop: `1px solid ${customBorder}`,
            mt: 2
          }}
        >
          <Typography variant="body2">
            {t('socialWall.endOfWall')}
          </Typography>
        </Box>
      )}
    </>
  );
});

SocialWallGrid.displayName = 'SocialWallGrid';

export default SocialWallGrid;
