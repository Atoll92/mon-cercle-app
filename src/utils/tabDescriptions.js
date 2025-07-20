// Default tab descriptions
export const defaultTabDescriptions = {
  news: 'Stay updated with the latest announcements, news, and important information from your network',
  members: 'Browse and connect with fellow network members, view profiles, and discover shared interests',
  events: 'Discover upcoming events, RSVP to gatherings, and stay connected with your community activities',
  chat: 'Engage in real-time conversations with network members through group discussions and direct messages',
  files: 'Share and access important documents, resources, and files within your network',
  wiki: 'Collaborate on building a knowledge base with guides, documentation, and shared resources',
  social: 'Share updates, portfolio items, and engage with your community through posts and interactions'
};

/**
 * Get tab description with fallback to default
 * @param {string} tabId - The tab identifier
 * @param {object} customDescriptions - Custom descriptions from network settings
 * @returns {string} The description for the tab
 */
export const getTabDescription = (tabId, customDescriptions = {}) => {
  return customDescriptions[tabId] || defaultTabDescriptions[tabId] || '';
};

/**
 * Get all tab descriptions with defaults
 * @param {object} customDescriptions - Custom descriptions from network settings
 * @returns {object} Object with all tab descriptions
 */
export const getAllTabDescriptions = (customDescriptions = {}) => {
  return {
    ...defaultTabDescriptions,
    ...customDescriptions
  };
};