import { describe, expect, it } from 'bun:test';
import { render, screen } from '@testing-library/react';

describe('Loading Component', () => {
  const renderLoading = async (props: Record<string, any> = {}) => {
    const LoadingState = (await import('../../components/ui/LoadingState')).default;
    return render(<LoadingState {...props} />);
  };

  it('should render a loading indicator', async () => {
    await renderLoading();
    const indicator = screen.getByTestId('loading-indicator');
    expect(indicator).toBeDefined();
  });

  it('should render with a message when provided', async () => {
    await renderLoading({ message: 'Cargando insumos...' });
    const text = screen.getByText('Cargando insumos...');
    expect(text).toBeDefined();
  });

  it('should render skeleton placeholders by default', async () => {
    await renderLoading();
    const skeleton = screen.getByTestId('skeleton-placeholder');
    expect(skeleton).toBeDefined();
  });

  it('should render as a spinner when variant is spinner', async () => {
    await renderLoading({ variant: 'spinner' });
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toBeDefined();
  });

  it('should render full page loading when fullPage prop is true', async () => {
    await renderLoading({ fullPage: true });
    const container = screen.getByTestId('loading-container');
    expect(container.className).toContain('fullpage');
  });

  it('should have accessible role', async () => {
    await renderLoading();
    const indicator = screen.getByTestId('loading-indicator');
    expect(indicator.getAttribute('role')).toBe('status');
    expect(indicator.getAttribute('aria-label')).toContain('loading');
  });
});
