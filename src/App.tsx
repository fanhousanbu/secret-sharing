import { useState, useEffect } from 'react';
import { FileEncryption } from './components/FileEncryption';
import { FileRecovery } from './components/FileRecovery';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import PwaUpdateNotification from './components/PwaUpdateNotification';
import { Shield, FileText, Github, Wallet } from 'lucide-react';
import { useI18n } from './i18n/index';
import { WalletSetup } from './components/WalletSetup';
import { WalletDashboard } from './components/WalletDashboard';
import { getWallet } from './crypto/walletManager';

type Tab = 'files' | 'wallet';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('files');
  const [isWalletUnlocked, setIsWalletUnlocked] = useState(!!getWallet());
  const { t } = useI18n();

  useEffect(() => {
    document.title = t.appTitle;
  }, [t]);

  const handleLock = () => {
    setIsWalletUnlocked(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PwaUpdateNotification />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative text-center mb-8">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <LanguageSwitcher />
          </div>
          <div className="flex justify-center items-center mb-4">
            <Shield className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">{t.appTitle}</h1>
          </div>
          <p className="text-gray-600 text-lg">{t.appSubtitle}</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'files'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Files
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'wallet'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Wallet className="w-5 h-5 inline mr-2" />
              Wallet
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'files' ? (
              <>
                <FileEncryption />
                <FileRecovery />
              </>
            ) : isWalletUnlocked ? (
              <WalletDashboard onLock={handleLock} />
            ) : (
              <WalletSetup />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <div className="flex justify-center items-center mb-2">
            <Github className="w-5 h-5 mr-2" />
            <span>{t.footerOpenSource}</span>
          </div>
          <p className="text-sm">{t.footerDescription}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
