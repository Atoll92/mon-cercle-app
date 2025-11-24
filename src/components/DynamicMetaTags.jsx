import { useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

/**
 * DynamicMetaTags component updates OpenGraph and meta tags based on user's language
 * This ensures social media shares show content in the user's preferred language
 */
const DynamicMetaTags = () => {
  const { language } = useTranslation();

  useEffect(() => {
    const lang = language || 'en';

    // Meta content by language
    const metaContent = {
      en: {
        title: 'Conclav - Privacy-Focused Professional Networks',
        description: 'Create private professional networks in minutes. No tracking, no ads, no Big Tech. GDPR compliant. Made in Europe.',
        locale: 'en_US'
      },
      fr: {
        title: 'Conclav - Réseaux Professionnels Privés',
        description: 'Créez des réseaux professionnels privés en quelques minutes. Aucun traçage, aucune pub, aucune Big Tech. Conforme RGPD. Conçu en Europe.',
        locale: 'fr_FR'
      }
    };

    const content = metaContent[lang] || metaContent.en;

    // Update document title
    document.title = content.title;

    // Update standard meta tags
    updateMetaTag('name', 'title', content.title);
    updateMetaTag('name', 'description', content.description);

    // Update OpenGraph tags
    updateMetaTag('property', 'og:title', content.title);
    updateMetaTag('property', 'og:description', content.description);
    updateMetaTag('property', 'og:locale', content.locale);

    // Update Twitter tags
    updateMetaTag('name', 'twitter:title', content.title);
    updateMetaTag('name', 'twitter:description', content.description);

    // Update HTML lang attribute
    document.documentElement.lang = lang;

  }, [language]);

  return null; // This component doesn't render anything
};

/**
 * Helper function to update or create meta tags
 * @param {string} attrType - 'name' or 'property'
 * @param {string} attrValue - The attribute value (e.g., 'og:title')
 * @param {string} content - The content to set
 */
function updateMetaTag(attrType, attrValue, content) {
  let element = document.querySelector(`meta[${attrType}="${attrValue}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrType, attrValue);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

export default DynamicMetaTags;
