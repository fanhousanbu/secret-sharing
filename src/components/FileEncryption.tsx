import React, { useState, useRef } from 'react';
import { Upload, Download, Settings, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { WebFileProcessor } from '../crypto/fileProcessor';
import { SecretSharingConfig, EncryptionScheme } from '../crypto/types';
import { useI18n } from '../i18n/index';

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
  const { t, formatMessage } = useI18n();
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
      setError(t.errorSelectFile);
      return;
    }

    if (threshold > totalShares) {
      setError(t.errorThresholdTooHigh);
      return;
    }

    if (threshold < 2) {
      setError(t.errorThresholdTooLow);
      return;
    }

    if (usePassword) {
      if (!password) {
        setError(t.errorPasswordRequired);
        return;
      }
      if (password !== confirmPassword) {
        setError(t.errorPasswordMismatch);
        return;
      }
      if (password.length < 6) {
        setError(t.errorPasswordTooShort);
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
      setError(err instanceof Error ? err.message : t.errorEncryptionFailed);
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.fileEncryptionAndSplitting}</h2>
        
        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.selectFile}
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
              {file ? file.name : t.selectOrDrag}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              {t.selectFile}
            </button>
          </div>
          {file && (
            <div className="mt-2 text-sm text-gray-600">
              {t.fileSize}: {(file.size / 1024).toFixed(2)} KB
            </div>
          )}
        </div>

        {/* Scheme Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            {t.encryptionScheme}
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
                <span className="font-medium text-gray-800">{t.hybridSchemeRecommended}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>{t.hybridSchemeDesc1}</p>
                <p>{t.hybridSchemeDesc2}</p>
                <p>{t.hybridSchemeDesc3}</p>
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
                <span className="font-medium text-gray-800">{t.pureShamirScheme}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>{t.pureShamirSchemeDesc1}</p>
                <p>{t.pureShamirSchemeDesc2}</p>
                <p>{t.pureShamirSchemeDesc3}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            {t.splittingConfig}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.totalShares}
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
                {t.threshold}
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
            {formatMessage('shareDescription', { totalShares, threshold })}
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
                {t.usePasswordProtectionRecommended}
              </label>
            </div>
          
          {usePassword && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.encryptionPassword}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t.passwordPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.confirmPassword}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t.confirmPasswordPlaceholder}
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>{t.passwordSecurityNote1}</p>
                <p>{t.passwordSecurityNote2}</p>
                <p>{t.passwordSecurityNote3}</p>
              </div>
            </div>
          )}
          
          {!usePassword && (
            <div className="text-sm text-gray-600 p-4 bg-yellow-50 rounded-md">
              <p>{t.noPasswordNote1}</p>
              <p>{t.noPasswordNote2}</p>
              <p>{t.noPasswordNote3}</p>
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
                  <p className="font-medium text-blue-700 mb-1">{t.pureShamirInfo}</p>
                  <p>{t.pureShamirInfoDesc1}</p>
                  <p>{t.pureShamirInfoDesc2}</p>
                  <p>{t.pureShamirInfoDesc3}</p>
                  <p>{formatMessage('pureShamirInfoDesc4', { usePassword: usePassword ? '和密码' : '' })}</p>
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
          {isProcessing ? t.encrypting : t.startEncryption}
        </button>

        {/* Result */}
        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                {result.scheme === 'hybrid' ? t.encryptionComplete : t.fileSplittingComplete}
              </span>
            </div>
            <div className="text-sm text-gray-700 mb-4">
              {result.scheme === 'hybrid' ? (
                <>
                  <p>{formatMessage('encryptionCompleteDesc1', { totalShares })}</p>
                  <p>{formatMessage('encryptionCompleteDesc2', { threshold })}</p>
                  <p>{t.encryptionCompleteDesc3}</p>
                </>
              ) : (
                <>
                  <p>{formatMessage('fileSplittingCompleteDesc1', { totalShares })}</p>
                  <p>{formatMessage('fileSplittingCompleteDesc2', { threshold })}</p>
                  <p>{t.fileSplittingCompleteDesc3}</p>
                </>
              )}
              {result.metadata.originalSHA256 && (
                <details className="mt-3">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    {t.viewFileFingerprint}
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="font-medium text-gray-800 mb-1">{t.fileSHA256Fingerprint}</p>
                    <p className="text-xs text-gray-600 font-mono break-all bg-white p-2 rounded">
                      {result.metadata.originalSHA256}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {t.recordSHA256Note}
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
                  {t.downloadEncryptedFile}
                </button>
              )}
              <button
                onClick={downloadShareFiles}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.downloadShareFiles}
              </button>
              <button
                onClick={downloadAllFiles}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.downloadAll}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 