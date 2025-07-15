import { Share, SecretSharingConfig } from './types';

// 大质数，用于有限域运算
const PRIME = 2n ** 521n - 1n;

/**
 * 计算模运算
 */
function mod(a: bigint, m: bigint): bigint {
  return ((a % m) + m) % m;
}

/**
 * 计算模逆元 (使用扩展欧几里得算法)
 */
function modInverse(a: bigint, m: bigint): bigint {
  if (a < 0n) a = mod(a, m);
  
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];
  
  while (r !== 0n) {
    const quotient = old_r / r;
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
  }
  
  return mod(old_s, m);
}

/**
 * 计算拉格朗日插值
 */
function lagrangeInterpolation(shares: Share[]): bigint {
  let result = 0n;
  
  for (let i = 0; i < shares.length; i++) {
    let numerator = 1n;
    let denominator = 1n;
    
    for (let j = 0; j < shares.length; j++) {
      if (i !== j) {
        numerator = mod(numerator * BigInt(-shares[j].id), PRIME);
        denominator = mod(denominator * BigInt(shares[i].id - shares[j].id), PRIME);
      }
    }
    
    const lagrangeCoeff = mod(numerator * modInverse(denominator, PRIME), PRIME);
    result = mod(result + shares[i].value * lagrangeCoeff, PRIME);
  }
  
  return result;
}

/**
 * 生成随机多项式系数
 */
function generateCoefficients(threshold: number, secret: bigint): bigint[] {
  const coefficients = [secret];
  
  for (let i = 1; i < threshold; i++) {
    // 使用Web Crypto API生成随机数
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    let coeff = 0n;
    for (let j = 0; j < randomBytes.length; j++) {
      coeff = (coeff << 8n) + BigInt(randomBytes[j]);
    }
    coeff = coeff % PRIME;
    coefficients.push(coeff);
  }
  
  return coefficients;
}

/**
 * 计算多项式在给定点的值
 */
function evaluatePolynomial(coefficients: bigint[], x: number): bigint {
  let result = 0n;
  let xPower = 1n;
  
  for (const coeff of coefficients) {
    result = mod(result + coeff * xPower, PRIME);
    xPower = mod(xPower * BigInt(x), PRIME);
  }
  
  return result;
}

/**
 * 将秘密分割为多个份额
 */
export function splitSecret(secret: bigint, config: SecretSharingConfig): Share[] {
  const { threshold, totalShares } = config;
  
  if (threshold > totalShares) {
    throw new Error('阈值不能大于总份额数');
  }
  
  if (threshold < 2) {
    throw new Error('阈值必须至少为2');
  }
  
  // 生成多项式系数
  const coefficients = generateCoefficients(threshold, secret);
  
  // 生成份额
  const shares: Share[] = [];
  for (let i = 1; i <= totalShares; i++) {
    const value = evaluatePolynomial(coefficients, i);
    shares.push({ id: i, value });
  }
  
  return shares;
}

/**
 * 从份额中恢复秘密
 */
export function recoverSecret(shares: Share[], threshold: number): bigint {
  if (shares.length < threshold) {
    throw new Error(`需要至少${threshold}个份额才能恢复秘密`);
  }
  
  // 只使用前threshold个份额
  const usedShares = shares.slice(0, threshold);
  
  // 使用拉格朗日插值恢复秘密
  return lagrangeInterpolation(usedShares);
} 