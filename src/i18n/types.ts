export type Language = 'en' | 'zh';

export interface TranslationKey {
  // App component
  appTitle: string;
  appSubtitle: string;

  // Features
  featureSecureEncryption: string;
  featureSecureEncryptionDesc: string;
  featureSmartSplitting: string;
  featureSmartSplittingDesc: string;
  featureFlexibleRecovery: string;
  featureFlexibleRecoveryDesc: string;

  // Tabs
  tabEncryption: string;
  tabRecovery: string;

  // Footer
  footerOpenSource: string;
  footerTechStack: string;
  footerDescription: string;

  // Common
  selectFile: string;
  fileName: string;
  fileSize: string;
  password: string;
  confirmPassword: string;
  processing: string;
  error: string;
  success: string;
  download: string;
  remove: string;
  optional: string;
  required: string;
  selectOrDrag: string;
  multipleSelection: string;

  // File Encryption
  fileEncryption: string;
  fileEncryptionAndSplitting: string;
  encryptionScheme: string;
  hybridScheme: string;
  hybridSchemeRecommended: string;
  hybridSchemeDesc1: string;
  hybridSchemeDesc2: string;
  hybridSchemeDesc3: string;
  pureShamirScheme: string;
  pureShamirSchemeDesc1: string;
  pureShamirSchemeDesc2: string;
  pureShamirSchemeDesc3: string;
  splittingConfig: string;
  totalShares: string;
  threshold: string;
  shareDescription: string;
  usePasswordProtection: string;
  usePasswordProtectionRecommended: string;
  encryptionPassword: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  passwordSecurityNote1: string;
  passwordSecurityNote2: string;
  passwordSecurityNote3: string;
  noPasswordNote1: string;
  noPasswordNote2: string;
  noPasswordNote3: string;
  pureShamirInfo: string;
  pureShamirInfoDesc1: string;
  pureShamirInfoDesc2: string;
  pureShamirInfoDesc3: string;
  pureShamirInfoDesc4: string;
  startEncryption: string;
  encrypting: string;
  encryptionComplete: string;
  encryptionCompleteDesc1: string;
  encryptionCompleteDesc2: string;
  encryptionCompleteDesc3: string;
  fileSplittingComplete: string;
  fileSplittingCompleteDesc1: string;
  fileSplittingCompleteDesc2: string;
  fileSplittingCompleteDesc3: string;
  viewFileFingerprint: string;
  fileSHA256Fingerprint: string;
  recordSHA256Note: string;
  downloadEncryptedFile: string;
  downloadShareFiles: string;
  downloadAll: string;

  // File Recovery
  fileRecovery: string;
  selectEncryptedFile: string;
  hybridSchemeRequired: string;
  detectedScheme: string;
  detectedSchemeHybrid: string;
  detectedSchemePureShamir: string;
  hybridSchemeRecoveryDesc: string;
  pureShamirRecoveryDesc: string;
  selectShareFiles: string;
  pureShamirUploadNote: string;
  selectedShareFiles: string;
  filesCount: string;
  pureShamirTip: string;
  pureShamirTipDesc: string;
  filePassword: string;
  passwordDetected: string;
  passwordDetectedDesc: string;
  pureShamirPasswordNote: string;
  passwordRequired: string;
  passwordRequiredDesc: string;
  startRecovery: string;
  recovering: string;
  recoveryComplete: string;
  recoveryCompleteDesc1: string;
  recoveryCompleteDesc2: string;
  recoveryCompleteDesc3: string;
  recoveryCompleteDesc4: string;
  recoveryCompleteDesc5: string;
  verifyFileIntegrity: string;
  fileRecoveredNote: string;
  recoveredFileSHA256: string;
  verifySHA256Optional: string;
  sha256Placeholder: string;
  sha256VerificationPass: string;
  sha256VerificationFail: string;
  downloadRecoveredFile: string;
  downloadHashRecord: string;

  // Errors
  errorSelectFile: string;
  errorThresholdTooHigh: string;
  errorThresholdTooLow: string;
  errorPasswordRequired: string;
  errorPasswordMismatch: string;
  errorPasswordTooShort: string;
  errorEncryptionFailed: string;
  errorHybridNeedsEncrypted: string;
  errorAtLeastTwoShares: string;
  errorPasswordNeeded: string;
  errorRecoveryFailed: string;
}

export interface Translations {
  [key: string]: TranslationKey;
}
