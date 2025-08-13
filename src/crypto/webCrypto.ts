import { EncryptionResult } from './types';

/**
 * Derive key from password (using PBKDF2)
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: ArrayBuffer
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Use PBKDF2 to derive key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 100,000 iterations
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
 * Use Web Crypto API for AES-GCM encryption
 * @param data Data to encrypt
 * @param userPassword User password (optional)
 */
export async function encryptData(
  data: ArrayBuffer,
  userPassword?: string
): Promise<EncryptionResult & { salt?: ArrayBuffer }> {
  let keyBuffer: ArrayBuffer;
  let salt: ArrayBuffer | undefined;

  if (userPassword) {
    // Derive key from user password
    salt = crypto.getRandomValues(new Uint8Array(16)); // 128-bit salt
    keyBuffer = await deriveKeyFromPassword(userPassword, salt);
  } else {
    // Generate random key
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

  // Import key
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

  // Generate random initialization vector
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt data
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
 * Use Web Crypto API for AES-GCM decryption
 */
export async function decryptData(
  encryptedData: ArrayBuffer,
  keyBuffer: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  // Import key
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

  // Decrypt data
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
 * Decrypt with user password (requires salt)
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
 * Convert ArrayBuffer to base64 string
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
 * Convert base64 string to ArrayBuffer
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
 * Convert ArrayBuffer to bigint
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
 * Convert bigint to ArrayBuffer
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
 * Calculate SHA256 hash of ArrayBuffer
 */
export async function calculateSHA256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Calculate SHA256 hash of file
 */
export async function calculateFileSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return calculateSHA256(buffer);
}
