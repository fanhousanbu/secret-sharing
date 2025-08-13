import {
  encryptData,
  decryptData,
  decryptDataWithPassword,
  arrayBufferToBigInt,
  bigIntToArrayBuffer,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  calculateSHA256,
} from './webCrypto';
import { splitSecret, recoverSecret } from './shamir';
import {
  FileSplitResult,
  RecoveryOptions,
  SecretSharingConfig,
  Share,
  ShareFile,
  PureShamirSplitResult,
  PureShamirRecoveryOptions,
  PureShamirShare,
  PureShamirShareFile,
  EncryptionScheme,
  FileRecoveryResult,
} from './types';

/**
 * Web version file processor
 */
export class WebFileProcessor {
  // Pure Shamir scheme data chunk size (bytes)
  private static readonly CHUNK_SIZE = 32; // 32 bytes = 256 bits

  /**
 * Convert ArrayBuffer to bigint array (split by chunks)
 */
  private arrayBufferToBigIntChunks(buffer: ArrayBuffer): bigint[] {
    const uint8Array = new Uint8Array(buffer);
    const chunks: bigint[] = [];

    for (let i = 0; i < uint8Array.length; i += WebFileProcessor.CHUNK_SIZE) {
      // Create fixed-size chunks (32 bytes)
      const chunkBytes = new Uint8Array(WebFileProcessor.CHUNK_SIZE);
      const actualChunkSize = Math.min(
        WebFileProcessor.CHUNK_SIZE,
        uint8Array.length - i
      );

      // Copy actual data
      for (let j = 0; j < actualChunkSize; j++) {
        chunkBytes[j] = uint8Array[i + j];
      }

      // Convert byte array to bigint (little-endian)
      let bigintValue = 0n;
      for (let j = WebFileProcessor.CHUNK_SIZE - 1; j >= 0; j--) {
        bigintValue = (bigintValue << 8n) + BigInt(chunkBytes[j]);
      }

      chunks.push(bigintValue);
    }

    return chunks;
  }

  /**
 * Convert bigint array to ArrayBuffer
 */
  private bigIntChunksToArrayBuffer(
    chunks: bigint[],
    originalSize: number
  ): ArrayBuffer {
    const result = new Uint8Array(originalSize);
    let offset = 0;

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];

      // Convert bigint to byte array (fixed 32 bytes)
      const chunkBytes = new Uint8Array(WebFileProcessor.CHUNK_SIZE);
      let value = chunk;

      // Fill bytes from high to low (little-endian)
      for (let i = 0; i < WebFileProcessor.CHUNK_SIZE; i++) {
        chunkBytes[i] = Number(value & 0xffn);
        value = value >> 8n;
      }

      // Calculate number of bytes to copy
      const remainingBytes = originalSize - offset;
      const bytesToCopy = Math.min(WebFileProcessor.CHUNK_SIZE, remainingBytes);

      // Copy to result array
      for (let i = 0; i < bytesToCopy; i++) {
        result[offset + i] = chunkBytes[i];
      }

