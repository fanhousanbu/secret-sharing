import { Buffer } from 'buffer';

/**
 * Converts a mnemonic string to a BigInt.
 * This is a simplified conversion for demonstration purposes.
 * In a real application, you might want to hash the mnemonic or derive a seed.
 * @param mnemonic - The mnemonic string.
 * @returns The BigInt representation of the mnemonic.
 */
export function mnemonicToBigInt(mnemonic: string): bigint {
  const hex = Buffer.from(mnemonic, 'utf8').toString('hex');
  return BigInt('0x' + hex);
}

/**
 * Converts a BigInt back to a mnemonic string.
 * @param bigInt - The BigInt to convert.
 * @returns The mnemonic string.
 */
export function bigIntToMnemonic(bigInt: bigint): string {
  let hex = bigInt.toString(16);
  // Pad with leading zero if hex string has odd length
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }
  return Buffer.from(hex, 'hex').toString('utf8');
}
