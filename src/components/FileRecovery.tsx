import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { WebFileProcessor } from '../crypto/fileProcessor';
import { EncryptionScheme, FileRecoveryResult } from '../crypto/types';
import { useI18n } from '../i18n/index';

interface RecoveryState {
  encryptedFile: File | null;
  shareFiles: File[];
  isProcessing: boolean;
  result: FileRecoveryResult | null;
  originalFilename: string;
  error: string;
  needsPassword: boolean;
  password: string;
  detectedScheme: EncryptionScheme | null;
}

export const FileRecovery: React.FC = () => {
  const { t, formatMessage } = useI18n();
  const [state, setState] = useState<RecoveryState>({
    encryptedFile: null,
    shareFiles: [],
    isProcessing: false,
    result: null,
    originalFilename: '',
    error: '',
    needsPassword: false,
    password: '',
    detectedScheme: null
  });
  const [expectedSha256, setExpectedSha256] = useState<string>('');

  const encryptedFileRef = useRef<HTMLInputElement>(null);
  const shareFilesRef = useRef<HTMLInputElement>(null);
  const processor = new WebFileProcessor();

  const handleEncryptedFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setState(prev => ({ ...prev, encryptedFile: file, error: '', result: null }));
    }
  };

  const handleShareFilesSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // 检查方案类型和是否需要密码
    let needsPassword = false;
    let detectedScheme: EncryptionScheme | null = null;
    
    if (files.length > 0) {
      try {
        const firstFile = files[0];
        const content = await firstFile.text();
        
        // 检测方案类型
        detectedScheme = processor.detectScheme(content);
        
        // 检查是否需要密码（两种方案都支持密码）
        const shareData = JSON.parse(content);
        needsPassword = shareData.metadata?.usePassword || false;
      } catch (err) {
        // 忽略解析错误，继续处理
        detectedScheme = 'hybrid'; // 默认为混合方案
      }
    }
    
    setState(prev => ({ 
      ...prev, 
      shareFiles: files, 
      error: '', 
      result: null,
      needsPassword,
      password: '',
      detectedScheme
    }));
  };

  const handleRecover = async () => {
    // 对于混合方案，需要加密文件
    if (state.detectedScheme === 'hybrid' && !state.encryptedFile) {
      setState(prev => ({ ...prev, error: t.errorHybridNeedsEncrypted }));
      return;
    }

    if (state.shareFiles.length < 2) {
      setState(prev => ({ ...prev, error: t.errorAtLeastTwoShares }));
      return;
    }

    if (state.needsPassword && !state.password) {
      setState(prev => ({ ...prev, error: t.errorPasswordNeeded }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: '' }));

    try {
      // 读取份额文件
      const shareFilesData = await Promise.all(
        state.shareFiles.map(file => file.text())
      );

      let recoveryResult: FileRecoveryResult;

      if (state.detectedScheme === 'pure-shamir') {
        // 纯Shamir方案恢复
        const recoveryOptions = processor.parsePureShamirShareFiles(shareFilesData);
        recoveryResult = await processor.recoverFilePureShamir(
          recoveryOptions,
          state.needsPassword ? state.password : undefined
        );
      } else {
        // 混合方案恢复
        if (!state.encryptedFile) {
          throw new Error('混合方案需要加密文件');
        }
        
        const encryptedData = await state.encryptedFile.arrayBuffer();
        const recoveryOptions = processor.parseShareFiles(shareFilesData);
        
        recoveryResult = await processor.recoverFile(
          encryptedData, 
          recoveryOptions, 
          state.needsPassword ? state.password : undefined
        );
      }

      setState(prev => ({
        ...prev,
        result: recoveryResult,
        originalFilename: recoveryResult.filename,
        isProcessing: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : t.errorRecoveryFailed,
        isProcessing: false
      }));
    }
  };

  const downloadRecoveredFile = () => {
    if (state.result && state.originalFilename) {
      processor.downloadFile(state.result.data, state.originalFilename);
    }
  };

  const downloadHashRecord = () => {
    if (state.result && state.originalFilename) {
      processor.downloadHashRecord(state.result, state.originalFilename);
    }
  };

  const removeEncryptedFile = () => {
    setState(prev => ({ ...prev, encryptedFile: null }));
    if (encryptedFileRef.current) {
      encryptedFileRef.current.value = '';
    }
  };

  const removeShareFile = (index: number) => {
    setState(prev => ({
      ...prev,
      shareFiles: prev.shareFiles.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.fileRecovery}</h2>
        
        {/* Encrypted File Upload - Only for hybrid scheme */}
        {state.detectedScheme !== 'pure-shamir' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.selectEncryptedFile}
              {state.detectedScheme === 'hybrid' && (
                <span className="text-sm text-gray-500 ml-2">{t.hybridSchemeRequired}</span>
              )}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
              <input
                ref={encryptedFileRef}
                type="file"
                onChange={handleEncryptedFileSelect}
                className="hidden"
                accept=".encrypted"
              />
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">
                {state.encryptedFile ? state.encryptedFile.name : t.selectEncryptedFile + ' (.encrypted)'}
              </p>
              <button
                onClick={() => encryptedFileRef.current?.click()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                {t.selectFile}
              </button>
            </div>
            {state.encryptedFile && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {state.encryptedFile.name} ({(state.encryptedFile.size / 1024).toFixed(2)} KB)
                </span>
                <button
                  onClick={removeEncryptedFile}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  {t.remove}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Scheme Detection Info */}
        {state.detectedScheme && (
          <div className="mb-6">
            <div className="text-sm text-gray-600 p-4 bg-blue-50 rounded-md">
              <div className="flex items-start">
                <Info className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-700 mb-1">
                    {t.detectedScheme}{state.detectedScheme === 'hybrid' ? t.detectedSchemeHybrid : t.detectedSchemePureShamir}
                  </p>
                  {state.detectedScheme === 'hybrid' ? (
                    <p>{t.hybridSchemeRecoveryDesc}</p>
                  ) : (
                    <p>{formatMessage('pureShamirRecoveryDesc', { needsPassword: state.needsPassword ? '和正确的密码' : '' })}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Files Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.selectShareFiles}
            {state.detectedScheme && (
              <span className="text-sm text-gray-500 ml-2">
                （{state.detectedScheme === 'hybrid' ? t.detectedSchemeHybrid : t.detectedSchemePureShamir}）
              </span>
            )}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
            <input
              ref={shareFilesRef}
              type="file"
              multiple
              onChange={handleShareFilesSelect}
              className="hidden"
              accept=".json"
            />
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-2">
              {t.multipleSelection}
            </p>
            {state.detectedScheme === 'pure-shamir' && (
              <p className="text-sm text-orange-600 mb-2">
                {t.pureShamirUploadNote}
              </p>
            )}
            <button
              onClick={() => shareFilesRef.current?.click()}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              {t.selectShareFiles}
            </button>
          </div>
          
          {/* Share Files List */}
          {state.shareFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">{t.selectedShareFiles}</h4>
                <span className="text-sm text-gray-500">
                  {formatMessage('filesCount', { count: state.shareFiles.length })}
                </span>
              </div>
              {state.shareFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <button
                    onClick={() => removeShareFile(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    {t.remove}
                  </button>
                </div>
              ))}
              {state.detectedScheme === 'pure-shamir' && (
                <div className="text-sm text-gray-600 p-2 bg-yellow-50 rounded">
                  <p>{t.pureShamirTip}</p>
                  <p>{t.pureShamirTipDesc}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Password Input */}
        {state.needsPassword && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.filePassword}
            </label>
            <input
              type="password"
              value={state.password}
              onChange={(e) => setState(prev => ({ ...prev, password: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t.passwordRequired}
            />
            <div className="mt-2 text-sm text-gray-600">
              <p>{t.passwordDetected}</p>
              <p>{t.passwordDetectedDesc}</p>
              {state.detectedScheme === 'pure-shamir' && (
                <p>{t.pureShamirPasswordNote}</p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{state.error}</span>
          </div>
        )}

        {/* Process Button */}
        <button
          onClick={handleRecover}
          disabled={
            (state.detectedScheme === 'hybrid' && !state.encryptedFile) ||
            state.shareFiles.length < 2 || 
            state.isProcessing ||
            (state.needsPassword && !state.password)
          }
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            (state.detectedScheme === 'hybrid' && !state.encryptedFile) ||
            state.shareFiles.length < 2 || 
            state.isProcessing ||
            (state.needsPassword && !state.password)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {state.isProcessing ? t.recovering : t.startRecovery}
        </button>

        {/* Result */}
        {state.result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">{t.recoveryComplete}</span>
            </div>
            <div className="text-sm text-gray-700 mb-4">
              <p>{t.recoveryCompleteDesc1}</p>
              <p>{formatMessage('recoveryCompleteDesc2', { filename: state.originalFilename })}</p>
              <p>{formatMessage('recoveryCompleteDesc3', { shareCount: state.shareFiles.length })}</p>
              {state.detectedScheme === 'hybrid' && state.encryptedFile && (
                <p>{formatMessage('recoveryCompleteDesc4', { encryptedFile: state.encryptedFile.name })}</p>
              )}
              <p>{formatMessage('recoveryCompleteDesc5', { scheme: state.detectedScheme === 'hybrid' ? t.detectedSchemeHybrid : t.detectedSchemePureShamir })}</p>
              
              {/* 文件完整性验证 */}
              {state.result && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800 mb-1">{t.verifyFileIntegrity}</p>
                  <p className="text-xs text-blue-600">
                    {t.fileRecoveredNote}
                  </p>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">{t.recoveredFileSHA256}</p>
                    <p className="text-xs text-gray-800 font-mono break-all bg-white p-1 rounded">
                      {state.result.recoveredSHA256}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">
                      {t.verifySHA256Optional}
                    </label>
                    <input
                      type="text"
                      value={expectedSha256}
                      onChange={(e) => setExpectedSha256(e.target.value)}
                      placeholder={t.sha256Placeholder}
                      className="w-full text-xs font-mono border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {expectedSha256 && (
                      <div className="mt-2 p-2 rounded text-xs" style={{
                        backgroundColor: expectedSha256.toLowerCase() === state.result.recoveredSHA256.toLowerCase() ? '#dcfce7' : '#fef2f2',
                        color: expectedSha256.toLowerCase() === state.result.recoveredSHA256.toLowerCase() ? '#166534' : '#dc2626'
                      }}>
                        {expectedSha256.toLowerCase() === state.result.recoveredSHA256.toLowerCase() ? 
                          t.sha256VerificationPass : 
                          t.sha256VerificationFail
                        }
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={downloadRecoveredFile}
                className="flex items-center px-2 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.downloadRecoveredFile}
              </button>
              <button
                onClick={downloadHashRecord}
                className="flex items-center px-2 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.downloadHashRecord}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 