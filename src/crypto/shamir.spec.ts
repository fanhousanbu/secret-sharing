import { splitSecret, recoverSecret } from './shamir';

// 模拟crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

describe('Shamir Secret Sharing', () => {
  describe('splitSecret', () => {
    test('应该分割秘密为指定数量的份额', () => {
      const secret = 123456789n;
      const config = { threshold: 3, totalShares: 5 };
      
      const shares = splitSecret(secret, config);
      
      expect(shares).toHaveLength(5);
      shares.forEach((share, index) => {
        expect(share.id).toBe(index + 1);
        expect(typeof share.value).toBe('bigint');
      });
    });

    test('应该生成不同的份额', () => {
      const secret = 987654321n;
      const config = { threshold: 2, totalShares: 4 };
      
      const shares = splitSecret(secret, config);
      
      // 检查份额值是否不同
      const values = shares.map(s => s.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(4);
    });

    test('应该处理阈值等于总份额的情况', () => {
      const secret = 42n;
      const config = { threshold: 3, totalShares: 3 };
      
      const shares = splitSecret(secret, config);
      
      expect(shares).toHaveLength(3);
    });

    test('应该在阈值大于总份额时抛出错误', () => {
      const secret = 100n;
      const config = { threshold: 4, totalShares: 3 };
      
      expect(() => splitSecret(secret, config)).toThrow('阈值不能大于总份额数');
    });

    test('应该在阈值小于2时抛出错误', () => {
      const secret = 100n;
      const config = { threshold: 1, totalShares: 3 };
      
      expect(() => splitSecret(secret, config)).toThrow('阈值必须至少为2');
    });
  });

  describe('recoverSecret', () => {
    test('应该从足够的份额中恢复秘密', () => {
      const secret = 123456789n;
      const config = { threshold: 3, totalShares: 5 };
      
      const allShares = splitSecret(secret, config);
      const sharesToUse = allShares.slice(0, 3);
      
      const recoveredSecret = recoverSecret(sharesToUse, 3);
      
      expect(recoveredSecret).toBe(secret);
    });

    test('应该从不同份额组合中恢复秘密', () => {
      const secret = 987654321n;
      const config = { threshold: 3, totalShares: 5 };
      
      const allShares = splitSecret(secret, config);
      const sharesToUse = [allShares[0], allShares[2], allShares[4]];
      
      const recoveredSecret = recoverSecret(sharesToUse, 3);
      
      expect(recoveredSecret).toBe(secret);
    });

    test('应该处理最小份额数量', () => {
      const secret = 42n;
      const config = { threshold: 2, totalShares: 3 };
      
      const allShares = splitSecret(secret, config);
      const sharesToUse = allShares.slice(0, 2);
      
      const recoveredSecret = recoverSecret(sharesToUse, 2);
      
      expect(recoveredSecret).toBe(secret);
    });

    test('应该处理所有份额', () => {
      const secret = 100n;
      const config = { threshold: 2, totalShares: 4 };
      
      const allShares = splitSecret(secret, config);
      
      const recoveredSecret = recoverSecret(allShares, 2);
      
      expect(recoveredSecret).toBe(secret);
    });

    test('应该在份额不足时抛出错误', () => {
      const secret = 100n;
      const config = { threshold: 3, totalShares: 5 };
      
      const allShares = splitSecret(secret, config);
      const sharesToUse = allShares.slice(0, 2); // 只有2个份额，需要3个
      
      expect(() => recoverSecret(sharesToUse, 3)).toThrow('需要至少3个份额才能恢复秘密');
    });
  });

  describe('边界情况', () => {
    test('应该处理零值秘密', () => {
      const secret = 0n;
      const config = { threshold: 2, totalShares: 3 };
      
      const shares = splitSecret(secret, config);
      const recoveredSecret = recoverSecret(shares.slice(0, 2), 2);
      
      expect(recoveredSecret).toBe(secret);
    });

    test('应该处理大数值秘密', () => {
      const secret = 2n ** 100n; // 大数值测试
      const config = { threshold: 3, totalShares: 5 };
      
      const shares = splitSecret(secret, config);
      const recoveredSecret = recoverSecret(shares.slice(0, 3), 3);
      
      expect(recoveredSecret).toBe(secret);
    });

    test('应该处理接近素数边界的值', () => {
      const prime = 2n ** 521n - 1n;
      const secret = prime - 1n; // 接近素数的值
      const config = { threshold: 2, totalShares: 3 };
      
      const shares = splitSecret(secret, config);
      const recoveredSecret = recoverSecret(shares.slice(0, 2), 2);
      
      expect(recoveredSecret).toBe(secret);
    });

    test('应该处理重复测试的一致性', () => {
      const secret = 12345n;
      const config = { threshold: 3, totalShares: 5 };
      
      // 多次测试确保结果一致
      for (let i = 0; i < 3; i++) {
        const shares = splitSecret(secret, config);
        const recoveredSecret = recoverSecret(shares.slice(0, 3), 3);
        expect(recoveredSecret).toBe(secret);
      }
    });
  });

  describe('数学运算', () => {
    test('应该正确处理模运算', () => {
      const secret = 1000n;
      const config = { threshold: 2, totalShares: 3 };
      
      const shares = splitSecret(secret, config);
      
      // 验证所有份额值都在合理范围内
      shares.forEach(share => {
        expect(share.value).toBeGreaterThanOrEqual(0n);
        // 份额值应该小于素数
        expect(share.value).toBeLessThan(2n ** 521n);
      });
    });

    test('应该生成足够随机的系数', () => {
      const secret = 100n;
      const config = { threshold: 3, totalShares: 5 };
      
      const shares1 = splitSecret(secret, config);
      const shares2 = splitSecret(secret, config);
      
      // 除了第一个份额（可能相同），其他份额应该不同
      const values1 = shares1.map(s => s.value);
      const values2 = shares2.map(s => s.value);
      
      // 至少有一些份额值应该不同（由于随机性）
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