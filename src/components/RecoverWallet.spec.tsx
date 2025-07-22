import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecoverWallet } from './RecoverWallet';
import { recoverSecret } from '../crypto/shamir';
import { importWalletFromMnemonic } from '../crypto/walletManager';
import { bigIntToMnemonic } from '../crypto/utils';


// Mock crypto functions
jest.mock('../crypto/shamir', () => ({
  recoverSecret: jest.fn(),
}));
jest.mock('../crypto/walletManager', () => ({
  importWalletFromMnemonic: jest.fn(),
}));
jest.mock('../crypto/utils', () => ({
  bigIntToMnemonic: jest.fn(),
}));

// Mock alert
const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

// Mock console.error
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('RecoverWallet', () => {
  const mockOnRecover = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render the component with input fields', () => {
    render(<RecoverWallet onRecover={mockOnRecover} />);

    expect(screen.getByText('Recover Wallet from Shares')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share 2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share 3')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a new password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recover Wallet/i })).toBeInTheDocument();
  });

  test('should update share input values', () => {
    render(<RecoverWallet onRecover={mockOnRecover} />);

    const shareInput1 = screen.getByPlaceholderText('Share 1') as HTMLInputElement;
    fireEvent.change(shareInput1, { target: { value: '1-123' } });
    expect(shareInput1.value).toBe('1-123');
  });

  test('should update password input value', () => {
    render(<RecoverWallet onRecover={mockOnRecover} />);

    const passwordInput = screen.getByPlaceholderText('Enter a new password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
    expect(passwordInput.value).toBe('newpassword');
  });

  test('should successfully recover wallet with valid shares and password', async () => {
    (recoverSecret as jest.Mock).mockResolvedValue(BigInt(123));
    (bigIntToMnemonic as jest.Mock).mockReturnValue('recovered mnemonic');
    (importWalletFromMnemonic as jest.Mock).mockResolvedValue(undefined);

    render(<RecoverWallet onRecover={mockOnRecover} />);

    const shareInput1 = screen.getByPlaceholderText('Share 1') as HTMLInputElement;
    const shareInput2 = screen.getByPlaceholderText('Share 2') as HTMLInputElement;
    const shareInput3 = screen.getByPlaceholderText('Share 3') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Enter a new password') as HTMLInputElement;
    const recoverButton = screen.getByRole('button', { name: /Recover Wallet/i });

    fireEvent.change(shareInput1, { target: { value: '1-123' } });
    fireEvent.change(shareInput2, { target: { value: '2-456' } });
    fireEvent.change(shareInput3, { target: { value: '3-789' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    fireEvent.click(recoverButton);

    await waitFor(() => {
      expect(recoverSecret).toHaveBeenCalledWith(
        [
          { id: 1, value: BigInt(123) },
          { id: 2, value: BigInt(456) },
          { id: 3, value: BigInt(789) },
        ],
        3
      );
      expect(bigIntToMnemonic).toHaveBeenCalledWith(BigInt(123));
      expect(importWalletFromMnemonic).toHaveBeenCalledWith('recovered mnemonic', 'newpassword');
      expect(mockAlert).toHaveBeenCalledWith('Wallet recovered successfully!');
      expect(mockOnRecover).toHaveBeenCalledWith(true);
    });
  });

  test('should handle recovery failure', async () => {
    const errorMessage = 'Recovery failed';
    (recoverSecret as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<RecoverWallet onRecover={mockOnRecover} />);

    const shareInput1 = screen.getByPlaceholderText('Share 1') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Enter a new password') as HTMLInputElement;
    const recoverButton = screen.getByRole('button', { name: /Recover Wallet/i });

    fireEvent.change(shareInput1, { target: { value: '1-123' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    fireEvent.click(recoverButton);

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to recover wallet:', expect.any(Error));
      expect(mockAlert).toHaveBeenCalledWith('Failed to recover wallet. Please check your shares.');
      expect(mockOnRecover).toHaveBeenCalledWith(false);
    });
  });
});
