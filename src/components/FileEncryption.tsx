import React, { useState, useRef } from 'react';
import { Upload, Download, Settings, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { WebFileProcessor } from '../crypto/fileProcessor';
import { SecretSharingConfig, EncryptionScheme } from '../crypto/types';

interface HybridResult {
  shares: any[];
  metadata: any;
  encryptedData: ArrayBuffer;
  scheme: 'hybrid';
}

interface PureShamirResult {
  shares: any[][];
  metadata: any;
  scheme: 'pure-shamir';
}

type EncryptionResult = HybridResult | PureShamirResult;

export const FileEncryption: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState<number>(3);
  const [totalShares, setTotalShares] = useState<number>(5);
  const [scheme, setScheme] = useState<EncryptionScheme>('hybrid');
  const [usePassword, setUsePassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<EncryptionResult | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processor = new WebFileProcessor();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleEncrypt = async () => {
    if (!file) {
      setError('请选择要加密的文件');
      return;
    }

    if (threshold > totalShares) {
      setError('阈值不能大于总份额数');
      return;
    }

    if (threshold < 2) {
      setError('阈值必须至少为2');
      return;
    }

    if (usePassword) {
      if (!password) {
        setError('请输入密码');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
      if (password.length < 6) {
        setError('密码长度至少6位');
        return;
      }
    }

    setIsProcessing(true);
    setError('');

    try {
      const config: SecretSharingConfig = {
        threshold,
        totalShares
      };

      if (scheme === 'hybrid') {
        const result = await processor.splitFile(file, config, usePassword ? password : undefined);
        setResult({ ...result, scheme: 'hybrid' } as HybridResult);
      } else {
        const result = await processor.splitFilePureShamir(file, config, usePassword ? password : undefined);
        setResult({ ...result, scheme: 'pure-shamir' } as PureShamirResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加密过程中发生错误');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadEncryptedFile = () => {
    if (result && file && result.scheme === 'hybrid') {
      processor.downloadFile(
        (result as HybridResult).encryptedData,
        `${file.name}.encrypted`,
        'application/octet-stream'
      );
    }
  };

  const downloadShareFiles = () => {
    if (result) {
      if (result.scheme === 'hybrid') {
        const shareFiles = processor.generateShareFiles(result.shares, result.metadata);
        shareFiles.forEach((shareFile, index) => {
          processor.downloadJson(shareFile, `hybrid_share_${index + 1}.json`);
        });
      } else {
        const shareFiles = processor.generatePureShamirShareFiles(result.shares, result.metadata);
        shareFiles.forEach((shareFile, index) => {
          processor.downloadJson(shareFile, `pure_share_${index + 1}.json`);
        });
      }
    }
  };

  const downloadAllFiles = () => {
    if (result?.scheme === 'hybrid') {
      downloadEncryptedFile();
    }
    downloadShareFiles();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">文件加密与分割</h2>
        
        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择文件
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {file ? file.name : '点击选择文件或拖拽文件到此处'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              选择文件
            </button>
          </div>
          {file && (
            <div className="mt-2 text-sm text-gray-600">
              文件大小: {(file.size / 1024).toFixed(2)} KB
            </div>
          )}
        </div>

        {/* Scheme Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            加密方案
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                scheme === 'hybrid' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setScheme('hybrid')}
            >
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  name="scheme"
                  value="hybrid"
                  checked={scheme === 'hybrid'}
                  onChange={() => setScheme('hybrid')}
                  className="mr-2"
                />
                <span className="font-medium text-gray-800">混合方案（推荐）</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>• 文件用AES加密，只分割密钥</p>
                <p>• 存储效率高，处理速度快</p>
                <p>• 需要加密文件 + 足够份额</p>
              </div>
            </div>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                scheme === 'pure-shamir' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setScheme('pure-shamir')}
            >
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  name="scheme"
                  value="pure-shamir"
                  checked={scheme === 'pure-shamir'}
                  onChange={() => setScheme('pure-shamir')}
                  className="mr-2"
                />
                <span className="font-medium text-gray-800">纯Shamir方案</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>• 直接分割文件数据</p>
                <p>• 只需要足够份额即可恢复</p>
                <p>• 符合传统阈值加密理论</p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            分割配置
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                总份额数 (n)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={totalShares}
                onChange={(e) => setTotalShares(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                阈值 (m)
              </label>
              <input
                type="number"
                min="2"
                max={totalShares}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            文件将被分成 {totalShares} 份，需要任意 {threshold} 份即可恢复
          </div>
        </div>

        {/* Password Configuration */}
        <div className="mb-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="usePassword"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="usePassword" className="text-sm font-medium text-gray-700">
                使用密码保护（推荐）
              </label>
            </div>
          
          {usePassword && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  加密密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="请输入至少6位密码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="请再次输入密码"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>• 使用密码保护可以提供双重安全保障</p>
                <p>• 即使有份额文件，没有密码也无法恢复文件</p>
                <p>• 请务必记住密码，遗忘后无法恢复</p>
              </div>
            </div>
          )}
          
          {!usePassword && (
            <div className="text-sm text-gray-600 p-4 bg-yellow-50 rounded-md">
              <p>• 不使用密码时，仅依靠份额文件进行保护</p>
              <p>• 获得足够份额的人可以恢复文件</p>
              <p>• 建议启用密码保护以提高安全性</p>
            </div>
          )}
        </div>

        {/* Pure Shamir Scheme Info */}
        {scheme === 'pure-shamir' && (
          <div className="mb-6">
            <div className="text-sm text-gray-600 p-4 bg-blue-50 rounded-md">
              <div className="flex items-start">
                <Info className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-700 mb-1">纯Shamir方案特点：</p>
                  <p>• 直接分割文件数据，无需额外的加密文件</p>
                  <p>• 符合传统阈值秘密分享理论</p>
                  <p>• 可选择是否使用密码额外保护</p>
                  <p>• 获得足够份额{usePassword ? '和密码' : ''}的人可以恢复文件</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Process Button */}
        <button
          onClick={handleEncrypt}
          disabled={!file || isProcessing}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            !file || isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isProcessing ? '正在加密...' : '开始加密'}
        </button>

        {/* Result */}
        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                {result.scheme === 'hybrid' ? '加密完成！' : '文件分割完成！'}
              </span>
            </div>
            <div className="text-sm text-gray-700 mb-4">
              {result.scheme === 'hybrid' ? (
                <>
                  <p>• 文件已成功加密并分割为 {totalShares} 份</p>
                  <p>• 需要加密文件 + 任意 {threshold} 份即可恢复原文件</p>
                  <p>• 请下载所有文件并妥善保管</p>
                </>
              ) : (
                <>
                  <p>• 文件已直接分割为 {totalShares} 份</p>
                  <p>• 仅需要任意 {threshold} 份即可恢复原文件</p>
                  <p>• 无需额外的加密文件</p>
                </>
              )}
              {result.metadata.originalSHA256 && (
                <details className="mt-3">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    📋 查看文件指纹信息
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="font-medium text-gray-800 mb-1">文件SHA256指纹：</p>
                    <p className="text-xs text-gray-600 font-mono break-all bg-white p-2 rounded">
                      {result.metadata.originalSHA256}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 请记录此SHA256值，在恢复文件时可以手动验证文件完整性。
                    </p>
                  </div>
                </details>
              )}
            </div>
            <div className="flex space-x-3">
              {result.scheme === 'hybrid' && (
                <button
                  onClick={downloadEncryptedFile}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载加密文件
                </button>
              )}
              <button
                onClick={downloadShareFiles}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                下载份额文件
              </button>
              <button
                onClick={downloadAllFiles}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                下载全部
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 