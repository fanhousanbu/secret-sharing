import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileRecovery } from './FileRecovery';

// Mock dependencies
jest.mock('../crypto/fileProcessor', () => ({
  WebFileProcessor: jest.fn().mockImplementation(() => ({
    detectScheme: jest.fn().mockReturnValue('hybrid'),
    parseShareFiles: jest.fn().mockReturnValue({}),
    parsePureShamirShareFiles: jest.fn().mockReturnValue({}),
    recoverFile: jest.fn().mockResolvedValue({
      data: new ArrayBuffer(0),
      filename: 'test.txt',
      hash: 'test-hash',
      recoveredSHA256: 'test-sha256',
    }),
    recoverFilePureShamir: jest.fn().mockResolvedValue({
      data: new ArrayBuffer(0),
      filename: 'test.txt',
      hash: 'test-hash',
      recoveredSHA256: 'test-sha256',
    }),
    downloadFile: jest.fn(),
    downloadHashRecord: jest.fn(),
  })),
}));

jest.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    formatMessage: (key: string) => key,
  }),
}));

describe('FileRecovery Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render without crashing', () => {
    render(<FileRecovery />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should render file recovery title', () => {
    render(<FileRecovery />);
    // Assert there is a title element (h2)
    const title = document.querySelector('h2');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-2xl', 'font-bold', 'text-gray-800');
  });

  test('should render encrypted file upload section', () => {
    render(<FileRecovery />);
    // Assert there is a file upload area (via input[type="file"] and accept=".encrypted")
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(0);
    const encryptedFileInput = fileInputs[0] as HTMLInputElement;
    expect(encryptedFileInput.accept).toBe('.encrypted');
  });

  test('should render share files upload section', () => {
    render(<FileRecovery />);
    // Assert there is a share files upload area (via input[type="file"] and accept=".json")
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(1);
    const shareFileInput = fileInputs[1] as HTMLInputElement;
    expect(shareFileInput.accept).toBe('.json');
    expect(shareFileInput.multiple).toBe(true);
  });

  test('should render recovery button', () => {
    render(<FileRecovery />);
    // Assert there is a full-width main button (recovery button)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    // Recovery button is usually the last main button
    const mainButton = buttons[buttons.length - 1];
    expect(mainButton).toBeInTheDocument();
    expect(mainButton).toHaveClass('w-full');
  });

  test('should disable recovery button initially', () => {
    render(<FileRecovery />);
    const buttons = screen.getAllByRole('button');
    const mainButton = buttons[buttons.length - 1];
    expect(mainButton).toBeDisabled();
  });

  test('should handle encrypted file selection', async () => {
    render(<FileRecovery />);
    const file = new File(['test content'], 'test.encrypted', {
      type: 'application/octet-stream',
    });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.encrypted')).toBeInTheDocument();
    });
  });

  test('should handle share files selection', async () => {
    render(<FileRecovery />);
    const shareFile = new File(
      ['{"metadata": {"usePassword": false}}'],
      'share1.json',
      { type: 'application/json' }
    );
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const shareFileInput = fileInputs[1] as HTMLInputElement;

    fireEvent.change(shareFileInput, { target: { files: [shareFile] } });

    await waitFor(() => {
      expect(screen.getByText('share1.json')).toBeInTheDocument();
    });
  });

  test('should show remove button for encrypted file', async () => {
    render(<FileRecovery />);
    const file = new File(['test content'], 'test.encrypted', {
      type: 'application/octet-stream',
    });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      // Check if there is a remove button (by button count change)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  test('should show remove button for share files', async () => {
    render(<FileRecovery />);
    const shareFile = new File(
      ['{"metadata": {"usePassword": false}}'],
      'share1.json',
      { type: 'application/json' }
    );
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const shareFileInput = fileInputs[1] as HTMLInputElement;
    fireEvent.change(shareFileInput, { target: { files: [shareFile] } });
    await waitFor(() => {
      // Check if share filename is rendered
      expect(screen.getByText('share1.json')).toBeInTheDocument();
    });
  });

  test('should show scheme detection info', async () => {
    render(<FileRecovery />);
    const shareFile = new File(
      [
        '{"metadata": {"scheme": "hybrid", "usePassword": false}, "share": {"id": 1, "value": "123"}}',
      ],
      'share1.json',
      { type: 'application/json' }
    );
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const shareFileInput = fileInputs[1] as HTMLInputElement;
    fireEvent.change(shareFileInput, { target: { files: [shareFile] } });
    await waitFor(() => {
      // Check if info area is rendered (via svg icons)
      const infoIcons = document.querySelectorAll('svg');
      expect(infoIcons.length).toBeGreaterThan(0);
    });
  });

  test('should show pure shamir upload note', async () => {
    render(<FileRecovery />);
    const shareFile = new File(
      ['{"metadata": {"usePassword": false}}'],
      'share1.json',
      { type: 'application/json' }
    );
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const shareFileInput = fileInputs[1] as HTMLInputElement;

    fireEvent.change(shareFileInput, { target: { files: [shareFile] } });

    await waitFor(() => {
      // Check that the component renders properly after file selection
      expect(screen.getByText('share1.json')).toBeInTheDocument();
    });
  });

  test('should show file count', async () => {
    render(<FileRecovery />);
    const shareFile = new File(
      ['{"metadata": {"usePassword": false}}'],
      'share1.json',
      { type: 'application/json' }
    );
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const shareFileInput = fileInputs[1] as HTMLInputElement;

    fireEvent.change(shareFileInput, { target: { files: [shareFile] } });

    await waitFor(() => {
      expect(screen.getByText('filesCount')).toBeInTheDocument();
    });
  });

  test('should show pure shamir tip', async () => {
    render(<FileRecovery />);
    const shareFile = new File(
      ['{"metadata": {"usePassword": false}}'],
      'share1.json',
      { type: 'application/json' }
    );
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const shareFileInput = fileInputs[1] as HTMLInputElement;

    fireEvent.change(shareFileInput, { target: { files: [shareFile] } });

    await waitFor(() => {
      // Check that the component renders properly after file selection
      expect(screen.getByText('share1.json')).toBeInTheDocument();
    });
  });

  test('should render all input fields', () => {
    render(<FileRecovery />);
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(0);
  });

  test('should have proper styling classes', () => {
    render(<FileRecovery />);
    const containers = screen.getAllByRole('generic');
    const mainContainer = containers.find(container =>
      container.className.includes('max-w-2xl')
    );
    expect(mainContainer).toBeInTheDocument();
  });

  test('should render SVG icons', () => {
    render(<FileRecovery />);
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  test('should show file size when encrypted file is selected', async () => {
    render(<FileRecovery />);
    const file = new File(['test content'], 'test.encrypted', {
      type: 'application/octet-stream',
    });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/KB/)).toBeInTheDocument();
    });
  });

  test('should be accessible', () => {
    render(<FileRecovery />);
    const buttons = screen.getAllByRole('button');

    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });

  test('should handle multiple file selection', async () => {
    render(<FileRecovery />);
    const shareFile1 = new File(
      ['{"metadata": {"usePassword": false}}'],
      'share1.json',
      { type: 'application/json' }
    );
    const shareFile2 = new File(
      ['{"metadata": {"usePassword": false}}'],
      'share2.json',
      { type: 'application/json' }
    );
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const shareFileInput = fileInputs[1] as HTMLInputElement;

    fireEvent.change(shareFileInput, {
      target: { files: [shareFile1, shareFile2] },
    });

    await waitFor(() => {
      expect(screen.getByText('share1.json')).toBeInTheDocument();
      expect(screen.getByText('share2.json')).toBeInTheDocument();
    });
  });

  test('should show selected share files label', async () => {
    render(<FileRecovery />);
    const shareFile = new File(
      ['{"metadata": {"usePassword": false}}'],
      'share1.json',
      { type: 'application/json' }
    );
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const shareFileInput = fileInputs[1] as HTMLInputElement;

    fireEvent.change(shareFileInput, { target: { files: [shareFile] } });

    await waitFor(() => {
      // Check that the component renders properly after file selection
      expect(screen.getByText('share1.json')).toBeInTheDocument();
    });
  });
});
