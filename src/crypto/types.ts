// Web版本的类型定义

export interface Share {
  id: number;
  value: bigint;
}

export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  key: ArrayBuffer;
  iv: ArrayBuffer;
  salt?: ArrayBuffer; // 当使用密码时需要保存盐值
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
    originalSHA256?: string; // 原始文件的SHA256哈希
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
    originalSHA256?: string; // 原始文件的SHA256哈希
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
    iv: string; // base64编码的iv
    salt?: string; // base64编码的salt（当使用密码时）
    usePassword: boolean; // 是否使用了用户密码
    originalSHA256?: string; // 原始文件的SHA256哈希
  };
}

// 加密方案类型
export type EncryptionScheme = 'hybrid' | 'pure-shamir';

// 纯Shamir方案相关类型
export interface PureShamirShare {
  id: number;
  value: bigint;
  chunkIndex: number; // 数据块索引
  totalChunks: number; // 总数据块数
}

export interface PureShamirSplitResult {
  shares: PureShamirShare[][];
  metadata: {
    scheme: 'pure-shamir';
    threshold: number;
    totalShares: number;
    filename: string;
    originalSize: number;
    processedSize: number; // 加密后的数据大小（如果使用密码）
    chunkSize: number;
    totalChunks: number;
    usePassword: boolean;
    salt?: ArrayBuffer; // 当使用密码时的盐值
    originalSHA256?: string; // 原始文件的SHA256哈希
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
    processedSize: number; // 加密后的数据大小（如果使用密码）
    chunkSize: number;
    totalChunks: number;
    usePassword: boolean;
    salt?: ArrayBuffer; // 当使用密码时的盐值
    originalSHA256?: string; // 原始文件的SHA256哈希
  };
}

export interface PureShamirShareFile {
  shareId: number;
  shares: PureShamirShare[]; // 包含所有数据块的份额
  metadata: {
    scheme: 'pure-shamir';
    threshold: number;
    totalShares: number;
    filename: string;
    originalSize: number;
    processedSize: number; // 加密后的数据大小（如果使用密码）
    chunkSize: number;
    totalChunks: number;
    usePassword: boolean;
    salt?: string; // base64编码的盐值（当使用密码时）
    originalSHA256?: string; // 原始文件的SHA256哈希
  };
}

// 统一的分割结果类型
export type UnifiedSplitResult = FileSplitResult & { scheme: 'hybrid' } | PureShamirSplitResult;

// 统一的恢复选项类型
export type UnifiedRecoveryOptions = RecoveryOptions & { scheme: 'hybrid' } | PureShamirRecoveryOptions;

// 文件恢复结果
export interface FileRecoveryResult {
  data: ArrayBuffer;
  recoveredSHA256: string;
  filename: string;
} 