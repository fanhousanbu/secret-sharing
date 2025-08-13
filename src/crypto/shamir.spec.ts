import { splitSecret, recoverSecret } from './shamir';

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

describe('Shamir Secret Sharing', () => {
  describe('splitSecret', () => {
    test('should split secret into specified number of shares', () => {
      const secret = 123456789n;
      const config = { threshold: 3, totalShares: 5 };

      const shares = splitSecret(secret, config);

      expect(shares).toHaveLength(5);
      shares.forEach((share, index) => {
        expect(share.id).toBe(index + 1);
        expect(typeof share.value).toBe('bigint');
      });
    });

    test('should generate different shares', () => {
      const secret = 987654321n;
      const config = { threshold: 2, totalShares: 4 };

      const shares = splitSecret(secret, config);

      // Check if share values are different
      const values = shares.map(s => s.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(4);
    });

    test('should handle threshold equal to total shares', () => {
      const secret = 42n;
      const config = { threshold: 3, totalShares: 3 };

      const shares = splitSecret(secret, config);

      expect(shares).toHaveLength(3);
    });

    test('should throw error when threshold is greater than total shares', () => {
      const secret = 100n;
      const config = { threshold: 4, totalShares: 3 };

      expect(() => splitSecret(secret, config)).toThrow('Threshold cannot be greater than total shares');
    });

    test('should throw error when threshold is less than 2', () => {
      const secret = 100n;
      const config = { threshold: 1, totalShares: 3 };

      expect(() => splitSecret(secret, config)).toThrow('Threshold must be at least 2');
    });
  });

  describe('recoverSecret', () => {
    test('should recover secret from sufficient shares', () => {
      const secret = 123456789n;
      const config = { threshold: 3, totalShares: 5 };

      const allShares = splitSecret(secret, config);
      const sharesToUse = allShares.slice(0, 3);

      const recoveredSecret = recoverSecret(sharesToUse, 3);

      expect(recoveredSecret).toBe(secret);
    });

    test('should recover secret from different share combinations', () => {
      const secret = 987654321n;
      const config = { threshold: 3, totalShares: 5 };

      const allShares = splitSecret(secret, config);
      const sharesToUse = [allShares[0], allShares[2], allShares[4]];

      const recoveredSecret = recoverSecret(sharesToUse, 3);

      expect(recoveredSecret).toBe(secret);
    });

    test('should handle minimum number of shares', () => {
      const secret = 42n;
      const config = { threshold: 2, totalShares: 3 };

      const allShares = splitSecret(secret, config);
      const sharesToUse = allShares.slice(0, 2);

      const recoveredSecret = recoverSecret(sharesToUse, 2);

      expect(recoveredSecret).toBe(secret);
    });

    test('should handle all shares', () => {
      const secret = 100n;
      const config = { threshold: 2, totalShares: 4 };

      const allShares = splitSecret(secret, config);

      const recoveredSecret = recoverSecret(allShares, 2);

      expect(recoveredSecret).toBe(secret);
    });

    test('should throw error when insufficient shares', () => {
      const secret = 100n;
      const config = { threshold: 3, totalShares: 5 };

      const allShares = splitSecret(secret, config);
      const sharesToUse = allShares.slice(0, 2); // Only 2 shares, need 3

      expect(() => recoverSecret(sharesToUse, 3)).toThrow(
        'Need at least 3 shares to recover secret'
      );
    });
  });

  describe('Edge cases', () => {
    test('should handle zero value secret', () => {
      const secret = 0n;
      const config = { threshold: 2, totalShares: 3 };

      const shares = splitSecret(secret, config);
      const recoveredSecret = recoverSecret(shares.slice(0, 2), 2);

      expect(recoveredSecret).toBe(secret);
    });

    test('should handle large value secret', () => {
      const secret = 2n ** 100n; // Large value test
      const config = { threshold: 3, totalShares: 5 };

      const shares = splitSecret(secret, config);
      const recoveredSecret = recoverSecret(shares.slice(0, 3), 3);

      expect(recoveredSecret).toBe(secret);
    });

    test('should handle values near prime boundary', () => {
      // Use new secure prime for testing
      const prime = 2n ** 256n - 2n ** 224n + 2n ** 192n + 2n ** 96n - 1n;
      const secret = prime - 1n; // Value close to prime
      const config = { threshold: 2, totalShares: 3 };

      const shares = splitSecret(secret, config);
      const recoveredSecret = recoverSecret(shares.slice(0, 2), 2);

      expect(recoveredSecret).toBe(secret);
    });

    test('should handle consistency of repeated tests', () => {
      const secret = 12345n;
      const config = { threshold: 3, totalShares: 5 };

      // Multiple tests to ensure consistent results
      for (let i = 0; i < 3; i++) {
        const shares = splitSecret(secret, config);
        const recoveredSecret = recoverSecret(shares.slice(0, 3), 3);
        expect(recoveredSecret).toBe(secret);
      }
    });
  });

  describe('Mathematical operations', () => {
    test('should correctly handle modular arithmetic', () => {
      const secret = 1000n;
      const config = { threshold: 2, totalShares: 3 };

      const shares = splitSecret(secret, config);

      // Verify all share values are within reasonable range
      shares.forEach(share => {
        expect(share.value).toBeGreaterThanOrEqual(0n);
        // Share values should be less than prime
        expect(share.value).toBeLessThan(2n ** 256n);
      });
    });

    test('should generate sufficiently random coefficients', () => {
      const secret = 100n;
      const config = { threshold: 3, totalShares: 5 };

      const shares1 = splitSecret(secret, config);
      const shares2 = splitSecret(secret, config);

      // Except for the first share (which may be the same), other shares should be different
      const values1 = shares1.map(s => s.value);
      const values2 = shares2.map(s => s.value);

      // At least some share values should be different (due to randomness)
      let differentCount = 0;
      for (let i = 0; i < values1.length; i++) {
        if (values1[i] !== values2[i]) {
          differentCount++;
        }
      }

      expect(differentCount).toBeGreaterThan(0);
    });
  });
});
