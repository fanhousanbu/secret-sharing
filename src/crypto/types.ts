// Web version type definitions

export interface Share {
  id: number;
  value: bigint;
}

export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  key: ArrayBuffer;
  iv: ArrayBuffer;
  salt?: ArrayBuffer; // Salt value to save when using password
}

export interface FileSplitResult {
  shares: Share[];
  metadata: {
    threshold: number;
    totalShares: number;
    filename: string;
    originalSize: number;
    iv: ArrayBuffer;
    salt?: ArrayBuffer;
    usePassword: boolean;
    originalSHA256?: string; // SHA256 hash of original file
  };
}

export interface RecoveryOptions {
  shares: Share[];
  metadata: {
    threshold: number;
    totalShares: number;
    filename: string;
    originalSize: number;
    iv: ArrayBuffer;
    salt?: ArrayBuffer;
    usePassword: boolean;
    originalSHA256?: string; // SHA256 hash of original file
  };
}

export interface SecretSharingConfig {
  threshold: number;
  totalShares: number;
}

export interface ShareFile {
  share: Share;
  metadata: {
    threshold: number;
    totalShares: number;
    filename: string;
    originalSize: number;
    iv: string; // base64 encoded iv
    salt?: string; // base64 encoded salt (when using password)
    usePassword: boolean; // whether user password is used
    originalSHA256?: string; // SHA256 hash of original file
  };
}

// Encryption scheme types
export type EncryptionScheme = 'hybrid' | 'pure-shamir';

// Pure Shamir scheme related types
export interface PureShamirShare {
  id: number;
  value: bigint;
  chunkIndex: number; // Data chunk index
  totalChunks: number; // Total number of data chunks
}

export interface PureShamirSplitResult {
  shares: PureShamirShare[][];
  metadata: {
    scheme: 'pure-shamir';
    threshold: number;
    totalShares: number;
    filename: string;
    originalSize: number;
    processedSize: number; // Size of encrypted data (if using password)
    chunkSize: number;
    totalChunks: number;
    usePassword: boolean;
    salt?: ArrayBuffer; // Salt value when using password
    originalSHA256?: string; // SHA256 hash of original file
  };
}

export interface PureShamirRecoveryOptions {
  shares: PureShamirShare[][];
  metadata: {
    scheme: 'pure-shamir';
    threshold: number;
    totalShares: number;
    filename: string;
    originalSize: number;
    processedSize: number; // Size of encrypted data (if using password)
    chunkSize: number;
    totalChunks: number;
    usePassword: boolean;
    salt?: ArrayBuffer; // Salt value when using password
    originalSHA256?: string; // SHA256 hash of original file
  };
}

export interface PureShamirShareFile {
  shareId: number;
  shares: PureShamirShare[]; // Shares containing all data chunks
  metadata: {
    scheme: 'pure-shamir';
    threshold: number;
    totalShares: number;
    filename: string;
    originalSize: number;
    processedSize: number; // Size of encrypted data (if using password)
    chunkSize: number;
    totalChunks: number;
    usePassword: boolean;
    salt?: string; // base64 encoded salt value (when using password)
    originalSHA256?: string; // SHA256 hash of original file
  };
}

// Unified split result types
export type UnifiedSplitResult =
  | (FileSplitResult & { scheme: 'hybrid' })
  | PureShamirSplitResult;

// Unified recovery option types
export type UnifiedRecoveryOptions =
  | (RecoveryOptions & { scheme: 'hybrid' })
  | PureShamirRecoveryOptions;

// File recovery result
export interface FileRecoveryResult {
  data: ArrayBuffer;
  recoveredSHA256: string;
  filename: string;
}
