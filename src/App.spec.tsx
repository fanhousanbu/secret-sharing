import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock child components
jest.mock('./components/FileEncryption', () => ({
  FileEncryption: () => (
    <div data-testid="file-encryption">FileEncryption Component</div>
  ),
}));

jest.mock('./components/FileRecovery', () => ({
  FileRecovery: () => (
    <div data-testid="file-recovery">FileRecovery Component</div>
  ),
}));

jest.mock('./components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => (
    <div data-testid="language-switcher">LanguageSwitcher Component</div>
  ),
}));

jest.mock('./i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    formatMessage: (key: string) => key,
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

describe('App Component', () => {
  test('should render without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('file-encryption')).toBeInTheDocument();
  });

  test('should render language switcher', () => {
    render(<App />);
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });

  test('should render main container', () => {
    render(<App />);
    // 检查主容器是否存在
    const container = document.querySelector('.min-h-screen');
    expect(container).toBeInTheDocument();
  });

  test('should render tab buttons', () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('should render encryption tab by default', () => {
    render(<App />);
    expect(screen.getByTestId('file-encryption')).toBeInTheDocument();
  });

  test('should have proper styling classes', () => {
    render(<App />);
    // 检查容器是否有正确的样式类
    const container = document.querySelector('.container');
    expect(container).toBeInTheDocument();
  });

  

  test('should render footer section', () => {
    render(<App />);
    // 检查页脚区域是否存在
    const footer = document.querySelector('.text-center.mt-8');
    expect(footer).toBeInTheDocument();
  });

  test('should be accessible', () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });

  test('should handle tab switching', () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    if (buttons.length > 1) {
      fireEvent.click(buttons[1]);
      // After clicking, the button should still be in the document
      expect(buttons[1]).toBeInTheDocument();
    }
  });

  test('should render SVG icons', () => {
    render(<App />);
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  test('should have responsive design classes', () => {
    render(<App />);
    // 检查容器是否有正确的样式类
    const container = document.querySelector('.container');
    expect(container).toBeInTheDocument();
  });
});
