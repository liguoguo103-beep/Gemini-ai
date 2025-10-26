import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { supportedLanguages } from './languages';
import { getTranslation } from './translations';

type LanguageCode = typeof supportedLanguages[number]['code'];

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, substitutions?: Record<string, string>) => any;
  supportedLanguages: typeof supportedLanguages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const savedLang = localStorage.getItem('gemini-lite-language') as LanguageCode;
    if (savedLang && supportedLanguages.some(l => l.code === savedLang)) {
      return savedLang;
    }
    const browserLang = navigator.language.split('-')[0];
    if (supportedLanguages.some(l => l.code === browserLang)) {
      return browserLang as LanguageCode;
    }
    return 'zh-TW';
  });

  useEffect(() => {
    localStorage.setItem('gemini-lite-language', language);
  }, [language]);
  
  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const t = useCallback((key: string, substitutions?: Record<string, string>): any => {
    return getTranslation(language, key, substitutions);
  }, [language]);
  

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
