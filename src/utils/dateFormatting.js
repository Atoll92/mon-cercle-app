// Utility functions for formatting dates and times

/**
 * Format a date string to show both date and time
 * @param {string} dateString - ISO date string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Default options
  const defaultOptions = {
    dateStyle: 'medium',
    timeStyle: 'short'
  };
  
  return date.toLocaleString(undefined, { ...defaultOptions, ...options });
};

/**
 * Format a date string to show only the date
 * @param {string} dateString - ISO date string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  return date.toLocaleDateString(undefined, options);
};

/**
 * Format a date string to show only the time
 * @param {string} dateString - ISO date string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string
 */
export const formatTime = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleTimeString(undefined, { ...defaultOptions, ...options });
};

/**
 * Check if a date has a time component (not midnight)
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if the date has a time component
 */
export const hasTimeComponent = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
};

/**
 * Format event date intelligently - show time if it's set
 * @param {string} dateString - ISO date string
 * @param {boolean} detailed - If true, show weekday and full month names
 * @returns {string} Formatted date/datetime string
 */
export const formatEventDate = (dateString, detailed = false) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // If the date has a time component, show both date and time
  if (hasTimeComponent(dateString)) {
    if (detailed) {
      // Detailed format: "Monday, January 15, 2025 at 2:30 PM"
      const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const timeOptions = { hour: 'numeric', minute: '2-digit' };
      const dateStr = date.toLocaleDateString(undefined, dateOptions);
      const timeStr = date.toLocaleTimeString(undefined, timeOptions);
      return `${dateStr} at ${timeStr}`;
    }
    return formatDateTime(dateString);
  }
  
  // Otherwise just show the date
  if (detailed) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }
  return formatDate(dateString);
};

// Import translations directly
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';

const translations = {
  en: enTranslations,
  fr: frTranslations
};

// Helper to get translation function
const getTranslation = (key, params = {}) => {
  const language = localStorage.getItem('language') || 'en';
  const keys = key.split('.');
  let value = translations[language];

  for (const k of keys) {
    value = value?.[k];
    if (!value) break;
  }

  if (typeof value === 'string') {
    // Replace parameters like {{count}}
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) =>
      params.hasOwnProperty(param) ? params[param] : match
    );
  }

  // Fallback to English if translation not found
  value = translations.en;
  for (const k of keys) {
    value = value?.[k];
    if (!value) break;
  }

  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) =>
      params.hasOwnProperty(param) ? params[param] : match
    );
  }

  return key; // Return key if no translation found
};

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 * Now with automatic translation support
 * @param {string} dateString - ISO date string
 * @returns {string} Localized relative time string
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { key: 'year', seconds: 31536000 },
    { key: 'month', seconds: 2592000 },
    { key: 'week', seconds: 604800 },
    { key: 'day', seconds: 86400 },
    { key: 'hour', seconds: 3600 },
    { key: 'minute', seconds: 60 },
    { key: 'second', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      const unitKey = count === 1 ? `time.${interval.key}` : `time.${interval.key}s`;
      const unit = getTranslation(unitKey);
      const template = count === 1 ? 'time.timeAgo.singular' : 'time.timeAgo.plural';
      return getTranslation(template, { count, unit });
    }
  }

  return getTranslation('time.justNow');
};

/**
 * Format "Joined X ago" with automatic translation
 * @param {string} dateString - ISO date string
 * @returns {string} Localized "Joined X ago" string
 */
export const formatJoinedTime = (dateString) => {
  const timeAgo = formatTimeAgo(dateString);
  return `${getTranslation('time.joined')} ${timeAgo}`;
};