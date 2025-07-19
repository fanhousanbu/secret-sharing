import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Language, TranslationKey, Translations } from './types';
import { en } from './en';
import { zh } from './zh';

const translations: Translations = {
  en,
  zh,
};

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslationKey;
  formatMessage: (key: string, params?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'en'; // Default to English
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = translations[language];

  const formatMessage = (key: string, params?: Record<string, any>): string => {
    let message = (t as any)[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        message = message.replace(`{${paramKey}}`, value);
      });
    }
    return message;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, formatMessage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export * from './types';
export { en, zh };
