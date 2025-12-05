/**
 * Activity Text Generator
 * Generates translated activity text from metadata
 * Supports personalized text when content belongs to the current user
 */

/**
 * Check if the content owner matches the current user
 * @param {Object} metadata - Activity metadata
 * @param {Object} activeProfile - Current user's active profile
 * @returns {boolean}
 */
const isOwnContent = (metadata, activeProfile) => {
  if (!activeProfile) return false;
  const contentOwnerName = metadata?.content_owner_name;
  return contentOwnerName && contentOwnerName === activeProfile.full_name;
};

/**
 * Check if the entity owner matches the current user
 * @param {Object} metadata - Activity metadata
 * @param {Object} activeProfile - Current user's active profile
 * @returns {boolean}
 */
const isOwnEntity = (metadata, activeProfile) => {
  if (!activeProfile) return false;
  const entityOwnerName = metadata?.entity_owner_name;
  return entityOwnerName && entityOwnerName === activeProfile.full_name;
};

/**
 * Generate translated activity text from activity metadata
 * @param {Object} activity - Activity object with type and metadata
 * @param {Function} t - Translation function
 * @param {Object} activeProfile - Current user's active profile (optional, for personalization)
 * @returns {string} - Translated activity text
 */
export const generateActivityText = (activity, t, activeProfile = null) => {
  const { activity_type, metadata, profiles } = activity;
  const name = profiles?.full_name || metadata?.profile_name || 'Unknown';

  try {
    switch (activity_type) {
      case 'member_joined':
        return t('activityFeed.templates.member_joined', { name });

      case 'post_created':
        return t('activityFeed.templates.post_created', {
          name,
          title: metadata?.post_title || 'Untitled'
        });

      case 'news_created':
        return t('activityFeed.templates.news_created', {
          name,
          title: metadata?.news_title || 'Untitled'
        });

      case 'event_created':
        return t('activityFeed.templates.event_created', {
          name,
          title: metadata?.event_title || 'Untitled'
        });

      case 'event_rsvp':
        return t('activityFeed.templates.event_rsvp', {
          name,
          title: metadata?.event_title || 'Event'
        });

      case 'comment_added': {
        const entityType = metadata?.entity_type || 'item';
        const translatedEntityType = t(`activityFeed.entityTypes.${entityType}`, entityType);

        // Check if comment is on the current user's content
        if (isOwnEntity(metadata, activeProfile)) {
          return t('activityFeed.templates.comment_added_own', {
            name,
            entityType: translatedEntityType,
            title: metadata?.entity_title || 'Untitled'
          }, `${name} commented on your ${translatedEntityType}: ${metadata?.entity_title || 'Untitled'}`);
        }

        return t('activityFeed.templates.comment_added', {
          name,
          entityType: translatedEntityType,
          title: metadata?.entity_title || 'Untitled'
        });
      }

      case 'file_shared':
        return t('activityFeed.templates.file_shared', {
          name,
          filename: metadata?.filename || 'File'
        });

      case 'wiki_page_created':
        return t('activityFeed.templates.wiki_page_created', {
          name,
          title: metadata?.wiki_title || 'Untitled'
        });

      case 'badge_earned':
        return t('activityFeed.templates.badge_earned', {
          name,
          badgeName: metadata?.badge_name || 'Badge'
        });

      case 'milestone_reached': {
        const milestoneType = metadata?.milestone_type || '';
        const milestone = t(`activityFeed.templates.${milestoneType}`, milestoneType);
        // For network milestones, use network name instead of profile name
        const displayName = metadata?.network_name || name;
        return t('activityFeed.templates.milestone_reached', {
          name: displayName,
          milestone
        });
      }

      case 'reaction_added': {
        const emoji = metadata?.emoji || '👍';
        const contentType = metadata?.content_type || 'post';
        const translatedContentType = t(`activityFeed.entityTypes.${contentType}`, contentType);
        const contentTitle = metadata?.content_title;

        // Check if reaction is on the current user's content
        if (isOwnContent(metadata, activeProfile)) {
          // Use personalized template: "X reacted to your post"
          if (contentTitle && contentTitle !== 'comment') {
            return t('activityFeed.templates.reaction_added_own_titled', {
              name,
              emoji,
              contentType: translatedContentType,
              contentTitle
            }, `${name} reacted ${emoji} to your ${translatedContentType}: ${contentTitle}`);
          }
          return t('activityFeed.templates.reaction_added_own', {
            name,
            emoji,
            contentType: translatedContentType
          }, `${name} reacted ${emoji} to your ${translatedContentType}`);
        }

        // Default non-personalized text
        const displayTitle = contentTitle || translatedContentType;
        return t('activityFeed.templates.reaction_added', {
          name,
          emoji,
          contentTitle: displayTitle
        }, `${name} reacted ${emoji} to ${displayTitle}`);
      }

      default:
        // Fallback to stored activity_text if no template matches
        return activity.activity_text || `${name} performed an action`;
    }
  } catch (error) {
    console.error('[Activity Text Generator] Error generating text:', error);
    // Fallback to stored activity_text
    return activity.activity_text || `${name} performed an action`;
  }
};
