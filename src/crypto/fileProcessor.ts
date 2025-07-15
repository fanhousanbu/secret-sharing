import { encryptData, decryptData, decryptDataWithPassword, arrayBufferToBigInt, bigIntToArrayBuffer, arrayBufferToBase64, base64ToArrayBuffer, calculateSHA256 } from './webCrypto';
import { splitSecret, recoverSecret } from './shamir';
import { FileSplitResult, RecoveryOptions, SecretSharingConfig, Share, ShareFile, PureShamirSplitResult, PureShamirRecoveryOptions, PureShamirShare, PureShamirShareFile, EncryptionScheme, FileRecoveryResult } from './types';

/**
 * Web版本的文件处理器
 */
export class WebFileProcessor {
  
  // 纯Shamir方案的数据块大小（字节）
  private static readonly CHUNK_SIZE = 32; // 32字节 = 256位

  /**
   * 将ArrayBuffer转换为bigint数组（按块分割）
   */
  private arrayBufferToBigIntChunks(buffer: ArrayBuffer): bigint[] {
    const uint8Array = new Uint8Array(buffer);
    const chunks: bigint[] = [];
    
    for (let i = 0; i < uint8Array.length; i += WebFileProcessor.CHUNK_SIZE) {
      // 创建固定大小的块（32字节）
      const chunkBytes = new Uint8Array(WebFileProcessor.CHUNK_SIZE);
      const actualChunkSize = Math.min(WebFileProcessor.CHUNK_SIZE, uint8Array.length - i);
      
      // 复制实际数据
      for (let j = 0; j < actualChunkSize; j++) {
        chunkBytes[j] = uint8Array[i + j];
      }
      
      // 将字节数组转换为bigint（小端序）
      let bigintValue = 0n;
      for (let j = WebFileProcessor.CHUNK_SIZE - 1; j >= 0; j--) {
        bigintValue = (bigintValue << 8n) + BigInt(chunkBytes[j]);
      }
      
      chunks.push(bigintValue);
    }
    
    return chunks;
  }

  /**
   * 将bigint数组转换为ArrayBuffer
   */
  private bigIntChunksToArrayBuffer(chunks: bigint[], originalSize: number): ArrayBuffer {
    const result = new Uint8Array(originalSize);
    let offset = 0;
    
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      
      // 将bigint转换为字节数组（固定32字节）
      const chunkBytes = new Uint8Array(WebFileProcessor.CHUNK_SIZE);
      let value = chunk;
      
      // 从高位到低位填充字节（小端序）
      for (let i = 0; i < WebFileProcessor.CHUNK_SIZE; i++) {
        chunkBytes[i] = Number(value & 0xFFn);
        value = value >> 8n;
      }
      
      // 计算要复制的字节数
      const remainingBytes = originalSize - offset;
      const bytesToCopy = Math.min(WebFileProcessor.CHUNK_SIZE, remainingBytes);
      
      // 复制到结果数组
      for (let i = 0; i < bytesToCopy; i++) {
        result[offset + i] = chunkBytes[i];
      }
      
      offset += bytesToCopy;
      if (offset >= originalSize) break;
    }
    
