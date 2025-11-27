/**
 * HelloAsso Embed Utilities
 * Handles detection and embedding of HelloAsso ticketing widgets
 */

/**
 * Detects if a URL is a HelloAsso event URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL is a HelloAsso event URL
 */
export const isHelloAssoUrl = (url) => {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('helloasso.com');
  } catch (e) {
    return false;
  }
};

/**
 * Extracts the HelloAsso organization slug and event slug from a URL
 * HelloAsso URLs follow patterns like:
 * - https://www.helloasso.com/associations/{organizationSlug}/evenements/{eventSlug}
 * - https://www.helloasso.com/associations/{organizationSlug}/adhesions/{membershipSlug}
 * - https://helloasso.com/associations/{organizationSlug}/evenements/{eventSlug}
 *
 * @param {string} url - The HelloAsso URL
 * @returns {Object|null} - Object with organizationSlug, formSlug, and formType, or null if invalid
 */
export const extractHelloAssoInfo = (url) => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Match pattern: /associations/{org}/evenements/{event}
    const eventMatch = pathname.match(/\/associations\/([^/]+)\/evenements\/([^/]+)/);
    if (eventMatch) {
      return {
        organizationSlug: eventMatch[1],
        formSlug: eventMatch[2],
        formType: 'Event'
      };
    }

    // Match pattern: /associations/{org}/adhesions/{membership}
    const membershipMatch = pathname.match(/\/associations\/([^/]+)\/adhesions\/([^/]+)/);
    if (membershipMatch) {
      return {
        organizationSlug: membershipMatch[1],
        formSlug: membershipMatch[2],
        formType: 'Membership'
      };
    }

    // Match pattern: /associations/{org}/formulaires/{form}
    const formMatch = pathname.match(/\/associations\/([^/]+)\/formulaires\/([^/]+)/);
    if (formMatch) {
      return {
        organizationSlug: formMatch[1],
        formSlug: formMatch[2],
        formType: 'Form'
      };
    }

    return null;
  } catch (e) {
    console.error('Error extracting HelloAsso info:', e);
    return null;
  }
};

/**
 * Generates the HelloAsso embed widget URL
 * @param {string} organizationSlug - The organization slug
 * @param {string} formSlug - The form/event slug
 * @param {string} formType - The form type (Event, Membership, Form)
 * @returns {string} - The embed widget URL
 */
export const getHelloAssoEmbedUrl = (organizationSlug, formSlug, formType = 'Event') => {
  return `https://www.helloasso.com/associations/${organizationSlug}/evenements/${formSlug.toLowerCase()}/widget`;
};

/**
 * Get HelloAsso widget button URL
 * @param {string} organizationSlug - The organization slug
 * @param {string} formSlug - The form/event slug
 * @param {string} formType - The form type (Event, Membership, Form)
 * @returns {string} - The widget button URL
 */
export const getHelloAssoButtonUrl = (organizationSlug, formSlug, formType = 'Event') => {
  return `https://www.helloasso.com/associations/${organizationSlug}/evenements/${formSlug.toLowerCase()}/widget-bouton`;
};
