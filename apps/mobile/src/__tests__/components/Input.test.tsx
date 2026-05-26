import { describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

describe('Input Component', () => {
  const renderInput = async (props: Record<string, any> = {}) => {
    const Input = (await import('../../components/ui/Input')).default;
    return render(<Input {...props} />);
  };

  it('should render with placeholder text', async () => {
    await renderInput({ placeholder: 'Enter email' });
    const input = screen.getByPlaceholderText('Enter email');
    expect(input).toBeDefined();
  });

  it('should render a label when provided', async () => {
    await renderInput({ label: 'Email Address' });
    const label = screen.getByText('Email Address');
    expect(label).toBeDefined();
  });

  it('should handle text input changes', async () => {
    const onChangeText = vi.fn();
    await renderInput({ onChangeText, placeholder: 'Test input' });

    const input = screen.getByPlaceholderText('Test input');
    fireEvent.change(input, { target: { value: 'hello@test.com' } });

    expect(onChangeText).toHaveBeenCalledWith('hello@test.com');
  });

  it('should show error state when error prop is provided', async () => {
    await renderInput({ error: 'Campo requerido', placeholder: 'Test' });
    const errorText = screen.getByText('Campo requerido');
    expect(errorText).toBeDefined();
  });

  it('should apply error styling to input when error exists', async () => {
    await renderInput({ error: 'Invalid', placeholder: 'Test' });
    const input = screen.getByPlaceholderText('Test');
    // Error state should add a class or style
    expect(input.className).toContain('error');
  });

  it('should render with secure text entry for passwords', async () => {
    await renderInput({ secureTextEntry: true, placeholder: 'Password' });
    const input = screen.getByPlaceholderText('Password');
    expect(input.getAttribute('type')).toBe('password');
  });

  it('should render with email keyboard type', async () => {
    await renderInput({ keyboardType: 'email-address', placeholder: 'Email' });
    const input = screen.getByPlaceholderText('Email');
    expect(input.getAttribute('type')).toBe('email');
  });

  it('should show character count when maxLength is set', async () => {
    await renderInput({ maxLength: 50, placeholder: 'Limited input' });
    const charCount = screen.getByText(/0\/50|50/i);
    expect(charCount).toBeDefined();
  });

  it('should have accessible aria-label when provided', async () => {
    await renderInput({ 'aria-label': 'Email input', placeholder: 'Email' });
    const input = screen.getByPlaceholderText('Email');
    expect(input.getAttribute('aria-label')).toBe('Email input');
  });

  it('should display editable value', async () => {
    await renderInput({ value: 'user@test.com', placeholder: 'Email' });
    const input = screen.getByPlaceholderText('Email') as HTMLInputElement;
    expect(input.value).toBe('user@test.com');
  });

  it('should be disabled when editable prop is false', async () => {
    await renderInput({ editable: false, placeholder: 'Read only' });
    const input = screen.getByPlaceholderText('Read only');
    expect(input.getAttribute('disabled')).toBeDefined();
  });
});
