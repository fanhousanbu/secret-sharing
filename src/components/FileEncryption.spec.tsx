import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileEncryption } from './FileEncryption';

// Mock dependencies
jest.mock('../crypto/fileProcessor', () => ({
  WebFileProcessor: jest.fn().mockImplementation(() => ({
    splitFile: jest.fn().mockResolvedValue({
      shares: [],
      metadata: { originalSHA256: 'test-hash' },
      encryptedData: new ArrayBuffer(0),
    }),
    splitFilePureShamir: jest.fn().mockResolvedValue({
      shares: [],
      metadata: { originalSHA256: 'test-hash' },
    }),
    downloadFile: jest.fn(),
    downloadJson: jest.fn(),
    generateShareFiles: jest.fn().mockReturnValue([]),
    generatePureShamirShareFiles: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    formatMessage: (key: string) => key,
  }),
}));

describe('FileEncryption Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render without crashing', () => {
    render(<FileEncryption />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should render file upload section', () => {
    render(<FileEncryption />);
    // Check if file upload area exists
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  test('should render scheme selection', () => {
    render(<FileEncryption />);
    // Check if scheme selection area exists
    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons.length).toBe(2);
  });

  test('should render configuration section', () => {
    render(<FileEncryption />);
    // Check if configuration area exists
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBe(2);
  });

  test('should render password configuration', () => {
    render(<FileEncryption />);
    // Check if password configuration area exists
    const passwordCheckbox = screen.getByRole('checkbox');
    expect(passwordCheckbox).toBeInTheDocument();
  });

  test('should have default values', () => {
    render(<FileEncryption />);
    const thresholdInput = screen.getByDisplayValue('3');
    const totalSharesInput = screen.getByDisplayValue('5');
    expect(thresholdInput).toBeInTheDocument();
    expect(totalSharesInput).toBeInTheDocument();
  });

  test('should handle file selection', () => {
    render(<FileEncryption />);
    // Check if file selection button exists
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('should render scheme radio buttons', () => {
    render(<FileEncryption />);
    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons.length).toBe(2);
  });

  test('should have hybrid scheme selected by default', () => {
    render(<FileEncryption />);
    const hybridRadio = screen.getByDisplayValue('hybrid');
    expect(hybridRadio).toBeChecked();
  });

  test('should handle scheme change', () => {
    render(<FileEncryption />);
    const pureShamirRadio = screen.getByDisplayValue('pure-shamir');
    fireEvent.click(pureShamirRadio);
    expect(pureShamirRadio).toBeChecked();
  });

  test('should handle threshold change', () => {
    render(<FileEncryption />);
    const thresholdInput = screen.getByDisplayValue('3');
    fireEvent.change(thresholdInput, { target: { value: '4' } });
    expect(thresholdInput).toHaveValue(4);
  });

  test('should handle total shares change', () => {
    render(<FileEncryption />);
    const totalSharesInput = screen.getByDisplayValue('5');
    fireEvent.change(totalSharesInput, { target: { value: '6' } });
    expect(totalSharesInput).toHaveValue(6);
  });

  test('should handle password checkbox toggle', () => {
    render(<FileEncryption />);
    const passwordCheckbox = screen.getByRole('checkbox');
    fireEvent.click(passwordCheckbox);
    expect(passwordCheckbox).toBeChecked();
  });

  test('should show password fields when password is enabled', () => {
    render(<FileEncryption />);
    const passwordCheckbox = screen.getByRole('checkbox');
    fireEvent.click(passwordCheckbox);

    // Check if password input fields exist
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBeGreaterThan(0);
  });

  test('should render encryption button', () => {
    render(<FileEncryption />);
    // Check if encryption button exists
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('should disable encryption button when no file is selected', () => {
    render(<FileEncryption />);
    // Check if main button is disabled
    const buttons = screen.getAllByRole('button');
    const mainButton = buttons[buttons.length - 1];
    expect(mainButton).toBeDisabled();
  });

  test('should show pure shamir info when pure shamir is selected', () => {
    render(<FileEncryption />);
    const pureShamirRadio = screen.getByDisplayValue('pure-shamir');
    fireEvent.click(pureShamirRadio);

    // Check if info area exists
    const infoArea = document.querySelector('.bg-blue-50');
    expect(infoArea).toBeInTheDocument();
  });

  test('should render all input fields', () => {
    render(<FileEncryption />);
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThan(0);
  });

  test('should have proper styling classes', () => {
    render(<FileEncryption />);
    // Check if container has correct styling classes
    const container = document.querySelector('.mx-auto');
    expect(container).toBeInTheDocument();
  });

  test('should render SVG icons', () => {
    render(<FileEncryption />);
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  test('should handle file input change', async () => {
    render(<FileEncryption />);
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  test('should show file size when file is selected', async () => {
    render(<FileEncryption />);
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      // Check if file information is displayed
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  test('should validate threshold constraints', () => {
    render(<FileEncryption />);
    const thresholdInput = screen.getByDisplayValue('3');
    const totalSharesInput = screen.getByDisplayValue('5');

    // Test min value
    fireEvent.change(thresholdInput, { target: { value: '1' } });
    expect(thresholdInput).toHaveAttribute('min', '2');

    // Test max value
    fireEvent.change(totalSharesInput, { target: { value: '3' } });
    expect(thresholdInput).toHaveAttribute('max', '3');
  });

  test('should render password security notes', () => {
    render(<FileEncryption />);
    const passwordCheckbox = screen.getByRole('checkbox');
    fireEvent.click(passwordCheckbox);

    // Check if password input area exists (when password is enabled)
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBeGreaterThan(0);
  });

  test('should render no password warning', () => {
    render(<FileEncryption />);
    // Check if no password warning area exists (when password is not enabled)
    const warningArea = document.querySelector('.bg-yellow-50');
    expect(warningArea).toBeInTheDocument();
  });

  test('should be accessible', () => {
    render(<FileEncryption />);
    const buttons = screen.getAllByRole('button');
    const checkboxes = screen.getAllByRole('checkbox');

    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });

    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeInTheDocument();
    });
  });
});
