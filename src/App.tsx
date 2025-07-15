import { useState } from 'react';
import { FileEncryption } from './components/FileEncryption';
import { FileRecovery } from './components/FileRecovery';
import { Shield, FileText, Settings, Github } from 'lucide-react';

type Tab = 'encrypt' | 'decrypt';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('encrypt');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <Shield className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">
              文件加密与秘密分享系统
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            基于 Shamir 秘密分享算法的安全文件分割与恢复工具
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <Shield className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">安全加密</h3>
            <p className="text-gray-600 text-sm">
              使用 AES-256-GCM 算法对文件进行强加密保护
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <FileText className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">智能分割</h3>
            <p className="text-gray-600 text-sm">
              将加密密钥分割成多个份额，分散存储提高安全性
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <Settings className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">灵活恢复</h3>
            <p className="text-gray-600 text-sm">
              只需要部分份额即可恢复原文件，具有良好的容错性
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
              文件加密
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
              文件恢复
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
            <span>开源项目 • 基于 TypeScript 和 React</span>
          </div>
          <p className="text-sm">
            使用 Shamir 秘密分享算法实现安全的文件分割与恢复
          </p>
        </div>
      </div>
    </div>
  );
}

export default App; 