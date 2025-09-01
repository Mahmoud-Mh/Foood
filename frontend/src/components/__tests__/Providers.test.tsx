import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Providers } from '../Providers';

// Mock all the dependencies
jest.mock('react-hot-toast', () => ({
  Toaster: ({ children, ...props }: any) => (
    <div data-testid="toaster" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../ErrorBoundary', () => ({
  ErrorBoundary: ({ children, onError }: any) => (
    <div data-testid="error-boundary" data-on-error={!!onError}>
      {children}
    </div>
  ),
}));

jest.mock('../PageErrorBoundary', () => ({
  PageErrorBoundary: ({ children }: any) => (
    <div data-testid="page-error-boundary">
      {children}
    </div>
  ),
}));

jest.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => (
    <div data-testid="auth-provider">
      {children}
    </div>
  ),
}));

describe('Providers', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should render all provider components in correct order', () => {
    render(
      <Providers>
        <div data-testid="test-children">Test Content</div>
      </Providers>
    );

    // Check that all providers are rendered
    expect(screen.getByTestId('page-error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
  });

  it('should wrap children in correct nesting order', () => {
    render(
      <Providers>
        <div data-testid="test-content">App Content</div>
      </Providers>
    );

    // Verify nesting structure: PageErrorBoundary > ErrorBoundary > AuthProvider > Children + Toaster
    const pageErrorBoundary = screen.getByTestId('page-error-boundary');
    const errorBoundary = screen.getByTestId('error-boundary');
    const authProvider = screen.getByTestId('auth-provider');
    const toaster = screen.getByTestId('toaster');
    const content = screen.getByTestId('test-content');

    expect(pageErrorBoundary).toContainElement(errorBoundary);
    expect(errorBoundary).toContainElement(authProvider);
    expect(authProvider).toContainElement(content);
    expect(errorBoundary).toContainElement(toaster);
  });

  it('should configure ErrorBoundary with onError callback', () => {
    render(
      <Providers>
        <div>Test</div>
      </Providers>
    );

    const errorBoundary = screen.getByTestId('error-boundary');
    expect(errorBoundary).toHaveAttribute('data-on-error', 'true');
  });

  it('should render Toaster with correct configuration', () => {
    render(
      <Providers>
        <div>Test</div>
      </Providers>
    );

    const toaster = screen.getByTestId('toaster');
    expect(toaster).toBeInTheDocument();
    
    // The Toaster should be configured with specific props in the real component
    // Since we're mocking it, we just verify it's rendered
    expect(toaster).toHaveAttribute('data-testid', 'toaster');
  });

  it('should handle multiple children', () => {
    render(
      <Providers>
        <div data-testid="child-1">First Child</div>
        <div data-testid="child-2">Second Child</div>
        <span data-testid="child-3">Third Child</span>
      </Providers>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    const { container } = render(
      <Providers>
        {null}
      </Providers>
    );

    // Should still render all providers even with no children
    expect(screen.getByTestId('page-error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('should handle React fragments as children', () => {
    render(
      <Providers>
        <>
          <div data-testid="fragment-child-1">Fragment Child 1</div>
          <div data-testid="fragment-child-2">Fragment Child 2</div>
        </>
      </Providers>
    );

    expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
    expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
  });

  it('should handle complex nested children', () => {
    render(
      <Providers>
        <div data-testid="parent">
          <div data-testid="nested-child">
            <span data-testid="deeply-nested">Deep Content</span>
          </div>
        </div>
      </Providers>
    );

    expect(screen.getByTestId('parent')).toBeInTheDocument();
    expect(screen.getByTestId('nested-child')).toBeInTheDocument();
    expect(screen.getByTestId('deeply-nested')).toBeInTheDocument();
  });

  it('should provide all necessary context providers for app functionality', () => {
    // This test verifies that all the essential providers are included
    const TestApp = () => (
      <div data-testid="app-content">
        <p>This represents the main app content</p>
      </div>
    );

    render(
      <Providers>
        <TestApp />
      </Providers>
    );

    // Verify error boundaries are in place for error handling
    expect(screen.getByTestId('page-error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();

    // Verify auth context is available
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();

    // Verify toast notifications are available
    expect(screen.getByTestId('toaster')).toBeInTheDocument();

    // Verify app content renders
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });

  it('should handle component unmounting gracefully', () => {
    const { unmount } = render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    );

    // Should not throw error when unmounting
    expect(() => unmount()).not.toThrow();
  });

  describe('provider integration', () => {
    it('should render error boundaries in correct structure', () => {
      // We can't test actual error boundary functionality with mocks,
      // but we can verify the structure is set up correctly
      render(
        <Providers>
          <div data-testid="normal-component">Normal Content</div>
        </Providers>
      );

      // Verify error boundary is present to potentially catch errors
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('page-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('normal-component')).toBeInTheDocument();
    });

    it('should render with minimal props', () => {
      render(
        <Providers>
          <div>Minimal test</div>
        </Providers>
      );

      expect(screen.getByText('Minimal test')).toBeInTheDocument();
    });

    it('should maintain provider stability across re-renders', () => {
      const { rerender } = render(
        <Providers>
          <div data-testid="content-v1">Version 1</div>
        </Providers>
      );

      expect(screen.getByTestId('content-v1')).toBeInTheDocument();
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();

      rerender(
        <Providers>
          <div data-testid="content-v2">Version 2</div>
        </Providers>
      );

      expect(screen.getByTestId('content-v2')).toBeInTheDocument();
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      expect(screen.queryByTestId('content-v1')).not.toBeInTheDocument();
    });
  });

  describe('real-world usage simulation', () => {
    it('should work with typical app structure', () => {
      const MockLayout = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="layout">
          <header data-testid="header">Header</header>
          <main data-testid="main">{children}</main>
          <footer data-testid="footer">Footer</footer>
        </div>
      );

      const MockPage = () => (
        <div data-testid="page-content">
          <h1>Page Title</h1>
          <p>Page content</p>
        </div>
      );

      render(
        <Providers>
          <MockLayout>
            <MockPage />
          </MockLayout>
        </Providers>
      );

      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('main')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
      expect(screen.getByText('Page Title')).toBeInTheDocument();
      expect(screen.getByText('Page content')).toBeInTheDocument();
    });
  });
});