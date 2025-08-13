import { Share, SecretSharingConfig } from './types';

// Generate secure prime for finite field operations
function generateSecurePrime(): bigint {
  // Use a larger prime, at least 256 bits for security
  // Here we use a known secure prime: 2^256 - 2^224 + 2^192 + 2^96 - 1
  // This is the prime used by NIST P-256 elliptic curve, widely validated
  return 2n ** 256n - 2n ** 224n + 2n ** 192n + 2n ** 96n - 1n;
}

// Dynamic prime generation, generates new secure prime on each call
let currentPrime: bigint | null = null;

function getSecurePrime(): bigint {
  if (!currentPrime) {
    currentPrime = generateSecurePrime();
  }
  return currentPrime;
}



/**
 * Calculate modular arithmetic
 */
function mod(a: bigint, m: bigint): bigint {
  return ((a % m) + m) % m;
}

/**
 * Calculate modular inverse (using extended Euclidean algorithm)
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
 * Calculate Lagrange interpolation
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
 * Generate random polynomial coefficients
 */
function generateCoefficients(threshold: number, secret: bigint): bigint[] {
  const coefficients = [secret];

  for (let i = 1; i < threshold; i++) {
    // Use Web Crypto API to generate random numbers
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
 * Calculate polynomial value at given point
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
 * Split secret into multiple shares
 */
export function splitSecret(
  secret: bigint,
  config: SecretSharingConfig
): Share[] {
  const { threshold, totalShares } = config;

  if (threshold > totalShares) {
    throw new Error('Threshold cannot be greater than total shares');
  }

  if (threshold < 2) {
    throw new Error('Threshold must be at least 2');
  }

  // Generate polynomial coefficients
  const coefficients = generateCoefficients(threshold, secret);

  // Generate shares
  const shares: Share[] = [];
  for (let i = 1; i <= totalShares; i++) {
    const value = evaluatePolynomial(coefficients, i);
    shares.push({ id: i, value });
  }

  return shares;
}

/**
 * Recover secret from shares
 */
export function recoverSecret(shares: Share[], threshold: number): bigint {
  if (shares.length < threshold) {
    throw new Error(`Need at least ${threshold} shares to recover secret`);
  }

  // Only use the first threshold shares
  const usedShares = shares.slice(0, threshold);

  // Use Lagrange interpolation to recover secret
  return lagrangeInterpolation(usedShares);
}
