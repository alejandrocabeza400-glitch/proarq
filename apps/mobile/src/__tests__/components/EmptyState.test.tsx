import { describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

describe('EmptyState Component', () => {
  const renderEmptyState = async (props: Record<string, any> = {}) => {
    const EmptyState = (await import('../../components/ui/EmptyState')).default;
    return render(<EmptyState {...props} />);
  };

  it('should render the title', async () => {
    await renderEmptyState({ title: 'No hay cotizaciones' });
    const title = screen.getByText('No hay cotizaciones');
    expect(title).toBeDefined();
  });

  it('should render the description text', async () => {
    await renderEmptyState({ description: 'Crea tu primera cotización para empezar' });
    const desc = screen.getByText('Crea tu primera cotización para empezar');
    expect(desc).toBeDefined();
  });

  it('should render an action button when actionLabel is provided', async () => {
    await renderEmptyState({ actionLabel: 'Crear Cotización' });
    const button = screen.getByRole('button', { name: /crear cotización/i });
    expect(button).toBeDefined();
  });

  it('should call onAction when action button is clicked', async () => {
    const onAction = vi.fn();
    await renderEmptyState({ actionLabel: 'Crear', onAction });

    fireEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should render an icon or illustration', async () => {
    await renderEmptyState({ title: 'Sin datos' });
    const icon = screen.getByTestId('empty-state-icon');
    expect(icon).toBeDefined();
  });

  it('should not render action button when actionLabel is not provided', async () => {
    await renderEmptyState({ title: 'Sin datos', description: 'No hay información' });
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('should be accessible with proper heading hierarchy', async () => {
    await renderEmptyState({ title: 'No hay proyectos', description: 'Descripción' });
    const heading = screen.getByRole('heading', { name: /no hay proyectos/i });
    expect(heading).toBeDefined();
  });
});
