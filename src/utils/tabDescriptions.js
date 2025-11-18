// Default tab descriptions (English)
export const defaultTabDescriptions = {
  news: 'Stay updated with the latest announcements, news, and important information from your network',
  members: 'Browse and connect with fellow network members, view profiles, and discover shared interests',
  events: 'Discover upcoming events, RSVP to gatherings, and stay connected with your community activities',
  chat: 'Engage in real-time conversations with network members through group discussions and direct messages',
  files: 'Share and access important documents, resources, and files within your network',
  wiki: 'Collaborate on building a knowledge base with guides, documentation, and shared resources',
  social: 'Share updates, posts, and engage with your community through content and interactions',
  courses: 'Access and manage educational courses, learning materials, and track your progress',
  marketplace: 'Browse and trade products, services, and resources within your network community',
  donation: 'Support our association by making a secure donation through HelloAsso platform'
};

// Default tab descriptions (French)
export const defaultTabDescriptionsFr = {
  news: 'Restez informé des dernières annonces, nouvelles et informations importantes de votre réseau',
  members: 'Parcourez et connectez-vous avec les membres du réseau, consultez les profils et découvrez des intérêts communs',
  events: 'Découvrez les événements à venir, confirmez votre présence et restez connecté avec les activités de votre communauté',
  chat: 'Participez à des conversations en temps réel avec les membres du réseau via des discussions de groupe et des messages directs',
  files: 'Partagez et accédez aux documents importants, ressources et fichiers au sein de votre réseau',
  wiki: 'Collaborez à la construction d\'une base de connaissances avec des guides, de la documentation et des ressources partagées',
  social: 'Partagez des mises à jour, des publications et interagissez avec votre communauté à travers du contenu et des interactions',
  courses: 'Accédez et gérez des cours éducatifs, du matériel d\'apprentissage et suivez votre progression',
  marketplace: 'Parcourez et échangez des produits, services et ressources au sein de votre communauté réseau',
  donation: 'Soutenez notre association en effectuant un don sécurisé via la plateforme HelloAsso'
};

/**
 * Get default tab descriptions based on language
 * @param {string} language - The language code ('en' or 'fr')
 * @returns {object} The default tab descriptions for the language
 */
export const getDefaultTabDescriptions = (language = 'en') => {
  return language === 'fr' ? defaultTabDescriptionsFr : defaultTabDescriptions;
};

/**
 * Get tab description with fallback to default
 * @param {string} tabId - The tab identifier
 * @param {object} customDescriptions - Custom descriptions from network settings
 * @param {string} language - The language code ('en' or 'fr')
 * @returns {string} The description for the tab
 */
export const getTabDescription = (tabId, customDescriptions = {}, language = 'en') => {
  const defaults = getDefaultTabDescriptions(language);
  return customDescriptions[tabId] || defaults[tabId] || '';
};

/**
 * Get all tab descriptions with defaults
 * @param {object} customDescriptions - Custom descriptions from network settings
 * @param {string} language - The language code ('en' or 'fr')
 * @returns {object} Object with all tab descriptions
 */
export const getAllTabDescriptions = (customDescriptions = {}, language = 'en') => {
  const defaults = getDefaultTabDescriptions(language);
  return {
    ...defaults,
    ...customDescriptions
  };
};