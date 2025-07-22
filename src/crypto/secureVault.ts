import { Wallet } from 'ethers';

/**
 * Encrypts a mnemonic phrase with a password to create a JSON keystore (Vault).
 *
 * @param mnemonic - The mnemonic phrase to encrypt.
 * @param password - The password to use for encryption.
 * @returns A promise that resolves to the encrypted JSON keystore string.
 */
export async function encryptMnemonic(mnemonic: string, password: string): Promise<string> {
  const wallet = Wallet.fromPhrase(mnemonic);
  const encryptedJson = await wallet.encrypt(password);
  return encryptedJson;
}

/**
 * Decrypts a JSON keystore (Vault) with a password to retrieve the Wallet instance.
 *
 * @param encryptedJson - The encrypted JSON keystore string.
 * @param password - The password to use for decryption.
 * @returns A promise that resolves to the decrypted Wallet instance.
 */
export async function decryptVault(encryptedJson: string, password: string): Promise<Wallet> {
  const wallet = await Wallet.fromEncryptedJson(encryptedJson, password) as Wallet;
  return wallet;
}
