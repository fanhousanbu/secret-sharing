import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
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
        totalShares,
      };

      if (scheme === 'hybrid') {
        const result = await processor.splitFile(
          file,
          config,
          usePassword ? password : undefined
        );
        setResult({ ...result, scheme: 'hybrid' } as HybridResult);
      } else {
        const result = await processor.splitFilePureShamir(
          file,
          config,
          usePassword ? password : undefined
        );
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
        const shareFiles = processor.generateShareFiles(
          result.shares,
          result.metadata
        );
        shareFiles.forEach((shareFile, index) => {
          processor.downloadJson(shareFile, `hybrid_share_${index + 1}.json`);
        });
      } else {
        const shareFiles = processor.generatePureShamirShareFiles(
          result.shares,
          result.metadata
        );
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
    <div className="mx-auto max-w-2xl">
      <div className="p-6 bg-white rounded-lg">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          {t.fileEncryptionAndSplitting}
        </h2>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {t.selectFile}
          </label>
          <div className="p-6 text-center rounded-lg border-2 border-gray-300 border-dashed transition-colors hover:border-indigo-500">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="mx-auto mb-4 w-12 h-12 text-gray-400" />
            <p className="mb-2 text-gray-600">
              {file ? file.name : t.selectOrDrag}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-white bg-indigo-600 rounded-md transition-colors hover:bg-indigo-700"
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
          <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-800">
            <Settings className="mr-2 w-5 h-5" />
            {t.encryptionScheme}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <span className="font-medium text-gray-800">
                  {t.hybridSchemeRecommended}
                </span>
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
                <span className="font-medium text-gray-800">
                  {t.pureShamirScheme}
                </span>
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
          <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-800">
            <Settings className="mr-2 w-5 h-5" />
            {t.splittingConfig}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t.totalShares}
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={totalShares}
                onChange={e => setTotalShares(parseInt(e.target.value))}
                className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t.threshold}
              </label>
              <input
                type="number"
                min="2"
                max={totalShares}
                value={threshold}
                onChange={e => setThreshold(parseInt(e.target.value))}
                className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              onChange={e => setUsePassword(e.target.checked)}
              className="mr-2"
            />
            <label
              htmlFor="usePassword"
              className="text-sm font-medium text-gray-700"
            >
              {t.usePasswordProtectionRecommended}
            </label>
          </div>

          {usePassword && (
            <div className="p-4 space-y-4 bg-gray-50 rounded-md">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  {t.encryptionPassword}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t.passwordPlaceholder}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  {t.confirmPassword}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <div className="p-4 text-sm text-gray-600 bg-yellow-50 rounded-md">
              <p>{t.noPasswordNote1}</p>
              <p>{t.noPasswordNote2}</p>
              <p>{t.noPasswordNote3}</p>
            </div>
          )}
        </div>

        {/* Pure Shamir Scheme Info */}
        {scheme === 'pure-shamir' && (
          <div className="mb-6">
            <div className="p-4 text-sm text-gray-600 bg-blue-50 rounded-md">
              <div className="flex items-start">
                <Info className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="mb-1 font-medium text-blue-700">
                    {t.pureShamirInfo}
                  </p>
                  <p>{t.pureShamirInfoDesc1}</p>
                  <p>{t.pureShamirInfoDesc2}</p>
                  <p>{t.pureShamirInfoDesc3}</p>
                  <p>
                    {formatMessage('pureShamirInfoDesc4', {
                      usePassword: usePassword ? ' and password' : '',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center p-3 mb-4 bg-red-50 rounded-md border border-red-200">
            <AlertCircle className="mr-2 w-5 h-5 text-red-500" />
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
          <div className="p-4 mt-6 bg-green-50 rounded-md border border-green-200">
            <div className="flex items-center mb-3">
              <CheckCircle className="mr-2 w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">
                {result.scheme === 'hybrid'
                  ? t.encryptionComplete
                  : t.fileSplittingComplete}
              </span>
            </div>
            <div className="mb-4 text-sm text-gray-700">
              {result.scheme === 'hybrid' ? (
                <>
                  <p>
                    {formatMessage('encryptionCompleteDesc1', { totalShares })}
                  </p>
                  <p>
                    {formatMessage('encryptionCompleteDesc2', { threshold })}
                  </p>
                  <p>{t.encryptionCompleteDesc3}</p>
                </>
              ) : (
                <>
                  <p>
                    {formatMessage('fileSplittingCompleteDesc1', {
                      totalShares,
                    })}
                  </p>
                  <p>
                    {formatMessage('fileSplittingCompleteDesc2', { threshold })}
                  </p>
                  <p>{t.fileSplittingCompleteDesc3}</p>
                </>
              )}
              {result.metadata.originalSHA256 && (
                <details className="mt-3">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    {t.viewFileFingerprint}
                  </summary>
                  <div className="p-3 mt-2 bg-gray-50 rounded-md">
                    <p className="mb-1 font-medium text-gray-800">
                      {t.fileSHA256Fingerprint}
                    </p>
                    <p className="p-2 font-mono text-xs text-gray-600 break-all bg-white rounded">
                      {result.metadata.originalSHA256}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {t.recordSHA256Note}
                    </p>
                  </div>
                </details>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {result.scheme === 'hybrid' && (
                <button
                  onClick={downloadEncryptedFile}
                  className="flex items-center px-2 py-2 text-white whitespace-nowrap bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
                >
                  <Download className="mr-2 w-4 h-4" />
                  {t.downloadEncryptedFile}
                </button>
              )}
              <button
                onClick={downloadShareFiles}
                className="flex items-center px-2 py-2 text-white whitespace-nowrap bg-green-600 rounded-md transition-colors hover:bg-green-700"
              >
                <Download className="mr-2 w-4 h-4" />
                {t.downloadShareFiles}
              </button>
              <button
                onClick={downloadAllFiles}
                className="flex items-center px-2 py-2 text-white whitespace-nowrap bg-indigo-600 rounded-md transition-colors hover:bg-indigo-700"
              >
                <Download className="mr-2 w-4 h-4" />
                {t.downloadAll}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
