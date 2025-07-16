import { useState, useEffect } from 'react';
import { FileEncryption } from './components/FileEncryption';
import { FileRecovery } from './components/FileRecovery';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Shield, FileText, Settings, Github } from 'lucide-react';
import { useI18n } from './i18n/index';

type Tab = 'encrypt' | 'decrypt';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('encrypt');
  const { t, language } = useI18n();

  useEffect(() => {
    document.title = t.appTitle;
  }, [t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <Shield className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">
              {t.appTitle}
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {t.appSubtitle}
          </p>
          <div className="flex justify-center mt-4">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <Shield className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">{t.featureSecureEncryption}</h3>
            <p className="text-gray-600 text-sm">
              {t.featureSecureEncryptionDesc}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <FileText className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">{t.featureSmartSplitting}</h3>
            <p className="text-gray-600 text-sm">
              {t.featureSmartSplittingDesc}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <Settings className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">{t.featureFlexibleRecovery}</h3>
            <p className="text-gray-600 text-sm">
              {t.featureFlexibleRecoveryDesc}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('encrypt')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'encrypt'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-5 h-5 inline mr-2" />
              {t.tabEncryption}
            </button>
            <button
              onClick={() => setActiveTab('decrypt')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'decrypt'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              {t.tabRecovery}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'encrypt' ? <FileEncryption /> : <FileRecovery />}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <div className="flex justify-center items-center mb-2">
            <Github className="w-5 h-5 mr-2" />
            <span>{t.footerOpenSource}</span>
          </div>
          <p className="text-sm">
            {t.footerDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
 