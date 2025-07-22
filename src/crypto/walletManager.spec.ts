import { createNewWallet, unlockWallet, importWalletFromMnemonic, lockWallet, getWallet } from './walletManager';
import { Wallet } from 'ethers';
import { encryptMnemonic, decryptVault } from './secureVault';

// Mock ethers Wallet
jest.mock('ethers', () => ({
  Wallet: {
    createRandom: jest.fn(() => ({
      mnemonic: { phrase: 'test mnemonic' },
      address: '0xMockAddress',
    })),
    fromPhrase: jest.fn(() => ({
      address: '0xMockAddress',
      mnemonic: { phrase: 'test mnemonic' },
    })),
    fromEncryptedJson: jest.fn(),
  },
}));

// Mock secureVault functions
jest.mock('./secureVault', () => ({
  encryptMnemonic: jest.fn(),
  decryptVault: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('walletManager', () => {
  const mockPassword = 'testpassword';
  const mockMnemonic = 'test mnemonic';
  const mockEncryptedVault = 'encryptedVaultString';
  const mockWalletInstance = { address: '0xMockAddress', mnemonic: { phrase: 'test mnemonic' } };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (encryptMnemonic as jest.Mock).mockResolvedValue(mockEncryptedVault);
    (decryptVault as jest.Mock).mockResolvedValue(mockWalletInstance);
    lockWallet(); // Ensure inMemoryWallet is null before each test
  });

  describe('createNewWallet', () => {
    test('should create a new wallet, encrypt it, and store in localStorage', async () => {
      const mnemonic = await createNewWallet(mockPassword);

      expect(Wallet.createRandom).toHaveBeenCalledTimes(1);
      expect(encryptMnemonic).toHaveBeenCalledWith(mockMnemonic, mockPassword);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('encryptedVault', mockEncryptedVault);
      expect(getWallet()).toEqual(mockWalletInstance);
      expect(mnemonic).toBe(mockMnemonic);
    });

    test('should throw error if mnemonic generation fails', async () => {
      (Wallet.createRandom as jest.Mock).mockReturnValueOnce({ mnemonic: null });

      await expect(createNewWallet(mockPassword)).rejects.toThrow('Could not generate mnemonic.');
    });
  });

  describe('unlockWallet', () => {
    test('should unlock wallet from localStorage and set in-memory wallet', async () => {
      localStorageMock.setItem('encryptedVault', mockEncryptedVault);

      const result = await unlockWallet(mockPassword);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('encryptedVault');
      expect(decryptVault).toHaveBeenCalledWith(mockEncryptedVault, mockPassword);
      expect(getWallet()).toEqual(mockWalletInstance);
      expect(result).toBe(true);
    });

    test('should throw an error if no wallet found in localStorage', async () => {
      await expect(unlockWallet(mockPassword)).rejects.toThrow('No wallet found.');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('encryptedVault');
      expect(getWallet()).toBeNull();
    });

    test('should return false if decryption fails', async () => {
      localStorageMock.setItem('encryptedVault', mockEncryptedVault);
      (decryptVault as jest.Mock).mockRejectedValueOnce(new Error('Decryption failed'));

      const result = await unlockWallet(mockPassword);

      expect(result).toBe(false);
      expect(getWallet()).toBeNull();
    });
  });

  describe('importWalletFromMnemonic', () => {
    test('should import mnemonic, encrypt, and store in localStorage', async () => {
      await importWalletFromMnemonic(mockMnemonic, mockPassword);

      expect(encryptMnemonic).toHaveBeenCalledWith(mockMnemonic, mockPassword);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('encryptedVault', mockEncryptedVault);
      expect(Wallet.fromPhrase).toHaveBeenCalledWith(mockMnemonic);
      expect(getWallet()).toEqual(mockWalletInstance);
    });
  });

  describe('lockWallet', () => {
    test('should clear the in-memory wallet', async () => {
      await createNewWallet(mockPassword); // Ensure wallet is in memory
      expect(getWallet()).not.toBeNull();

      lockWallet();

      expect(getWallet()).toBeNull();
    });
  });

  describe('getWallet', () => {
    test('should return the in-memory wallet if set', async () => {
      await createNewWallet(mockPassword);
      const wallet = getWallet();
      expect(wallet).toEqual(mockWalletInstance);
    });

    test('should return null if no in-memory wallet', () => {
      expect(getWallet()).toBeNull();
    });
  });
});
