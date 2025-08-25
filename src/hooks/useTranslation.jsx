import { useState, useEffect, createContext, useContext } from 'react';
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';

const translations = {
  en: enTranslations,
  fr: frTranslations
};

// Create context for language
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to browser language
    const savedLang = localStorage.getItem('language');
    if (savedLang && translations[savedLang]) {
      return savedLang;
    }
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang] ? browserLang : 'en';
  });

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    // Fallback if not wrapped in provider
    const defaultLang = localStorage.getItem('language') || 'en';
    return {
      t: (key, params = {}) => {
        const keys = key.split('.');
        let value = translations[defaultLang];
        
        for (const k of keys) {
          value = value?.[k];
          if (!value) break;
        }
        
        if (typeof value === 'string') {
          // Replace parameters like {{error}}
          return value.replace(/\{\{(\w+)\}\}/g, (match, param) => 
            params.hasOwnProperty(param) ? params[param] : match
          );
        }
        
        return key;
      },
      language: defaultLang,
      changeLanguage: () => {}
    };
  }
  
  const { language, changeLanguage } = context;
  
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }
    
    if (typeof value === 'string') {
      // Replace parameters like {{error}}
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => 
        params.hasOwnProperty(param) ? params[param] : match
      );
    }
    
    return key;
  };
  
  return { t, language, changeLanguage };
};