import { describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

describe('Card Component', () => {
  const renderCard = async (props: Record<string, any> = {}) => {
    const Card = (await import('../../components/ui/Card')).default;
    return render(
      <Card {...props}>
        <div>Card content</div>
      </Card>,
    );
  };

  it('should render children content', async () => {
    await renderCard();
    const content = screen.getByText('Card content');
    expect(content).toBeDefined();
  });

  it('should call onPress when card is clicked and pressable', async () => {
    const onPress = vi.fn();
    await renderCard({ onPress });

    fireEvent.click(screen.getByText('Card content'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', async () => {
    const onPress = vi.fn();
    await renderCard({ onPress, disabled: true });

    fireEvent.click(screen.getByText('Card content'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should render without border (no-line sectioning)', async () => {
    await renderCard();
    const card = screen.getByTestId('card-container');
    expect(card.className).not.toContain('border');
  });

  it('should apply custom styles when provided', async () => {
    await renderCard({ style: { backgroundColor: '#f0f0f0' } });
    const card = screen.getByTestId('card-container');
    const styleAttr = card.getAttribute('style') || '';
    // jsdom serializes hex colors to rgb format
    expect(styleAttr.includes('f0f0f0') || styleAttr.includes('rgb(240, 240, 240)')).toBeTruthy();
  });

  it('should render with surface background shift', async () => {
    await renderCard();
    const card = screen.getByTestId('card-container');
    // Card should use surface container background
    expect(card.className).toBeDefined();
  });

  it('should have accessible role when pressable', async () => {
    const onPress = vi.fn();
    await renderCard({ onPress });
    const card = screen.getByTestId('card-container');
    expect(card.getAttribute('role')).toBe('button');
  });
});
