import {
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  decryptDataWithPassword,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToBigInt,
  bigIntToArrayBuffer,
  calculateSHA256,
  calculateFileSHA256,
} from './webCrypto';

// Mock File API
global.File = class File {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + (bit as any).length || 0, 0);
    this.type = options?.type || '';
    this.lastModified = options?.lastModified || Date.now();
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return new ArrayBuffer(10);
  }
} as any;

describe('WebCrypto utility functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set default mock implementations
    (window.crypto.getRandomValues as jest.Mock).mockImplementation(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    });
  });

  describe('deriveKeyFromPassword', () => {
    test('should be able to derive key from password', async () => {
      const password = 'testPassword';
      const salt = new ArrayBuffer(16);

      const mockKeyMaterial = {} as CryptoKey;
      const mockDerivedKey = {} as CryptoKey;
      const mockExportedKey = new ArrayBuffer(32);

      // Set correct mock implementations
      (window.crypto.subtle.importKey as jest.Mock).mockResolvedValue(
        mockKeyMaterial
      );
      (window.crypto.subtle.deriveKey as jest.Mock).mockResolvedValue(
        mockDerivedKey
      );
      (window.crypto.subtle.exportKey as jest.Mock).mockResolvedValue(
        mockExportedKey
      );

      const result = await deriveKeyFromPassword(password, salt);

      expect(result).toBe(mockExportedKey);
      expect(window.crypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      expect(window.crypto.subtle.deriveKey).toHaveBeenCalledWith(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        mockKeyMaterial,
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
      expect(window.crypto.subtle.exportKey).toHaveBeenCalledWith(
        'raw',
        mockDerivedKey
      );
    });
  });

  describe('encryptData', () => {
    test('should be able to encrypt data (using random key)', async () => {
      const data = new ArrayBuffer(10);
      const mockKey = {} as CryptoKey;
      const mockExportedKey = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      const mockEncryptedData = new ArrayBuffer(20);

      (window.crypto.subtle.generateKey as jest.Mock).mockResolvedValue(
        mockKey
      );
      (window.crypto.subtle.exportKey as jest.Mock).mockResolvedValue(
        mockExportedKey
      );
      (window.crypto.subtle.importKey as jest.Mock).mockResolvedValue(mockKey);
      (window.crypto.subtle.encrypt as jest.Mock).mockResolvedValue(
        mockEncryptedData
      );
      (window.crypto.getRandomValues as jest.Mock).mockReturnValue(mockIv);

      const result = await encryptData(data);

      expect(result.encryptedData).toBe(mockEncryptedData);
      expect(result.key).toBe(mockExportedKey);
      expect(result.iv).toBe(mockIv.buffer);
      expect(result.salt).toBeUndefined();
    });

    test('should be able to encrypt data with password', async () => {
      const data = new ArrayBuffer(10);
      const password = 'testPassword';
      const mockSalt = new Uint8Array(16);
      const mockKey = {} as CryptoKey;
      const mockExportedKey = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      const mockEncryptedData = new ArrayBuffer(20);

      (window.crypto.getRandomValues as jest.Mock)
        .mockReturnValueOnce(mockSalt) // First call generates salt
        .mockReturnValueOnce(mockIv); // Second call generates iv

      (window.crypto.subtle.importKey as jest.Mock).mockResolvedValue(mockKey);
      (window.crypto.subtle.deriveKey as jest.Mock).mockResolvedValue(mockKey);
      (window.crypto.subtle.exportKey as jest.Mock).mockResolvedValue(
        mockExportedKey
      );
      (window.crypto.subtle.encrypt as jest.Mock).mockResolvedValue(
        mockEncryptedData
      );

      const result = await encryptData(data, password);

      expect(result.encryptedData).toBe(mockEncryptedData);
      expect(result.key).toBe(mockExportedKey);
      expect(result.iv).toBe(mockIv.buffer);
      expect(result.salt).toBeDefined();
      expect(typeof result.salt).toBe('object');
    });
  });

  describe('decryptData', () => {
    test('should be able to decrypt data', async () => {
      const encryptedData = new ArrayBuffer(20);
      const keyBuffer = new ArrayBuffer(32);
      const iv = new ArrayBuffer(12);
      const mockKey = {} as CryptoKey;
      const mockDecryptedData = new ArrayBuffer(10);

      (window.crypto.subtle.importKey as jest.Mock).mockResolvedValue(mockKey);
      (window.crypto.subtle.decrypt as jest.Mock).mockResolvedValue(
        mockDecryptedData
      );

      const result = await decryptData(encryptedData, keyBuffer, iv);

      expect(result).toBe(mockDecryptedData);
      expect(window.crypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        keyBuffer,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['decrypt']
      );
    });
  });

  describe('decryptDataWithPassword', () => {
    test('should be able to decrypt data with password', async () => {
      const encryptedData = new ArrayBuffer(20);
      const password = 'testPassword';
      const salt = new ArrayBuffer(16);
      const iv = new ArrayBuffer(12);
      const mockKeyBuffer = new ArrayBuffer(32);
      const mockDecryptedData = new ArrayBuffer(10);

      (window.crypto.subtle.importKey as jest.Mock).mockResolvedValue(
        {} as CryptoKey
      );
      (window.crypto.subtle.deriveKey as jest.Mock).mockResolvedValue(
        {} as CryptoKey
      );
      (window.crypto.subtle.exportKey as jest.Mock).mockResolvedValue(
        mockKeyBuffer
      );
      (window.crypto.subtle.decrypt as jest.Mock).mockResolvedValue(
        mockDecryptedData
      );

      const result = await decryptDataWithPassword(
        encryptedData,
        password,
        salt,
        iv
      );

      expect(result).toBe(mockDecryptedData);
    });
  });

  describe('arrayBufferToBase64', () => {
    test('should be able to convert ArrayBuffer to base64', () => {
      const buffer = new ArrayBuffer(3);
      const uint8Array = new Uint8Array(buffer);
      uint8Array[0] = 65; // 'A'
      uint8Array[1] = 66; // 'B'
      uint8Array[2] = 67; // 'C'

      const result = arrayBufferToBase64(buffer);

      expect(result).toBe('QUJD'); // base64 encoding of 'ABC'
    });
  });

  describe('base64ToArrayBuffer', () => {
    test('should be able to convert base64 to ArrayBuffer', () => {
      const base64 = 'QUJD'; // base64 encoding of 'ABC'

      const result = base64ToArrayBuffer(base64);
      const uint8Array = new Uint8Array(result);

      expect(uint8Array[0]).toBe(65); // 'A'
      expect(uint8Array[1]).toBe(66); // 'B'
      expect(uint8Array[2]).toBe(67); // 'C'
    });
  });

  describe('arrayBufferToBigInt', () => {
    test('should be able to convert ArrayBuffer to bigint', () => {
      const buffer = new ArrayBuffer(4);
      const uint8Array = new Uint8Array(buffer);
      uint8Array[0] = 0x12;
      uint8Array[1] = 0x34;
      uint8Array[2] = 0x56;
      uint8Array[3] = 0x78;

      const result = arrayBufferToBigInt(buffer);

      expect(result).toBe(0x12345678n);
    });
  });

  describe('bigIntToArrayBuffer', () => {
    test('should be able to convert bigint to ArrayBuffer', () => {
      const value = 0x12345678n;
      const length = 4;

      const result = bigIntToArrayBuffer(value, length);
      const uint8Array = new Uint8Array(result);

      expect(uint8Array[0]).toBe(0x12);
      expect(uint8Array[1]).toBe(0x34);
      expect(uint8Array[2]).toBe(0x56);
      expect(uint8Array[3]).toBe(0x78);
    });
  });

  describe('calculateSHA256', () => {
    test('should be able to calculate SHA256 hash', async () => {
      const data = new ArrayBuffer(10);
      const mockDigest = new Uint8Array(32);

      (window.crypto.subtle.digest as jest.Mock).mockResolvedValue(mockDigest);

      const result = await calculateSHA256(data);

      expect(typeof result).toBe('string');
              expect(result.length).toBe(64); // Length of SHA256 hash hex string
      expect(window.crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', data);
    });
  });

  describe('calculateFileSHA256', () => {
    test('should be able to calculate file SHA256 hash', async () => {
      const mockFile = new File(['test content'], 'test.txt');
      const mockDigest = new Uint8Array(32);

      (window.crypto.subtle.digest as jest.Mock).mockResolvedValue(mockDigest);

      const result = await calculateFileSHA256(mockFile);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });
  });
});
