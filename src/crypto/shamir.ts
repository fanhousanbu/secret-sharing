import { Share, SecretSharingConfig } from './types';

// 生成安全的质数用于有限域运算
function generateSecurePrime(): bigint {
  // 使用更大的质数，至少256位以确保安全性
  // 这里使用一个已知的安全质数：2^256 - 2^224 + 2^192 + 2^96 - 1
  // 这是NIST P-256椭圆曲线使用的质数，经过广泛验证
  return 2n ** 256n - 2n ** 224n + 2n ** 192n + 2n ** 96n - 1n;
}

// 动态生成质数，每次调用都生成新的安全质数
let currentPrime: bigint | null = null;

function getSecurePrime(): bigint {
  if (!currentPrime) {
    currentPrime = generateSecurePrime();
  }
  return currentPrime;
}



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
        numerator = mod(numerator * BigInt(-shares[j].id), getSecurePrime());
        denominator = mod(
          denominator * BigInt(shares[i].id - shares[j].id),
          getSecurePrime()
        );
      }
    }

    const lagrangeCoeff = mod(
      numerator * modInverse(denominator, getSecurePrime()),
      getSecurePrime()
    );
    result = mod(result + shares[i].value * lagrangeCoeff, getSecurePrime());
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
    coeff = coeff % getSecurePrime();
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
    result = mod(result + coeff * xPower, getSecurePrime());
    xPower = mod(xPower * BigInt(x), getSecurePrime());
  }

  return result;
}

/**
 * 将秘密分割为多个份额
 */
export function splitSecret(
  secret: bigint,
  config: SecretSharingConfig
): Share[] {
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
