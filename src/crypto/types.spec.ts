import {
  Share,
  SecretSharingConfig,
  PureShamirRecoveryOptions,
  FileRecoveryResult,
} from './types';

describe('TypeScript type definitions', () => {
  describe('Share type', () => {
    test('should be able to create valid Share object', () => {
      const share: Share = {
        id: 1,
        value: 123456789n,
      };

      expect(share.id).toBe(1);
      expect(share.value).toBe(123456789n);
      expect(typeof share.id).toBe('number');
      expect(typeof share.value).toBe('bigint');
    });

    test('should be able to create multiple Share objects', () => {
      const shares: Share[] = [
        { id: 1, value: 100n },
        { id: 2, value: 200n },
        { id: 3, value: 300n },
      ];

      expect(shares).toHaveLength(3);
      shares.forEach((share, index) => {
        expect(share.id).toBe(index + 1);
        expect(typeof share.value).toBe('bigint');
      });
    });

    test('should be able to handle large values', () => {
      const share: Share = {
        id: 1,
        value: 2n ** 100n,
      };

      expect(share.value).toBeGreaterThan(0n);
      expect(typeof share.value).toBe('bigint');
    });
  });

  describe('SecretSharingConfig type', () => {
    test('should be able to create valid config object', () => {
      const config: SecretSharingConfig = {
        threshold: 3,
        totalShares: 5,
      };

      expect(config.threshold).toBe(3);
      expect(config.totalShares).toBe(5);
      expect(typeof config.threshold).toBe('number');
      expect(typeof config.totalShares).toBe('number');
    });

    test('should be able to handle different config values', () => {
      const configs: SecretSharingConfig[] = [
        { threshold: 2, totalShares: 3 },
        { threshold: 5, totalShares: 7 },
        { threshold: 10, totalShares: 15 },
      ];

      configs.forEach(config => {
        expect(config.threshold).toBeGreaterThan(0);
        expect(config.totalShares).toBeGreaterThan(0);
        expect(config.threshold).toBeLessThanOrEqual(config.totalShares);
      });
    });

    test('should be able to handle boundary values', () => {
      const config: SecretSharingConfig = {
        threshold: 1,
        totalShares: 1,
      };

      expect(config.threshold).toBe(1);
      expect(config.totalShares).toBe(1);
    });
  });

  describe('FileMetadata type', () => {
    test('should be able to create basic metadata object', () => {
      const metadata = {
        scheme: 'pure-shamir' as const,
        threshold: 3,
        totalShares: 5,
        filename: 'test.txt',
        originalSize: 1024,
        processedSize: 1024,
        chunkSize: 512,
        totalChunks: 2,
        usePassword: false,
        salt: undefined,
        originalSHA256: 'mock-hash',
      };

      expect(metadata.scheme).toBe('pure-shamir');
      expect(metadata.filename).toBe('test.txt');
      expect(metadata.usePassword).toBe(false);
      expect(metadata.salt).toBeUndefined();
    });

    test('should be able to create metadata object with password', () => {
      const salt = new ArrayBuffer(16);
      const metadata = {
        scheme: 'pure-shamir' as const,
        threshold: 3,
        totalShares: 5,
        filename: 'encrypted.txt',
        originalSize: 2048,
        processedSize: 2048,
        chunkSize: 1024,
        totalChunks: 2,
        usePassword: true,
        salt,
        originalSHA256: 'encrypted-hash',
      };

      expect(metadata.usePassword).toBe(true);
      expect(metadata.salt).toBe(salt);
      expect(metadata.salt).toBeInstanceOf(ArrayBuffer);
    });

    test('should be able to handle different schemes', () => {
      const schemes = ['pure-shamir', 'legacy'] as const;

      schemes.forEach(scheme => {
        const metadata = {
          scheme,
          threshold: 2,
          totalShares: 3,
          filename: 'test.txt',
          originalSize: 100,
          processedSize: 100,
          chunkSize: 50,
          totalChunks: 2,
          usePassword: false,
          salt: undefined,
          originalSHA256: 'hash',
        };

        expect(metadata.scheme).toBe(scheme);
      });
    });

    test('should be able to handle large file metadata', () => {
      const metadata = {
        scheme: 'pure-shamir' as const,
        threshold: 5,
        totalShares: 10,
        filename: 'large-file.bin',
        originalSize: 1024 * 1024 * 100, // 100MB
        processedSize: 1024 * 1024 * 100,
        chunkSize: 1024 * 1024, // 1MB chunks
        totalChunks: 100,
        usePassword: false,
        salt: undefined,
        originalSHA256: 'large-file-hash',
      };

      expect(metadata.originalSize).toBeGreaterThan(0);
      expect(metadata.totalChunks).toBeGreaterThan(0);
      expect(metadata.chunkSize).toBeGreaterThan(0);
    });
  });

  describe('PureShamirRecoveryOptions type', () => {
    test('should be able to create recovery options object', () => {
      const shares = [
        [
          { id: 1, value: 100n, chunkIndex: 0, totalChunks: 2 },
          { id: 2, value: 200n, chunkIndex: 0, totalChunks: 2 },
        ],
        [
          { id: 1, value: 300n, chunkIndex: 1, totalChunks: 2 },
          { id: 2, value: 400n, chunkIndex: 1, totalChunks: 2 },
        ],
      ];

      const metadata = {
        scheme: 'pure-shamir' as const,
        threshold: 2,
        totalShares: 3,
        filename: 'test.txt',
        originalSize: 100,
        processedSize: 100,
        chunkSize: 50,
        totalChunks: 2,
        usePassword: false,
        salt: undefined,
        originalSHA256: 'hash',
      };

      const options: PureShamirRecoveryOptions = {
        shares,
        metadata,
      };

      expect(options.shares).toBe(shares);
      expect(options.metadata).toBe(metadata);
      expect(options.shares).toHaveLength(2);
      expect(options.shares[0]).toHaveLength(2);
    });

    test('should be able to handle recovery options with password', () => {
      const shares = [[{ id: 1, value: 100n, chunkIndex: 0, totalChunks: 1 }]];

      const metadata = {
        scheme: 'pure-shamir' as const,
        threshold: 1,
        totalShares: 1,
        filename: 'encrypted.txt',
        originalSize: 50,
        processedSize: 50,
        chunkSize: 50,
        totalChunks: 1,
        usePassword: true,
        salt: new ArrayBuffer(16),
        originalSHA256: 'encrypted-hash',
      };

      const options: PureShamirRecoveryOptions = {
        shares,
        metadata,
      };

      expect(options.metadata.usePassword).toBe(true);
      expect(options.metadata.salt).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('RecoveryResult type', () => {
    test('should be able to create recovery result object', () => {
      const data = new ArrayBuffer(100);
      const result: FileRecoveryResult = {
        data,
        recoveredSHA256: 'recovered-hash',
        filename: 'recovered.txt',
      };

      expect(result.data).toBe(data);
      expect(result.recoveredSHA256).toBe('recovered-hash');
      expect(result.filename).toBe('recovered.txt');
      expect(result.data).toBeInstanceOf(ArrayBuffer);
    });

    test('should be able to handle different data sizes', () => {
      const sizes = [0, 1, 100, 1024, 1024 * 1024];

      sizes.forEach(size => {
        const data = new ArrayBuffer(size);
        const result: FileRecoveryResult = {
          data,
          recoveredSHA256: `hash-${size}`,
          filename: `file-${size}.txt`,
        };

        expect(result.data.byteLength).toBe(size);
        expect(result.filename).toBe(`file-${size}.txt`);
      });
    });

    test('should be able to handle special filenames', () => {
      const specialNames = [
        'file with spaces.txt',
        'file-with-dashes.txt',
        'file.with.dots.txt',
        'file_with_underscores.txt',
        'Chinese filename.txt',
        'file-123.txt',
      ];

      specialNames.forEach(filename => {
        const result: FileRecoveryResult = {
          data: new ArrayBuffer(10),
          recoveredSHA256: 'hash',
          filename,
        };

        expect(result.filename).toBe(filename);
      });
    });
  });

  describe('Type compatibility', () => {
    test('Share array should be compatible with recoverSecret function', () => {
      const shares: Share[] = [
        { id: 1, value: 100n },
        { id: 2, value: 200n },
      ];

      expect(shares).toHaveLength(2);
      shares.forEach(share => {
        expect(share).toHaveProperty('id');
        expect(share).toHaveProperty('value');
        expect(typeof share.id).toBe('number');
        expect(typeof share.value).toBe('bigint');
      });
    });

    test('SecretSharingConfig should be compatible with splitSecret function', () => {
      const config: SecretSharingConfig = {
        threshold: 2,
        totalShares: 3,
      };

      expect(config).toHaveProperty('threshold');
      expect(config).toHaveProperty('totalShares');
      expect(typeof config.threshold).toBe('number');
      expect(typeof config.totalShares).toBe('number');
    });

    test('FileMetadata should contain all required properties', () => {
      const metadata = {
        scheme: 'pure-shamir' as const,
        threshold: 2,
        totalShares: 3,
        filename: 'test.txt',
        originalSize: 100,
        processedSize: 100,
        chunkSize: 50,
        totalChunks: 2,
        usePassword: false,
        salt: undefined,
        originalSHA256: 'hash',
      };

      const requiredProperties = [
        'scheme',
        'threshold',
        'totalShares',
        'filename',
        'originalSize',
        'processedSize',
        'chunkSize',
        'totalChunks',
        'usePassword',
        'salt',
        'originalSHA256',
      ];

      requiredProperties.forEach(prop => {
        expect(metadata).toHaveProperty(prop);
      });
    });
  });

  describe('Edge cases', () => {
    test('should be able to handle zero values', () => {
      const share: Share = {
        id: 0,
        value: 0n,
      };

      expect(share.id).toBe(0);
      expect(share.value).toBe(0n);
    });

    test('should be able to handle maximum values', () => {
      const share: Share = {
        id: Number.MAX_SAFE_INTEGER,
        value: 2n ** 1000n,
      };

      expect(share.id).toBe(Number.MAX_SAFE_INTEGER);
      expect(share.value).toBeGreaterThan(0n);
    });

    test('should be able to handle empty data', () => {
      const result: FileRecoveryResult = {
        data: new ArrayBuffer(0),
        recoveredSHA256: '',
        filename: '',
      };

      expect(result.data.byteLength).toBe(0);
      expect(result.recoveredSHA256).toBe('');
      expect(result.filename).toBe('');
    });
  });
});
