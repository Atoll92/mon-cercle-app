/**
 * Lightweight translation utility for public (anonymous) pages
 * Uses browser language detection instead of user settings
 */
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';

const translations = {
  en: enTranslations,
  fr: frTranslations
};

/**
 * Get the browser's preferred language
 * @returns {string} 'en' or 'fr'
 */
export const getBrowserLanguage = () => {
  const browserLang = navigator.language?.split('-')[0] || 'en';
  return translations[browserLang] ? browserLang : 'en';
};

/**
 * Get a translation for the given key
 * @param {string} key - Dot-notation key (e.g., 'publicBlog.featured')
 * @param {string} language - Language code ('en' or 'fr')
 * @param {object} params - Optional parameters for interpolation
 * @returns {string} Translated string or key if not found
 */
export const getTranslation = (key, language, params = {}) => {
  const keys = key.split('.');
  let value = translations[language] || translations.en;

  for (const k of keys) {
    value = value?.[k];
    if (!value) break;
  }

  if (typeof value === 'string') {
    // Replace parameters like {{name}}
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) =>
      Object.prototype.hasOwnProperty.call(params, param) ? params[param] : match
    );
  }

  return key;
};

/**
 * Create a translation function for a specific language
 * @param {string} language - Language code
 * @returns {function} Translation function
 */
export const createTranslator = (language) => {
  return (key, params = {}) => getTranslation(key, language, params);
};
