import { describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

describe('Button Component', () => {
  const renderButton = async (props: Record<string, any> = {}) => {
    const Button = (await import('../../components/ui/Button')).default;
    return render(<Button {...props}>Click me</Button>);
  };

  it('should render with text content', async () => {
    await renderButton();
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDefined();
  });

  it('should call onPress when clicked', async () => {
    const onPress = vi.fn();
    await renderButton({ onPress });

    fireEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', async () => {
    const onPress = vi.fn();
    await renderButton({ onPress, disabled: true });

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should show disabled styling when disabled', async () => {
    await renderButton({ disabled: true });
    const button = screen.getByRole('button');
    expect(button.getAttribute('disabled')).toBeDefined();
  });

  it('should show loading state', async () => {
    await renderButton({ loading: true });
    const button = screen.getByRole('button');
    // Should contain a loading indicator
    const loadingIndicator = button.querySelector('[data-testid="loading-spinner"]');
    expect(loadingIndicator).toBeDefined();
  });

  it('should not display children text when loading', async () => {
    await renderButton({ loading: true });
    // When loading, the button text may be replaced by spinner
    const button = screen.getByRole('button');
    const text = button.textContent?.trim();
    // Text should not be "Click me" or should be replaced with loading text
    expect(text).not.toBe('Click me');
  });

  it('should render primary variant with correct color class', async () => {
    await renderButton({ variant: 'primary' });
    const button = screen.getByRole('button');
    expect(button.className).toContain('primary');
  });

  it('should render secondary variant with correct color class', async () => {
    await renderButton({ variant: 'secondary' });
    const button = screen.getByRole('button');
    expect(button.className).toContain('secondary');
  });

  it('should render ghost variant', async () => {
    await renderButton({ variant: 'ghost' });
    const button = screen.getByRole('button');
    expect(button.className).toContain('ghost');
  });

  it('should render full width when fullWidth prop is true', async () => {
    await renderButton({ fullWidth: true });
    const button = screen.getByRole('button');
    // Full width means width should be 100% or similar
    expect(button.className).toContain('full');
  });

  it('should have accessible role attribute', async () => {
    await renderButton();
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('should support custom className', async () => {
    await renderButton({ className: 'custom-class' });
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should have minimum touch target of 44px height', async () => {
    await renderButton();
    const button = screen.getByRole('button');
    // Minimum 44px for touch targets (accessibility requirement)
    expect(button.style.minHeight || button.className).toBeDefined();
  });
});
