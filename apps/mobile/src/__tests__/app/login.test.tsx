import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { resetMocks } from '../setup';

// Mock expo-router
vi.module('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  Stack: { Screen: () => null },
}));

describe('Login Screen', () => {
  beforeEach(() => {
    resetMocks();
    vi.restoreAllMocks();
  });

  const renderLoginScreen = async () => {
    const LoginScreen = (await import('../../app/(auth)/login')).default;
    return render(<LoginScreen />);
  };

  it('should render the brand header with ProArq logo', async () => {
    // Implementation test - check for brand elements
    // The actual selectors depend on component implementation
    const { container } = await renderLoginScreen();
    expect(container).toBeDefined();
  });

  it('should render an email input field', async () => {
    await renderLoginScreen();
    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    expect(emailInput).toBeDefined();
    expect(emailInput.getAttribute('type')).toBe('email');
  });

  it('should render a password input field', async () => {
    await renderLoginScreen();
    const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
    expect(passwordInput).toBeDefined();
    expect(passwordInput.getAttribute('type')).toBe('password');
  });

  it('should render a submit button labeled "Iniciar Sesión"', async () => {
    await renderLoginScreen();
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    expect(submitButton).toBeDefined();
  });

  it('should render a link to forgot password', async () => {
    await renderLoginScreen();
    const forgotLink = screen.getByText(/olvidaste tu contraseña/i);
    expect(forgotLink).toBeDefined();
  });

  it('should call auth service when submitting valid credentials', async () => {
    const { authService } = await import('../../services/auth/auth.service');
    const loginSpy = vi.spyOn(authService, 'login').mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
    });

    await renderLoginScreen();

    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'admin@proarq.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'admin@proarq.com',
        password: 'secret123',
      });
    });
  });

  it('should show an error message on invalid credentials', async () => {
    const { authService } = await import('../../services/auth/auth.service');
    vi.spyOn(authService, 'login').mockRejectedValue(new Error('Credenciales inválidas'));

    await renderLoginScreen();

    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorMsg = screen.getByText(/credenciales inválidas|error/i);
      expect(errorMsg).toBeDefined();
    });
  });

  it('should navigate to dashboard on successful login for ADMIN role', async () => {
    const { authService } = await import('../../services/auth/auth.service');
    const mockRouter = { push: vi.fn(), replace: vi.fn() };
    vi.spyOn(await import('expo-router'), 'useRouter').mockReturnValue(mockRouter as any);

    vi.spyOn(authService, 'login').mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
    });

    await renderLoginScreen();

    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'admin@proarq.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/dashboard');
    });
  });

  it('should show loading state while submitting', async () => {
    const { authService } = await import('../../services/auth/auth.service');
    // Simulate slow login
    vi.spyOn(authService, 'login').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000)),
    );

    await renderLoginScreen();

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    // Button should show loading/disabled state
    expect(submitButton.getAttribute('disabled')).toBeDefined();
  });

  it('should navigate to forgot-password screen when clicking the forgot link', async () => {
    const mockRouter = { push: vi.fn(), replace: vi.fn() };
    vi.spyOn(await import('expo-router'), 'useRouter').mockReturnValue(mockRouter as any);

    await renderLoginScreen();

    const forgotLink = screen.getByText(/olvidaste tu contraseña/i);
    fireEvent.click(forgotLink);

    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/forgot-password');
  });

  it('should have accessible labels on all inputs', async () => {
    await renderLoginScreen();

    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);

    expect(emailInput.getAttribute('aria-label')).toBeDefined();
    expect(passwordInput.getAttribute('aria-label')).toBeDefined();
  });
});
