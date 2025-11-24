/**
 * Activity Text Generator
 * Generates translated activity text from metadata
 */

/**
 * Generate translated activity text from activity metadata
 * @param {Object} activity - Activity object with type and metadata
 * @param {Function} t - Translation function
 * @returns {string} - Translated activity text
 */
export const generateActivityText = (activity, t) => {
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

      case 'comment_added':
        const entityType = metadata?.entity_type || 'item';
        const translatedEntityType = t(`activityFeed.entityTypes.${entityType}`, entityType);
        return t('activityFeed.templates.comment_added', {
          name,
          entityType: translatedEntityType,
          title: metadata?.entity_title || 'Untitled'
        });

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

      case 'milestone_reached':
        const milestoneType = metadata?.milestone_type || '';
        const milestone = t(`activityFeed.templates.${milestoneType}`, milestoneType);
        return t('activityFeed.templates.milestone_reached', {
          name,
          milestone
        });

      case 'reaction_added':
        const emoji = metadata?.emoji || '👍';
        const contentType = metadata?.content_type || 'post';
        const contentTitle = metadata?.content_title || t(`activityFeed.entityTypes.${contentType}`, contentType);
        return t('activityFeed.templates.reaction_added', {
          name,
          emoji,
          contentTitle
        }, `${name} reacted ${emoji} to ${contentTitle}`);

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
