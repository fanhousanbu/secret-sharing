import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { I18nProvider, useI18n } from './index';
import { en } from './en';
import { zh } from './zh';

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

// A test component to consume the useI18n hook
const TestComponent = () => {
  const { t, language, setLanguage, formatMessage } = useI18n();
  return (
    <div>
      <span data-testid="app-title">{t.appTitle}</span>
      <span data-testid="language">{language}</span>
      <button onClick={() => setLanguage('zh')}>Switch to Chinese</button>
      <span data-testid="formatted-message">{formatMessage('welcomeMessage', { name: 'World' })}</span>
    </div>
  );
};

describe('I18nProvider and useI18n', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('should provide default language (en) if no language is saved in localStorage', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('app-title')).toHaveTextContent(en.appTitle);
  });

  test('should load language from localStorage if available', () => {
    localStorageMock.setItem('language', 'zh');
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('zh');
    expect(screen.getByTestId('app-title')).toHaveTextContent(zh.appTitle);
  });

  test('should change language and update localStorage when setLanguage is called', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('language');

    await act(async () => {
      userEvent.click(screen.getByText('Switch to Chinese'));
    });

    await screen.findByText(zh.appTitle); // Wait for the app title to update
    expect(screen.getByTestId('language')).toHaveTextContent('zh');
    expect(screen.getByTestId('app-title')).toHaveTextContent(zh.appTitle);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'zh');
  });

  test('should format messages with parameters', () => {
    // Temporarily add welcomeMessage to en and zh for this test
    const originalEnWelcomeMessage = en.welcomeMessage;
    const originalZhWelcomeMessage = zh.welcomeMessage;
    en.welcomeMessage = 'Hello {name}';
    zh.welcomeMessage = '你好 {name}';

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('formatted-message')).toHaveTextContent('Hello World');

    // Restore original messages after the test
    en.welcomeMessage = originalEnWelcomeMessage;
    zh.welcomeMessage = originalZhWelcomeMessage;
  });

  test('should throw error if useI18n is not used within I18nProvider', () => {
    const TestComponentWithoutProvider = () => {
      useI18n();
      return null;
    };

    // Suppress console.error for this test to avoid noise
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponentWithoutProvider />)).toThrow(
      'useI18n must be used within an I18nProvider'
    );

    consoleErrorSpy.mockRestore();
  });
});
