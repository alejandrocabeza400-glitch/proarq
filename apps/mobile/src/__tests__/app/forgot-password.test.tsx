import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { resetMocks } from '../setup';

vi.module('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Forgot Password Screen', () => {
  beforeEach(() => {
    resetMocks();
    vi.restoreAllMocks();
  });

  const renderForgotPasswordScreen = async () => {
    const ForgotPasswordScreen = (await import('../../app/(auth)/forgot-password')).default;
    return render(<ForgotPasswordScreen />);
  };

  it('should render an email input field', async () => {
    await renderForgotPasswordScreen();
    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    expect(emailInput).toBeDefined();
  });

  it('should render a submit button labeled "Enviar código"', async () => {
    await renderForgotPasswordScreen();
    const submitButton = screen.getByRole('button', { name: /enviar código/i });
    expect(submitButton).toBeDefined();
  });

  it('should render instruction text', async () => {
    await renderForgotPasswordScreen();
    const instructionText = screen.getByText(/ingresa tu correo electrónico/i);
    expect(instructionText).toBeDefined();
  });

  it('should render a back button to return to login', async () => {
    await renderForgotPasswordScreen();
    // There should be a back button/arrow
    const backButton =
      screen.getByRole('button', { name: /regresar|back|volver/i }) ||
      screen.getByTestId('back-button');
    expect(backButton).toBeDefined();
  });

  it('should call forgotPassword API when submitting email', async () => {
    const { authService } = await import('../../services/auth/auth.service');
    const forgotSpy = vi.spyOn(authService, 'forgotPassword').mockResolvedValue({
      message: 'Si el correo existe, recibirás un código de verificación',
    });

    await renderForgotPasswordScreen();

    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    const submitButton = screen.getByRole('button', { name: /enviar código/i });

    fireEvent.change(emailInput, { target: { value: 'user@proarq.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(forgotSpy).toHaveBeenCalledWith({ email: 'user@proarq.com' });
    });
  });

  it('should show a success message after submitting', async () => {
    const { authService } = await import('../../services/auth/auth.service');
    vi.spyOn(authService, 'forgotPassword').mockResolvedValue({
      message: 'Si el correo existe, recibirás un código de verificación',
    });

    await renderForgotPasswordScreen();

    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    const submitButton = screen.getByRole('button', { name: /enviar código/i });

    fireEvent.change(emailInput, { target: { value: 'user@proarq.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const successMsg = screen.getByText(/código de verificación|correo|enviado/i);
      expect(successMsg).toBeDefined();
    });
  });

  it('should navigate to verify-code screen on success', async () => {
    const { authService } = await import('../../services/auth/auth.service');
    const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
    vi.spyOn(await import('expo-router'), 'useRouter').mockReturnValue(mockRouter as any);

    vi.spyOn(authService, 'forgotPassword').mockResolvedValue({
      message: 'Si el correo existe, recibirás un código de verificación',
    });

    await renderForgotPasswordScreen();

    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    const submitButton = screen.getByRole('button', { name: /enviar código/i });

    fireEvent.change(emailInput, { target: { value: 'user@proarq.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/verify-code');
    });
  });

  it('should show error message on API failure', async () => {
    const { authService } = await import('../../services/auth/auth.service');
    vi.spyOn(authService, 'forgotPassword').mockRejectedValue(
      new Error('Error al enviar el código'),
    );

    await renderForgotPasswordScreen();

    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    const submitButton = screen.getByRole('button', { name: /enviar código/i });

    fireEvent.change(emailInput, { target: { value: 'invalid@test.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorMsg = screen.getByText(/error/i);
      expect(errorMsg).toBeDefined();
    });
  });

  it('should validate email format before submitting', async () => {
    const { authService } = await import('../../services/auth/auth.service');
    vi.spyOn(authService, 'forgotPassword');

    await renderForgotPasswordScreen();

    const emailInput = screen.getByPlaceholderText(/correo|email/i);
    const submitButton = screen.getByRole('button', { name: /enviar código/i });

    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.click(submitButton);

    // Should show validation error without calling API
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });
});
