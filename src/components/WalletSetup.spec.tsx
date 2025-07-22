import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletSetup } from './WalletSetup';
import { createNewWallet, unlockWallet } from '../crypto/walletManager';
import { splitSecret } from '../crypto/shamir';
import { mnemonicToBigInt } from '../crypto/utils';

// Mock child components
jest.mock('./DisplayShares', () => ({
  DisplayShares: ({ onDone }: any) => (
    <div data-testid="display-shares">
      DisplayShares Component
      <button onClick={onDone}>Done Displaying Shares</button>
    </div>
  ),
}));

jest.mock('./RecoverWallet', () => ({
  RecoverWallet: ({ onRecover }: any) => (
    <div data-testid="recover-wallet">
      RecoverWallet Component
      <button onClick={() => onRecover(true)}>Simulate Recovery Success</button>
      <button onClick={() => onRecover(false)}>Simulate Recovery Failure</button>
    </div>
  ),
}));

// Mock crypto functions
jest.mock('../crypto/walletManager', () => ({
  createNewWallet: jest.fn(),
  unlockWallet: jest.fn(),
}));

jest.mock('../crypto/shamir', () => ({
  splitSecret: jest.fn(),
}));

jest.mock('../crypto/utils', () => ({
  mnemonicToBigInt: jest.fn(),
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

// Mock alert
const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

describe('WalletSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    jest.spyOn(window.location, 'reload').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  

  // Test 1: Initial render when no vault exists
  test('should display create and import options when no vault exists', () => {
    render(<WalletSetup />);
    expect(screen.getByText('Wallet Setup')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create New Wallet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import from Recovery Shares/i })).toBeInTheDocument();
    expect(screen.queryByText('Unlock Wallet')).not.toBeInTheDocument();
  });

  // Test 2: Initial render when a vault exists
  test('should display unlock wallet when vault exists', () => {
    localStorageMock.setItem('encryptedVault', 'someEncryptedVault');
    render(<WalletSetup />);
    expect(screen.getByText('Unlock Wallet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unlock/i })).toBeInTheDocument();
    expect(screen.queryByText('Create New Wallet')).not.toBeInTheDocument();
  });

  // Test 3: handleUnlock function - successful unlock
  test('should call unlockWallet and reload on successful unlock', async () => {
    localStorageMock.setItem('encryptedVault', 'someEncryptedVault');
    (unlockWallet as jest.Mock).mockResolvedValue(true);

    render(<WalletSetup />);
    fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'testpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Unlock/i }));

    await waitFor(() => {
      expect(unlockWallet).toHaveBeenCalledWith('testpass');
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  // Test 4: handleUnlock function - failed unlock
  test('should show alert and not reload on failed unlock', async () => {
    localStorageMock.setItem('encryptedVault', 'someEncryptedVault');
    (unlockWallet as jest.Mock).mockResolvedValue(false);

    render(<WalletSetup />);
    fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Unlock/i }));

    await waitFor(() => {
      expect(unlockWallet).toHaveBeenCalledWith('wrongpass');
      expect(mockAlert).toHaveBeenCalledWith('Failed to unlock wallet');
      expect(window.location.reload).not.toHaveBeenCalled();
    });
  });

  // Test 5: handleCreate function
  test('should create new wallet, split secret, and display shares', async () => {
    (createNewWallet as jest.Mock).mockResolvedValue('test mnemonic');
    (mnemonicToBigInt as jest.Mock).mockReturnValue(BigInt(123));
    (splitSecret as jest.Mock).mockReturnValue([
      { id: 1, value: BigInt(1) },
      { id: 2, value: BigInt(2) },
    ]);

    render(<WalletSetup />);
    fireEvent.change(screen.getByPlaceholderText('Enter a new password'), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Wallet/i }));

    await waitFor(() => {
      expect(createNewWallet).toHaveBeenCalledWith('newpass');
      expect(mnemonicToBigInt).toHaveBeenCalledWith('test mnemonic');
      expect(splitSecret).toHaveBeenCalledWith(BigInt(123), { threshold: 3, totalShares: 5 });
      expect(screen.getByTestId('display-shares')).toBeInTheDocument();
    });
  });

  // Test 6: onDoneDisplayingShares function
  test('should clear shares and reload when done displaying shares', async () => {
    (createNewWallet as jest.Mock).mockResolvedValue('test mnemonic');
    (mnemonicToBigInt as jest.Mock).mockReturnValue(BigInt(123));
    (splitSecret as jest.Mock).mockReturnValue([
      { id: 1, value: BigInt(1) },
      { id: 2, value: BigInt(2) },
    ]);

    render(<WalletSetup />);
    fireEvent.change(screen.getByPlaceholderText('Enter a new password'), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Wallet/i }));

    await waitFor(() => {
      expect(screen.getByTestId('display-shares')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Done Displaying Shares/i }));

    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  // Test 7: Switching to recovery mode
  test('should render RecoverWallet component when import button is clicked', async () => {
    render(<WalletSetup />);
    fireEvent.click(screen.getByRole('button', { name: /Import from Recovery Shares/i }));

    await waitFor(() => {
      expect(screen.getByTestId('recover-wallet')).toBeInTheDocument();
    });
  });

  // Test 8: handleRecoverySuccess function - successful recovery
  test('should set isRecovering to false and reload on successful recovery', async () => {
    render(<WalletSetup />);
    fireEvent.click(screen.getByRole('button', { name: /Import from Recovery Shares/i }));

    await waitFor(() => {
      expect(screen.getByTestId('recover-wallet')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Simulate Recovery Success/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('recover-wallet')).not.toBeInTheDocument();
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  // Test 9: handleRecoverySuccess function - failed recovery
  test('should not reload on failed recovery', async () => {
    render(<WalletSetup />);
    fireEvent.click(screen.getByRole('button', { name: /Import from Recovery Shares/i }));

    await waitFor(() => {
      expect(screen.getByTestId('recover-wallet')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Simulate Recovery Failure/i }));

    await waitFor(() => {
      expect(screen.getByTestId('recover-wallet')).toBeInTheDocument(); // Still in recovery mode
      expect(window.location.reload).not.toHaveBeenCalled();
    });
  });
});