    return result.buffer;
  }

  /**
   * 纯Shamir方案：直接分割文件
   */
  async splitFilePureShamir(file: File, config: SecretSharingConfig, userPassword?: string): Promise<PureShamirSplitResult> {
    // 读取文件数据
    let fileData = await file.arrayBuffer();
    let salt: ArrayBuffer | undefined;
    
    // 计算原始文件的SHA256哈希
    const originalSHA256 = await calculateSHA256(fileData);
    
    // 如果有密码，先加密文件数据
    if (userPassword) {
      const encryptionResult = await encryptData(fileData, userPassword);
      
      // 将IV附加到加密数据的开头，这样它也会被分割
      const ivBytes = new Uint8Array(encryptionResult.iv);
      const encryptedBytes = new Uint8Array(encryptionResult.encryptedData);
      const combinedData = new Uint8Array(ivBytes.length + encryptedBytes.length);
      combinedData.set(ivBytes, 0);
      combinedData.set(encryptedBytes, ivBytes.length);
      
      fileData = combinedData.buffer;
      salt = encryptionResult.salt;
    }
    
    // 将文件数据分块转换为bigint数组
    const chunks = this.arrayBufferToBigIntChunks(fileData);
    
    // 为每个数据块创建Shamir分割
    const allShares: PureShamirShare[][] = [];
    
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunkShares = splitSecret(chunks[chunkIndex], config);
      
      // 转换为PureShamirShare格式
      const pureShamirShares = chunkShares.map(share => ({
        id: share.id,
        value: share.value,
        chunkIndex,
        totalChunks: chunks.length
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
        originalSize: file.size, // 原始文件大小
        processedSize: fileData.byteLength, // 加密后的数据大小（如果使用密码）
        chunkSize: WebFileProcessor.CHUNK_SIZE,
        totalChunks: chunks.length,
        usePassword: !!userPassword,
        salt,
        originalSHA256
      }
    };
  }

  /**
   * 创建文件恢复结果
   */
  private async createRecoveryResult(
    data: ArrayBuffer, 
    filename: string
  ): Promise<FileRecoveryResult> {
    const recoveredSHA256 = await calculateSHA256(data);
    
    return {
      data,
      recoveredSHA256,
      filename
    };
  }

  /**
   * 纯Shamir方案：从份额恢复文件
   */
  async recoverFilePureShamir(options: PureShamirRecoveryOptions, userPassword?: string): Promise<FileRecoveryResult> {
    const { shares, metadata } = options;
    
    // 检查密码要求
    if (metadata.usePassword && !userPassword) {
      throw new Error('此文件使用密码保护，请提供正确的密码');
    }
    
    if (!metadata.usePassword && userPassword) {
      throw new Error('此文件未使用密码保护，无需提供密码');
    }
    
    // 验证份额数据结构
    if (shares.length < metadata.totalChunks) {
      throw new Error('份额数据不完整');
    }
    
    // 统计实际可用的份额文件数量
    const availableShareIds = new Set<number>();
    shares.forEach(chunkShares => {
      chunkShares.forEach(share => {
        availableShareIds.add(share.id);
      });
    });
    
    if (availableShareIds.size < metadata.threshold) {
      throw new Error(`份额文件不足，需要至少 ${metadata.threshold} 个不同的份额文件，当前只有 ${availableShareIds.size} 个。请上传更多份额文件。`);
    }
    
    // 按数据块恢复
    const recoveredChunks: bigint[] = [];
    
    for (let chunkIndex = 0; chunkIndex < metadata.totalChunks; chunkIndex++) {
      // 获取当前块的所有份额
      const chunkShares: Share[] = [];
      
      if (chunkIndex < shares.length) {
        shares[chunkIndex].forEach(share => {
          chunkShares.push({
            id: share.id,
            value: share.value
          });
        });
      }
      
      // 验证份额数量
      if (chunkShares.length < metadata.threshold) {
        throw new Error(`数据块 ${chunkIndex} 的份额不足，需要至少 ${metadata.threshold} 个份额，当前只有 ${chunkShares.length} 个`);
      }
      
      // 恢复当前块
      const recoveredChunk = recoverSecret(chunkShares, metadata.threshold);
      recoveredChunks.push(recoveredChunk);
    }
    
    // 计算恢复数据的实际大小
    // 对于使用密码的情况，我们需要恢复所有的数据块（包含 IV + 加密数据）
    const actualDataSize = metadata.usePassword ? 
      metadata.processedSize : 
      metadata.originalSize;
    
    // 将恢复的数据块转换为ArrayBuffer
    let recoveredData = this.bigIntChunksToArrayBuffer(recoveredChunks, actualDataSize);
    
    // 如果使用了密码，需要解密
    if (metadata.usePassword && userPassword && metadata.salt) {
      try {
        // 从恢复的数据中提取IV（前12字节）和加密数据
        const combinedData = new Uint8Array(recoveredData);
        const ivSize = 12; // AES-GCM的IV大小
        
        if (combinedData.length < ivSize) {
          throw new Error('数据损坏：长度不足');
        }
        
        const iv = combinedData.slice(0, ivSize);
        const encryptedData = combinedData.slice(ivSize);
        
        recoveredData = await decryptDataWithPassword(encryptedData.buffer, userPassword, metadata.salt, iv.buffer);
      } catch (error) {
        throw new Error('密码错误或数据损坏');
      }
    }
    
    return this.createRecoveryResult(recoveredData, metadata.filename);
  }

  /**
   * 生成纯Shamir方案的份额文件
   */
  generatePureShamirShareFiles(shares: PureShamirShare[][], metadata: any): PureShamirShareFile[] {
    const shareFiles: PureShamirShareFile[] = [];
    
    // 按份额ID组织数据
    for (let shareId = 1; shareId <= metadata.totalShares; shareId++) {
      const shareData: PureShamirShare[] = [];
      
      // 收集该份额在所有数据块中的部分
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
          salt: metadata.salt ? arrayBufferToBase64(metadata.salt) : undefined
        }
      });
    }
    
    return shareFiles;
  }

  /**
   * 解析纯Shamir方案的份额文件
   */
  parsePureShamirShareFiles(shareFilesData: string[]): PureShamirRecoveryOptions {
    const allShares: PureShamirShare[][] = [];
    let metadata: any = null;
    
    // 解析每个份额文件
    for (const shareFileData of shareFilesData) {
      const shareFile: PureShamirShareFile = JSON.parse(shareFileData, (key, value) => {
        if (key === 'value' && typeof value === 'string') {
          return BigInt(value);
        }
        return value;
      });
      
      // 设置元数据
      if (!metadata) {
        metadata = {
          ...shareFile.metadata,
          salt: shareFile.metadata.salt ? base64ToArrayBuffer(shareFile.metadata.salt) : undefined
        };
        // 初始化按数据块组织的份额数组
        for (let i = 0; i < metadata.totalChunks; i++) {
          allShares[i] = [];
        }
      }
      
      // 将份额按数据块组织
      for (const share of shareFile.shares) {
        if (share.chunkIndex < allShares.length) {
          allShares[share.chunkIndex].push(share);
        }
      }
    }
    
    return { shares: allShares, metadata };
  }

  /**
   * 检测份额文件的方案类型
   */
  detectScheme(shareFileData: string): EncryptionScheme {
    try {
      const shareFile = JSON.parse(shareFileData);
      
      // 检查是否包含scheme字段
      if (shareFile.metadata && shareFile.metadata.scheme) {
        return shareFile.metadata.scheme;
      }
      
      // 检查是否包含纯Shamir方案的特征
      if (shareFile.shareId && shareFile.shares && Array.isArray(shareFile.shares)) {
        return 'pure-shamir';
      }
      
      // 默认为混合方案
      return 'hybrid';
    } catch (error) {
      return 'hybrid';
    }
  }

  /**
   * 加密并分割文件
   * @param file 要加密的文件
   * @param config 分割配置
   * @param userPassword 用户密码（可选）
   */
  async splitFile(file: File, config: SecretSharingConfig, userPassword?: string): Promise<FileSplitResult> {
    // 读取文件数据
    const fileData = await file.arrayBuffer();
    
    // 计算原始文件的SHA256哈希
    const originalSHA256 = await calculateSHA256(fileData);
    
    // 加密文件
    const encryptionResult = await encryptData(fileData, userPassword);
    
    // 将加密密钥转换为bigint进行分割
    const keyBigInt = arrayBufferToBigInt(encryptionResult.key);
    
    // 分割密钥
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
        originalSHA256
      },
      encryptedData: encryptionResult.encryptedData
    } as FileSplitResult & { encryptedData: ArrayBuffer };
  }
  
  /**
   * 从份额恢复文件
   * @param encryptedData 加密的文件数据
   * @param options 恢复选项
   * @param userPassword 用户密码（当使用密码加密时需要）
   */
  async recoverFile(encryptedData: ArrayBuffer, options: RecoveryOptions, userPassword?: string): Promise<FileRecoveryResult> {
    const { shares, metadata } = options;
    
    // 验证份额数量
    if (shares.length < metadata.threshold) {
      throw new Error(`需要至少${metadata.threshold}个份额才能恢复文件`);
    }
    
    // 检查是否需要密码
    if (metadata.usePassword && !userPassword) {
      throw new Error('此文件使用密码加密，请提供正确的密码');
    }
    
    if (!metadata.usePassword && userPassword) {
      throw new Error('此文件未使用密码加密，无需提供密码');
    }
    
    let decryptedData: ArrayBuffer;
    
    if (metadata.usePassword && userPassword && metadata.salt) {
      // 使用密码解密（不需要恢复密钥）
      decryptedData = await decryptDataWithPassword(
        encryptedData, 
        userPassword, 
        metadata.salt, 
        metadata.iv
      );
    } else {
      // 从份额恢复密钥并解密
      const recoveredKeyBigInt = recoverSecret(shares, metadata.threshold);
      const recoveredKey = bigIntToArrayBuffer(recoveredKeyBigInt, 32);
      decryptedData = await decryptData(encryptedData, recoveredKey, metadata.iv);
    }
    
    return this.createRecoveryResult(decryptedData, metadata.filename);
  }
  
  /**
   * 生成份额文件下载数据
   */
  generateShareFiles(shares: Share[], metadata: any): ShareFile[] {
    return shares.map(share => ({
      share,
      metadata: {
        ...metadata,
        iv: arrayBufferToBase64(metadata.iv),
        salt: metadata.salt ? arrayBufferToBase64(metadata.salt) : undefined
      }
    }));
  }
  
  /**
   * 解析份额文件
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
          salt: shareFile.metadata.salt ? base64ToArrayBuffer(shareFile.metadata.salt) : undefined
        };
      }
    }
    
    return { shares, metadata };
  }
  
  /**
   * 下载文件
   */
  downloadFile(data: ArrayBuffer, filename: string, mimeType: string = 'application/octet-stream') {
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
   * 下载JSON文件
   */
  downloadJson(data: any, filename: string) {
    const jsonString = JSON.stringify(data, (_key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, 2);
    
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
   * 下载哈希记录文件
   */
  downloadHashRecord(result: FileRecoveryResult, originalFilename: string) {
    const hashRecord = {
      filename: originalFilename,
      recoveredFilename: result.filename,
      recoveredSHA256: result.recoveredSHA256,
      timestamp: new Date().toISOString(),
      note: '文件已成功恢复，可通过SHA256验证完整性'
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