      offset += bytesToCopy;
      if (offset >= originalSize) break;
    }

    return result.buffer;
  }

  /**
 * Pure Shamir scheme: directly split file
 */
  async splitFilePureShamir(
    file: File,
    config: SecretSharingConfig,
    userPassword?: string
  ): Promise<PureShamirSplitResult> {
    // Read file data
    let fileData = await file.arrayBuffer();
    let salt: ArrayBuffer | undefined;

    // Calculate SHA256 hash of original file
    const originalSHA256 = await calculateSHA256(fileData);

    // If password is provided, encrypt file data first
    if (userPassword) {
      const encryptionResult = await encryptData(fileData, userPassword);

      // Append IV to the beginning of encrypted data, so it will also be split
      const ivBytes = new Uint8Array(encryptionResult.iv);
      const encryptedBytes = new Uint8Array(encryptionResult.encryptedData);
      const combinedData = new Uint8Array(
        ivBytes.length + encryptedBytes.length
      );
      combinedData.set(ivBytes, 0);
      combinedData.set(encryptedBytes, ivBytes.length);

      fileData = combinedData.buffer;
      salt = encryptionResult.salt;
    }

    // Convert file data to bigint array by chunks
    const chunks = this.arrayBufferToBigIntChunks(fileData);

    // Create Shamir split for each data chunk
    const allShares: PureShamirShare[][] = [];

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunkShares = splitSecret(chunks[chunkIndex], config);

      // Convert to PureShamirShare format
      const pureShamirShares = chunkShares.map(share => ({
        id: share.id,
        value: share.value,
        chunkIndex,
        totalChunks: chunks.length,
      }));

      allShares.push(pureShamirShares);
    }

    return {
      shares: allShares,
      metadata: {
        scheme: 'pure-shamir',
        threshold: config.threshold,
        totalShares: config.totalShares,
        filename: file.name,
        originalSize: file.size, // Original file size
        processedSize: fileData.byteLength, // Size of encrypted data (if using password)
        chunkSize: WebFileProcessor.CHUNK_SIZE,
        totalChunks: chunks.length,
        usePassword: !!userPassword,
        salt,
        originalSHA256,
      },
    };
  }

  /**
 * Create file recovery result
 */
  private async createRecoveryResult(
    data: ArrayBuffer,
    filename: string
  ): Promise<FileRecoveryResult> {
    const recoveredSHA256 = await calculateSHA256(data);

    return {
      data,
      recoveredSHA256,
      filename,
    };
  }

  /**
 * Pure Shamir scheme: recover file from shares
 */
  async recoverFilePureShamir(
    options: PureShamirRecoveryOptions,
    userPassword?: string
  ): Promise<FileRecoveryResult> {
    const { shares, metadata } = options;

    // Check password requirements
    if (metadata.usePassword && !userPassword) {
      throw new Error('This file is password protected, please provide the correct password');
    }

    if (!metadata.usePassword && userPassword) {
      throw new Error('This file is not password protected, no password needed');
    }

    // Validate share data structure
    if (shares.length < metadata.totalChunks) {
      throw new Error('Share data incomplete');
    }

    // Count actual available share files
    const availableShareIds = new Set<number>();
    shares.forEach(chunkShares => {
      chunkShares.forEach(share => {
        availableShareIds.add(share.id);
      });
    });

    if (availableShareIds.size < metadata.threshold) {
      throw new Error(
        `Insufficient share files, need at least ${metadata.threshold} different share files, currently only have ${availableShareIds.size}. Please upload more share files.`
      );
    }

    // Recover by data chunks
    const recoveredChunks: bigint[] = [];

    for (let chunkIndex = 0; chunkIndex < metadata.totalChunks; chunkIndex++) {
      // Get all shares for current chunk
      const chunkShares: Share[] = [];

      if (chunkIndex < shares.length) {
        shares[chunkIndex].forEach(share => {
          chunkShares.push({
            id: share.id,
            value: share.value,
          });
        });
      }

      // Validate share count
      if (chunkShares.length < metadata.threshold) {
        throw new Error(
          `Insufficient shares for data chunk ${chunkIndex}, need at least ${metadata.threshold} shares, currently only have ${chunkShares.length}`
        );
      }

      // Recover current chunk
      const recoveredChunk = recoverSecret(chunkShares, metadata.threshold);
      recoveredChunks.push(recoveredChunk);
    }

    // Calculate actual size of recovered data
    // For password-protected cases, we need to recover all data chunks (including IV + encrypted data)
    const actualDataSize = metadata.usePassword
      ? metadata.processedSize
      : metadata.originalSize;

    // Convert recovered data chunks to ArrayBuffer
    let recoveredData = this.bigIntChunksToArrayBuffer(
      recoveredChunks,
      actualDataSize
    );

    // If password is used, need to decrypt
    if (metadata.usePassword && userPassword && metadata.salt) {
      try {
        // Extract IV (first 12 bytes) and encrypted data from recovered data
        const combinedData = new Uint8Array(recoveredData);
        const ivSize = 12; // AES-GCM IV size

        if (combinedData.length < ivSize) {
          throw new Error('Data corruption: insufficient length');
        }

        const iv = combinedData.slice(0, ivSize);
        const encryptedData = combinedData.slice(ivSize);

        recoveredData = await decryptDataWithPassword(
          encryptedData.buffer,
          userPassword,
          metadata.salt,
          iv.buffer
        );
      } catch (error) {
        throw new Error('Password error or data corruption');
      }
    }

    return this.createRecoveryResult(recoveredData, metadata.filename);
  }

  /**
 * Generate share files for pure Shamir scheme
 */
  generatePureShamirShareFiles(
    shares: PureShamirShare[][],
    metadata: any
  ): PureShamirShareFile[] {
    const shareFiles: PureShamirShareFile[] = [];

    // Organize data by share ID
    for (let shareId = 1; shareId <= metadata.totalShares; shareId++) {
      const shareData: PureShamirShare[] = [];

      // Collect parts of this share in all data chunks
      for (let chunkIndex = 0; chunkIndex < shares.length; chunkIndex++) {
        const chunkShares = shares[chunkIndex];
        const shareForChunk = chunkShares.find(s => s.id === shareId);

        if (shareForChunk) {
          shareData.push(shareForChunk);
        }
      }

      shareFiles.push({
        shareId,
        shares: shareData,
        metadata: {
          ...metadata,
          scheme: 'pure-shamir' as const,
          salt: metadata.salt ? arrayBufferToBase64(metadata.salt) : undefined,
        },
      });
    }

    return shareFiles;
  }

  /**
 * Parse share files for pure Shamir scheme
 */
  parsePureShamirShareFiles(
    shareFilesData: string[]
  ): PureShamirRecoveryOptions {
    const allShares: PureShamirShare[][] = [];
    let metadata: any = null;

    // Parse each share file
    for (const shareFileData of shareFilesData) {
      const shareFile: PureShamirShareFile = JSON.parse(
        shareFileData,
        (key, value) => {
          if (key === 'value' && typeof value === 'string') {
            return BigInt(value);
          }
          return value;
        }
      );

      // Set metadata
      if (!metadata) {
        metadata = {
          ...shareFile.metadata,
          salt: shareFile.metadata.salt
            ? base64ToArrayBuffer(shareFile.metadata.salt)
            : undefined,
        };
        // Initialize share array organized by data chunks
        for (let i = 0; i < metadata.totalChunks; i++) {
          allShares[i] = [];
        }
      }

      // Organize shares by data chunks
      for (const share of shareFile.shares) {
        if (share.chunkIndex < allShares.length) {
          allShares[share.chunkIndex].push(share);
        }
      }
    }

    return { shares: allShares, metadata };
  }

  /**
   * Detects the scheme type of the share file
   */
  detectScheme(shareFileData: string): EncryptionScheme {
    try {
      const shareFile = JSON.parse(shareFileData);

      // Check if the scheme field is included
      if (shareFile.metadata && shareFile.metadata.scheme) {
        return shareFile.metadata.scheme;
      }

      // Check if it contains features of pure Shamir scheme
      if (
        shareFile.shareId &&
        shareFile.shares &&
        Array.isArray(shareFile.shares)
      ) {
        return 'pure-shamir';
      }

      // Default to hybrid scheme
      return 'hybrid';
    } catch (error) {
      return 'hybrid';
    }
  }

  /**
   * Encrypts and splits the file
   * @param file The file to encrypt
   * @param config Splitting configuration
   * @param userPassword User password (optional)
   */
  async splitFile(
    file: File,
    config: SecretSharingConfig,
    userPassword?: string
  ): Promise<FileSplitResult> {
    // Read file data
    const fileData = await file.arrayBuffer();

    // Calculate SHA256 hash of original file
    const originalSHA256 = await calculateSHA256(fileData);

    // Encrypt file
    const encryptionResult = await encryptData(fileData, userPassword);

    // Convert encryption key to bigint for splitting
    const keyBigInt = arrayBufferToBigInt(encryptionResult.key);

    // Split key
    const keyShares = splitSecret(keyBigInt, config);

    return {
      shares: keyShares,
      metadata: {
        threshold: config.threshold,
        totalShares: config.totalShares,
        filename: file.name,
        originalSize: file.size,
        iv: encryptionResult.iv,
        salt: encryptionResult.salt,
        usePassword: !!userPassword,
        originalSHA256,
      },
      encryptedData: encryptionResult.encryptedData,
    } as FileSplitResult & { encryptedData: ArrayBuffer };
  }

  /**
   * Recovers file from shares
   * @param encryptedData Encrypted file data
   * @param options Recovery options
   * @param userPassword User password (required when using password encryption)
   */
  async recoverFile(
    encryptedData: ArrayBuffer,
    options: RecoveryOptions,
    userPassword?: string
  ): Promise<FileRecoveryResult> {
    const { shares, metadata } = options;

    // Validate share count
    if (shares.length < metadata.threshold) {
      throw new Error(`Need at least ${metadata.threshold} shares to recover file`);
    }

    // Check if password is required
    if (metadata.usePassword && !userPassword) {
      throw new Error('This file is password encrypted, please provide the correct password');
    }

    if (!metadata.usePassword && userPassword) {
      throw new Error('This file is not password encrypted, no password needed');
    }

    let decryptedData: ArrayBuffer;

    if (metadata.usePassword && userPassword && metadata.salt) {
      // Decrypt with password (no key recovery needed)
      decryptedData = await decryptDataWithPassword(
        encryptedData,
        userPassword,
        metadata.salt,
        metadata.iv
      );
    } else {
      // Recover key from shares and decrypt
      const recoveredKeyBigInt = recoverSecret(shares, metadata.threshold);
      const recoveredKey = bigIntToArrayBuffer(recoveredKeyBigInt, 32);
      decryptedData = await decryptData(
        encryptedData,
        recoveredKey,
        metadata.iv
      );
    }

    return this.createRecoveryResult(decryptedData, metadata.filename);
  }

  /**
   * Generates share file download data
   */
  generateShareFiles(shares: Share[], metadata: any): ShareFile[] {
    return shares.map(share => ({
      share,
      metadata: {
        ...metadata,
        iv: arrayBufferToBase64(metadata.iv),
        salt: metadata.salt ? arrayBufferToBase64(metadata.salt) : undefined,
      },
    }));
  }

  /**
   * Parses share files
   */
  parseShareFiles(shareFilesData: string[]): RecoveryOptions {
    const shares: Share[] = [];
    let metadata: any = null;

    for (const shareFileData of shareFilesData) {
      const shareFile: ShareFile = JSON.parse(shareFileData, (key, value) => {
        if (key === 'value' && typeof value === 'string') {
          return BigInt(value);
        }
        return value;
      });

      shares.push(shareFile.share);

      if (!metadata) {
        metadata = {
          ...shareFile.metadata,
          iv: base64ToArrayBuffer(shareFile.metadata.iv),
          salt: shareFile.metadata.salt
            ? base64ToArrayBuffer(shareFile.metadata.salt)
            : undefined,
        };
      }
    }

    return { shares, metadata };
  }

  /**
   * Downloads a file
   */
  downloadFile(
    data: ArrayBuffer,
    filename: string,
    mimeType: string = 'application/octet-stream'
  ) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Downloads a JSON file
   */
  downloadJson(data: any, filename: string) {
    const jsonString = JSON.stringify(
      data,
      (_key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      },
      2
    );

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Downloads a hash record file
   */
  downloadHashRecord(result: FileRecoveryResult, originalFilename: string) {
    const hashRecord = {
      filename: originalFilename,
      recoveredFilename: result.filename,
      recoveredSHA256: result.recoveredSHA256,
      timestamp: new Date().toISOString(),
      note: 'File successfully recovered, integrity can be verified via SHA256',
    };

    const jsonString = JSON.stringify(hashRecord, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${originalFilename}_hash_record.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
