import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n, Language } from '../i18n/index';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useI18n();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="w-5 h-5 text-gray-600" />
      <div className="flex space-x-1">
        <button
          onClick={() => handleLanguageChange('en')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => handleLanguageChange('zh')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            language === 'zh'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          中文
        </button>
      </div>
    </div>
  );
}; 