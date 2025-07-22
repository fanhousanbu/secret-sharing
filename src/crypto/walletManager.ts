import { Wallet } from 'ethers';
import { encryptMnemonic, decryptVault } from './secureVault';

const VAULT_KEY = 'encryptedVault';
let inMemoryWallet: Wallet | null = null;

/**
 * Creates a new wallet, encrypts the mnemonic, and stores the vault in IndexedDB.
 *
 * @param password - The password to encrypt the wallet.
 * @returns The mnemonic of the newly created wallet.
 */
export async function createNewWallet(password: string): Promise<string> {
  const wallet = Wallet.createRandom();
  const mnemonic = wallet.mnemonic?.phrase;
  if (!mnemonic) {
    throw new Error('Could not generate mnemonic.');
  }
  const encryptedVault = await encryptMnemonic(mnemonic, password);

  // Store the encrypted vault in IndexedDB
  // (For simplicity, using localStorage here. For production, use IndexedDB)
  localStorage.setItem(VAULT_KEY, encryptedVault);

  inMemoryWallet = wallet as unknown as Wallet;
  return mnemonic;
}

/**
 * Unlocks the wallet by decrypting the vault from IndexedDB.
 *
 * @param password - The password to decrypt the wallet.
 * @returns A boolean indicating whether the unlock was successful.
 */
export async function unlockWallet(password: string): Promise<boolean> {
  const encryptedVault = localStorage.getItem(VAULT_KEY);
  if (!encryptedVault) {
    throw new Error('No wallet found.');
  }

  try {
    const wallet = await decryptVault(encryptedVault, password);
    inMemoryWallet = wallet as unknown as Wallet;
    return true;
  } catch (error) {
    console.error('Failed to unlock wallet:', error);
    inMemoryWallet = null;
    return false;
  }
}

/**
 * Imports a wallet from a mnemonic, encrypts it, and stores the vault in IndexedDB.
 *
 * @param mnemonic - The mnemonic phrase to import.
 * @param password - The password to encrypt the wallet.
 */
export async function importWalletFromMnemonic(mnemonic: string, password: string): Promise<void> {
  const encryptedVault = await encryptMnemonic(mnemonic, password);
  localStorage.setItem(VAULT_KEY, encryptedVault);
  inMemoryWallet = Wallet.fromPhrase(mnemonic) as unknown as Wallet;
}

/**
 * Locks the wallet by clearing the in-memory wallet instance.
 */
export function lockWallet(): void {
  inMemoryWallet = null;
}

/**
 * Gets the in-memory wallet instance.
 *
 * @returns The wallet instance or null if locked.
 */
export function getWallet(): Wallet | null {
  return inMemoryWallet;
}
