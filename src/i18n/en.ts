import { TranslationKey } from './types';

export const en: TranslationKey = {
  // App component
  appTitle: 'File Encryption & Secret Sharing System',
  appSubtitle:
    'Secure file splitting and recovery tool based on Shamir secret sharing algorithm',

  // Features
  featureSecureEncryption: 'Secure Encryption',
  featureSecureEncryptionDesc:
    'Strong file protection using AES-256-GCM encryption algorithm',
  featureSmartSplitting: 'Smart Splitting',
  featureSmartSplittingDesc:
    'Split encryption keys into multiple shares, distributed storage improves security',
  featureFlexibleRecovery: 'Flexible Recovery',
  featureFlexibleRecoveryDesc:
    'Recover original files with only partial shares, providing good fault tolerance',

  // Tabs
  tabEncryption: 'File Encryption',
  tabRecovery: 'File Recovery',

  // Footer
  footerOpenSource: 'Open Source Project • Built with TypeScript and React',
  footerTechStack: 'Built with TypeScript and React',
  footerDescription:
    'Secure file splitting and recovery using Shamir secret sharing algorithm',

  // Common
  selectFile: 'Select File',
  fileName: 'File Name',
  fileSize: 'File Size',
  password: 'Password',
  confirmPassword: 'Confirm Password',
  processing: 'Processing',
  error: 'Error',
  success: 'Success',
  download: 'Download',
  remove: 'Remove',
  optional: 'Optional',
  required: 'Required',
  selectOrDrag: 'Click to select or drag and drop file here',
  multipleSelection: 'Select share files (.json) - multiple selection allowed',

  // File Encryption
  fileEncryption: 'File Encryption',
  fileEncryptionAndSplitting: 'File Encryption & Splitting',
  encryptionScheme: 'Encryption Scheme',
  hybridScheme: 'Hybrid Scheme',
  hybridSchemeRecommended: 'Hybrid Scheme (Recommended)',
  hybridSchemeDesc1: '• File encrypted with AES, only split the key',
  hybridSchemeDesc2: '• High storage efficiency, fast processing',
  hybridSchemeDesc3: '• Requires encrypted file + sufficient shares',
  pureShamirScheme: 'Pure Shamir Scheme',
  pureShamirSchemeDesc1: '• Directly split file data',
  pureShamirSchemeDesc2: '• Only sufficient shares needed for recovery',
  pureShamirSchemeDesc3:
    '• Conforms to traditional threshold encryption theory',
  splittingConfig: 'Splitting Configuration',
  totalShares: 'Total Shares (n)',
  threshold: 'Threshold (m)',
  shareDescription:
    'File will be split into {totalShares} shares, any {threshold} shares can recover the file',
  usePasswordProtection: 'Use Password Protection',
  usePasswordProtectionRecommended: 'Use Password Protection (Recommended)',
  encryptionPassword: 'Encryption Password',
  passwordPlaceholder: 'Enter at least 6 characters',
  confirmPasswordPlaceholder: 'Re-enter password',
  passwordSecurityNote1: '• Password protection provides dual security',
  passwordSecurityNote2: '• Even with shares, cannot recover without password',
  passwordSecurityNote3:
    '• Must remember password, cannot be recovered if forgotten',
  noPasswordNote1: '• Without password, only share files provide protection',
  noPasswordNote2: '• Anyone with sufficient shares can recover the file',
  noPasswordNote3:
    '• Recommend enabling password protection for enhanced security',
  pureShamirInfo: 'Pure Shamir Scheme Features:',
  pureShamirInfoDesc1:
    '• Directly split file data, no additional encrypted file needed',
  pureShamirInfoDesc2:
    '• Conforms to traditional threshold secret sharing theory',
  pureShamirInfoDesc3: '• Optional password protection available',
  pureShamirInfoDesc4:
    '• Anyone with sufficient shares{usePassword} can recover the file',
  startEncryption: 'Start Encryption',
  encrypting: 'Encrypting...',
  encryptionComplete: 'Encryption Complete!',
  encryptionCompleteDesc1:
    '• File successfully encrypted and split into {totalShares} shares',
  encryptionCompleteDesc2:
    '• Need encrypted file + any {threshold} shares to recover original file',
  encryptionCompleteDesc3:
    '• Please download all files and store them securely',
  fileSplittingComplete: 'File Splitting Complete!',
  fileSplittingCompleteDesc1: '• File directly split into {totalShares} shares',
  fileSplittingCompleteDesc2:
    '• Only need any {threshold} shares to recover original file',
  fileSplittingCompleteDesc3: '• No additional encrypted file needed',
  viewFileFingerprint: '📋 View File Fingerprint',
  fileSHA256Fingerprint: 'File SHA256 Fingerprint:',
  recordSHA256Note:
    '💡 Please record this SHA256 value for manual file integrity verification during recovery.',
  downloadEncryptedFile: 'Download Encrypted File',
  downloadShareFiles: 'Download Share Files',
  downloadAll: 'Download All',

  // File Recovery
  fileRecovery: 'File Recovery',
  selectEncryptedFile: 'Select Encrypted File',
  hybridSchemeRequired: '(Required for hybrid scheme)',
  detectedScheme: 'Detected scheme:',
  detectedSchemeHybrid: 'Hybrid Scheme',
  detectedSchemePureShamir: 'Pure Shamir Scheme',
  hybridSchemeRecoveryDesc:
    'Need encrypted file and sufficient share files to recover original file',
  pureShamirRecoveryDesc:
    'Only need sufficient share files{needsPassword} to recover original file, no encrypted file needed',
  selectShareFiles: 'Select Share Files',
  pureShamirUploadNote:
    'Pure Shamir scheme needs sufficient share files (usually threshold number)',
  selectedShareFiles: 'Selected Share Files:',
  filesCount: '{count} files',
  pureShamirTip:
    '💡 Tip: Pure Shamir scheme usually needs same number of shares as threshold',
  pureShamirTipDesc:
    'If recovery fails, try uploading more different share files',
  filePassword: 'File Password',
  passwordDetected: '• Detected password protection for this file',
  passwordDetectedDesc: '• Please enter the password set during encryption',
  pureShamirPasswordNote:
    '• Pure Shamir scheme: password and shares jointly protect file security',
  passwordRequired: 'Enter the password used during file encryption',
  passwordRequiredDesc: 'This file requires a password, please enter it',
  startRecovery: 'Start Recovery',
  recovering: 'Recovering...',
  recoveryComplete: 'Recovery Complete!',
  recoveryCompleteDesc1: '• File successfully recovered',
  recoveryCompleteDesc2: '• Original filename: {filename}',
  recoveryCompleteDesc3: '• Used {shareCount} share files',
  recoveryCompleteDesc4: '• Used encrypted file: {encryptedFile}',
  recoveryCompleteDesc5: '• Recovery scheme: {scheme}',
  verifyFileIntegrity: '💡 Verify File Integrity',
  fileRecoveredNote:
    'File successfully recovered. If you have the original file SHA256 value, you can manually verify file integrity above.',
  recoveredFileSHA256: 'Recovered File SHA256:',
  verifySHA256Optional: 'Verify SHA256 (Optional):',
  sha256Placeholder: 'Enter expected SHA256 value for verification...',
  sha256VerificationPass:
    '✅ SHA256 verification passed: File integrity confirmed',
  sha256VerificationFail:
    '❌ SHA256 verification failed: File may be corrupted or tampered',
  downloadRecoveredFile: 'Download Recovered File',
  downloadHashRecord: 'Download Hash Record',

  // Errors
  errorSelectFile: 'Please select a file to encrypt',
  errorThresholdTooHigh: 'Threshold cannot be greater than total shares',
  errorThresholdTooLow: 'Threshold must be at least 2',
  errorPasswordRequired: 'Please enter a password',
  errorPasswordMismatch: 'Passwords do not match',
  errorPasswordTooShort: 'Password must be at least 6 characters',
  errorEncryptionFailed: 'Error occurred during encryption',
  errorHybridNeedsEncrypted: 'Hybrid scheme requires encrypted file',
  errorAtLeastTwoShares: 'At least 2 share files required',
  errorPasswordNeeded: 'This file requires a password, please enter it',
  errorRecoveryFailed: 'Error occurred during recovery',
};
