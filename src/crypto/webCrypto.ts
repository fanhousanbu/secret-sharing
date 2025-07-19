import { EncryptionResult } from './types';

/**
 * 从密码派生密钥（使用PBKDF2）
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: ArrayBuffer
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // 导入密码作为原始密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // 使用PBKDF2派生密钥
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 10万次迭代
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  return crypto.subtle.exportKey('raw', derivedKey);
}

/**
 * 使用Web Crypto API进行AES-GCM加密
 * @param data 要加密的数据
 * @param userPassword 用户密码（可选）
 */
export async function encryptData(
  data: ArrayBuffer,
  userPassword?: string
): Promise<EncryptionResult & { salt?: ArrayBuffer }> {
  let keyBuffer: ArrayBuffer;
  let salt: ArrayBuffer | undefined;

  if (userPassword) {
    // 使用用户密码派生密钥
    salt = crypto.getRandomValues(new Uint8Array(16)); // 128位盐值
    keyBuffer = await deriveKeyFromPassword(userPassword, salt);
  } else {
    // 生成随机密钥
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    keyBuffer = await crypto.subtle.exportKey('raw', key);
  }

  // 导入密钥
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt']
  );

  // 生成随机初始化向量
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 加密数据
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  const result: EncryptionResult & { salt?: ArrayBuffer } = {
    encryptedData,
    key: keyBuffer,
    iv: iv.buffer,
  };

  if (salt) {
    result.salt = salt;
  }

  return result;
}

/**
 * 使用Web Crypto API进行AES-GCM解密
 */
export async function decryptData(
  encryptedData: ArrayBuffer,
  keyBuffer: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  // 导入密钥
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['decrypt']
  );

  // 解密数据
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedData
  );

  return decryptedData;
}

/**
 * 使用用户密码解密（需要salt）
 */
export async function decryptDataWithPassword(
  encryptedData: ArrayBuffer,
  password: string,
  salt: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  const keyBuffer = await deriveKeyFromPassword(password, salt);
  return decryptData(encryptedData, keyBuffer, iv);
}

/**
 * ArrayBuffer转换为base64字符串
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * base64字符串转换为ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * ArrayBuffer转换为bigint
 */
export function arrayBufferToBigInt(buffer: ArrayBuffer): bigint {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return BigInt('0x' + hex);
}

/**
 * bigint转换为ArrayBuffer
 */
export function bigIntToArrayBuffer(
  value: bigint,
  length: number
): ArrayBuffer {
  const hex = value.toString(16).padStart(length * 2, '0');
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

/**
 * 计算ArrayBuffer的SHA256哈希值
 */
export async function calculateSHA256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * 计算文件的SHA256哈希值
 */
export async function calculateFileSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return calculateSHA256(buffer);
}
