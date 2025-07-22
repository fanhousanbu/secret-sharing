import { encryptMnemonic, decryptVault } from './secureVault';
import { Wallet } from 'ethers';

// Mock the ethers Wallet class
jest.mock('ethers', () => {
  const mockWalletInstance = {
    encrypt: jest.fn(),
    fromEncryptedJson: jest.fn(),
    address: '0xMockAddress',
  };

  return {
    Wallet: {
      fromPhrase: jest.fn(() => mockWalletInstance),
      fromEncryptedJson: jest.fn(() => mockWalletInstance),
    },
  };
});

describe('secureVault', () => {
  const mockMnemonic = 'test test test test test test test test test test test test';
  const mockPassword = 'testpassword';
  const mockEncryptedJson = '{"mock":"encryptedJson"}';

  beforeEach(() => {
    // Reset mocks before each test
    (Wallet.fromPhrase as jest.Mock).mockClear();
    (Wallet.fromEncryptedJson as jest.Mock).mockClear();
    (Wallet.fromPhrase(mockMnemonic).encrypt as jest.Mock).mockClear();
  });

  describe('encryptMnemonic', () => {
    test('should encrypt a mnemonic and return a JSON string', async () => {
      (Wallet.fromPhrase(mockMnemonic).encrypt as jest.Mock).mockResolvedValue(mockEncryptedJson);

      const result = await encryptMnemonic(mockMnemonic, mockPassword);

      expect(Wallet.fromPhrase).toHaveBeenCalledWith(mockMnemonic);
      expect(Wallet.fromPhrase(mockMnemonic).encrypt).toHaveBeenCalledWith(mockPassword);
      expect(result).toBe(mockEncryptedJson);
    });

    test('should throw an error if encryption fails', async () => {
      const errorMessage = 'Encryption failed';
      (Wallet.fromPhrase(mockMnemonic).encrypt as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(encryptMnemonic(mockMnemonic, mockPassword)).rejects.toThrow(errorMessage);
    });
  });

  describe('decryptVault', () => {
    test('should decrypt a vault and return a Wallet instance', async () => {
      const mockDecryptedWallet = { address: '0xMockAddress' };
      (Wallet.fromEncryptedJson as jest.Mock).mockResolvedValue(mockDecryptedWallet);

      const result = await decryptVault(mockEncryptedJson, mockPassword);

      expect(Wallet.fromEncryptedJson).toHaveBeenCalledWith(mockEncryptedJson, mockPassword);
      expect(result).toBe(mockDecryptedWallet);
    });

    test('should throw an error if decryption fails', async () => {
      const errorMessage = 'Decryption failed';
      (Wallet.fromEncryptedJson as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(decryptVault(mockEncryptedJson, mockPassword)).rejects.toThrow(errorMessage);
    });
  });
});
