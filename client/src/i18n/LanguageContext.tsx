import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  dir: 'rtl' | 'ltr';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('reachcraft_lang') as Language | null;
    return saved === 'ar' || saved === 'en' ? saved : 'ar';
  });

  const dir: 'rtl' | 'ltr' = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    localStorage.setItem('reachcraft_lang', language);
  }, [language, dir]);

  const triggerLangTransition = () => {
    const root = document.documentElement;
    root.classList.add('lang-transitioning');
    window.setTimeout(() => {
      root.classList.remove('lang-transitioning');
    }, 250);
  };

  const setLanguage = (lang: Language) => {
    triggerLangTransition();
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    triggerLangTransition();
    setLanguageState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to English
        let fallback: any = translations.en;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let text = current;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }

    return text;
  };

  const contextValue = useMemo(
    () => ({
      language,
      dir,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, dir]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
