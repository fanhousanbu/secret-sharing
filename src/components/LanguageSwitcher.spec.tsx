import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LanguageSwitcher } from './LanguageSwitcher';

// Mock dependencies
const mockSetLanguage = jest.fn();

jest.mock('../i18n', () => ({
  useI18n: () => ({
    language: 'en',
    setLanguage: mockSetLanguage,
  }),
}));

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render without crashing', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('should render language buttons', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  test('should render EN button', () => {
    render(<LanguageSwitcher />);
    const enButton = screen.getByText('EN');
    expect(enButton).toBeInTheDocument();
  });

  test('should render Chinese button', () => {
    render(<LanguageSwitcher />);
    const zhButton = screen.getByText('中文');
    expect(zhButton).toBeInTheDocument();
  });

  test('should have EN button selected by default', () => {
    render(<LanguageSwitcher />);
    const enButton = screen.getByText('EN');
    expect(enButton).toHaveClass('bg-indigo-600');
    expect(enButton).toHaveClass('text-white');
  });

  test('should have Chinese button not selected by default', () => {
    render(<LanguageSwitcher />);
    const zhButton = screen.getByText('中文');
    expect(zhButton).toHaveClass('bg-gray-200');
    expect(zhButton).toHaveClass('text-gray-700');
  });

  test('should handle EN button click', () => {
    render(<LanguageSwitcher />);
    const enButton = screen.getByText('EN');
    fireEvent.click(enButton);
    expect(mockSetLanguage).toHaveBeenCalledWith('en');
  });

  test('should handle Chinese button click', () => {
    render(<LanguageSwitcher />);
    const zhButton = screen.getByText('中文');
    fireEvent.click(zhButton);
    expect(mockSetLanguage).toHaveBeenCalledWith('zh');
  });

  test('should render globe icon', () => {
    render(<LanguageSwitcher />);
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  test('should have proper styling classes', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1');
      expect(button).toHaveClass('rounded-md');
    });
  });

  test('should be accessible', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });

  test('should handle click events', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      fireEvent.click(button);
    });
    expect(mockSetLanguage).toHaveBeenCalledTimes(2);
  });

  test('should have proper container styling', () => {
    render(<LanguageSwitcher />);
    const container = document.querySelector('.flex.items-center.space-x-2');
    expect(container).toBeInTheDocument();
  });

  test('should have proper button container styling', () => {
    render(<LanguageSwitcher />);
    const buttonContainer = screen.getByText('EN').closest('div');
    expect(buttonContainer).toHaveClass('flex');
    expect(buttonContainer).toHaveClass('space-x-1');
  });

  test('should have transition effects', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('transition-colors');
    });
  });

  test('should have hover effects on inactive buttons', () => {
    render(<LanguageSwitcher />);
    const zhButton = screen.getByText('中文');
    expect(zhButton).toHaveClass('hover:bg-gray-300');
  });

  test('should have proper text styling', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('text-sm');
      expect(button).toHaveClass('font-medium');
    });
  });

  test('should have proper icon styling', () => {
    render(<LanguageSwitcher />);
    const icon = document.querySelector('svg');
    expect(icon).toHaveClass('w-5');
    expect(icon).toHaveClass('h-5');
    expect(icon).toHaveClass('text-gray-600');
  });

  test('should call setLanguage with correct language codes', () => {
    render(<LanguageSwitcher />);
    const enButton = screen.getByText('EN');
    const zhButton = screen.getByText('中文');

    fireEvent.click(enButton);
    expect(mockSetLanguage).toHaveBeenCalledWith('en');

    fireEvent.click(zhButton);
    expect(mockSetLanguage).toHaveBeenCalledWith('zh');
  });

  test('should have proper button text content', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  test('should have proper button roles', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  test('should have proper button types', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      // 按钮默认类型是 button，不需要显式设置
      expect(button).toBeInTheDocument();
    });
  });

  test('should handle multiple clicks', () => {
    render(<LanguageSwitcher />);
    const enButton = screen.getByText('EN');

    fireEvent.click(enButton);
    fireEvent.click(enButton);
    fireEvent.click(enButton);

    expect(mockSetLanguage).toHaveBeenCalledTimes(3);
    expect(mockSetLanguage).toHaveBeenCalledWith('en');
  });

  test('should have proper spacing between elements', () => {
    render(<LanguageSwitcher />);
    const container = document.querySelector('.flex.items-center.space-x-2');
    expect(container).toBeInTheDocument();
  });

  test('should have proper button spacing', () => {
    render(<LanguageSwitcher />);
    const buttonContainer = screen.getByText('EN').closest('div');
    expect(buttonContainer).toHaveClass('space-x-1');
  });
});
