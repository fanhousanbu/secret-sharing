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
  calculateFileSHA256
} from './webCrypto';

// 模拟crypto API
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    exportKey: jest.fn(),
    generateKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

Object.defineProperty(window, 'crypto', {
  value: mockCrypto,
});

// 模拟File API
global.File = class File {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(
    bits: BlobPart[],
    name: string,
    options?: FilePropertyBag
  ) {
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + (bit as any).length || 0, 0);
    this.type = options?.type || '';
    this.lastModified = options?.lastModified || Date.now();
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return new ArrayBuffer(10);
  }
} as any;

describe('WebCrypto工具函数', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认的mock实现
    mockCrypto.getRandomValues.mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    });
  });

  describe('deriveKeyFromPassword', () => {
    test('应该能够从密码派生密钥', async () => {
      const password = 'testPassword';
      const salt = new ArrayBuffer(16);
      
      const mockKeyMaterial = {} as CryptoKey;
      const mockDerivedKey = {} as CryptoKey;
      const mockExportedKey = new ArrayBuffer(32);
      
      mockCrypto.subtle.importKey.mockResolvedValue(mockKeyMaterial);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockDerivedKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(mockExportedKey);
      
      const result = await deriveKeyFromPassword(password, salt);
      
      expect(result).toBe(mockExportedKey);
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        mockKeyMaterial,
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
    });
  });

  describe('encryptData', () => {
    test('应该能够加密数据（使用随机密钥）', async () => {
      const data = new ArrayBuffer(10);
      const mockKey = {} as CryptoKey;
      const mockExportedKey = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      const mockEncryptedData = new ArrayBuffer(20);
      
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(mockExportedKey);
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData);
      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      
      const result = await encryptData(data);
      
      expect(result.encryptedData).toBe(mockEncryptedData);
      expect(result.key).toBe(mockExportedKey);
      expect(result.iv).toBe(mockIv.buffer);
      expect(result.salt).toBeUndefined();
    });

    test('应该能够使用密码加密数据', async () => {
      const data = new ArrayBuffer(10);
      const password = 'testPassword';
      const mockSalt = new Uint8Array(16);
      const mockKey = {} as CryptoKey;
      const mockExportedKey = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      const mockEncryptedData = new ArrayBuffer(20);
      
      mockCrypto.getRandomValues
        .mockReturnValueOnce(mockSalt) // 第一次调用生成salt
        .mockReturnValueOnce(mockIv);  // 第二次调用生成iv
      
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(mockExportedKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData);
      
      const result = await encryptData(data, password);
      
      expect(result.encryptedData).toBe(mockEncryptedData);
      expect(result.key).toBe(mockExportedKey);
      expect(result.iv).toBe(mockIv.buffer);
      expect(result.salt).toBeDefined();
      expect(typeof result.salt).toBe('object');
    });
  });

  describe('decryptData', () => {
    test('应该能够解密数据', async () => {
      const encryptedData = new ArrayBuffer(20);
      const keyBuffer = new ArrayBuffer(32);
      const iv = new ArrayBuffer(12);
      const mockKey = {} as CryptoKey;
      const mockDecryptedData = new ArrayBuffer(10);
      
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.decrypt.mockResolvedValue(mockDecryptedData);
      
      const result = await decryptData(encryptedData, keyBuffer, iv);
      
      expect(result).toBe(mockDecryptedData);
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
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
    test('应该能够使用密码解密数据', async () => {
      const encryptedData = new ArrayBuffer(20);
      const password = 'testPassword';
      const salt = new ArrayBuffer(16);
      const iv = new ArrayBuffer(12);
      const mockKeyBuffer = new ArrayBuffer(32);
      const mockDecryptedData = new ArrayBuffer(10);
      
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(mockKeyBuffer);
      mockCrypto.subtle.decrypt.mockResolvedValue(mockDecryptedData);
      
      const result = await decryptDataWithPassword(encryptedData, password, salt, iv);
      
      expect(result).toBe(mockDecryptedData);
    });
  });

  describe('arrayBufferToBase64', () => {
    test('应该能够将ArrayBuffer转换为base64', () => {
      const buffer = new ArrayBuffer(3);
      const uint8Array = new Uint8Array(buffer);
      uint8Array[0] = 65; // 'A'
      uint8Array[1] = 66; // 'B'
      uint8Array[2] = 67; // 'C'
      
      const result = arrayBufferToBase64(buffer);
      
      expect(result).toBe('QUJD'); // 'ABC'的base64编码
    });
  });

  describe('base64ToArrayBuffer', () => {
    test('应该能够将base64转换为ArrayBuffer', () => {
      const base64 = 'QUJD'; // 'ABC'的base64编码
      
      const result = base64ToArrayBuffer(base64);
      const uint8Array = new Uint8Array(result);
      
      expect(uint8Array[0]).toBe(65); // 'A'
      expect(uint8Array[1]).toBe(66); // 'B'
      expect(uint8Array[2]).toBe(67); // 'C'
    });
  });

  describe('arrayBufferToBigInt', () => {
    test('应该能够将ArrayBuffer转换为bigint', () => {
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
    test('应该能够将bigint转换为ArrayBuffer', () => {
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
    test('应该能够计算SHA256哈希', async () => {
      const data = new ArrayBuffer(10);
      const mockDigest = new Uint8Array(32);
      
      mockCrypto.subtle.digest = jest.fn().mockResolvedValue(mockDigest);
      
      const result = await calculateSHA256(data);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64); // SHA256哈希的十六进制字符串长度
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', data);
    });
  });

  describe('calculateFileSHA256', () => {
    test('应该能够计算文件的SHA256哈希', async () => {
      const mockFile = new File(['test content'], 'test.txt');
      const mockDigest = new Uint8Array(32);
      
      mockCrypto.subtle.digest = jest.fn().mockResolvedValue(mockDigest);
      
      const result = await calculateFileSHA256(mockFile);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });
  });
}); 