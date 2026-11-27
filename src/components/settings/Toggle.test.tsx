import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Toggle from './Toggle';

describe('Toggle', () => {
    it('is an accessible switch named by its label', () => {
        render(<Toggle label="Nýjar bókanir" description="Lýsing" checked={false} onChange={() => {}} />);
        const sw = screen.getByRole('switch', { name: 'Nýjar bókanir' });
        expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    it('calls onChange with the flipped value once per click (both variants)', () => {
        for (const variant of ['card', 'row'] as const) {
            const onChange = vi.fn();
            const { unmount } = render(<Toggle label="X" description="d" checked={true} onChange={onChange} variant={variant} />);
            fireEvent.click(screen.getByRole('switch'));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(false);
            unmount();
        }
    });

    it('does nothing when disabled', () => {
        const onChange = vi.fn();
        render(<Toggle label="X" description="d" checked={false} onChange={onChange} disabled />);
        fireEvent.click(screen.getByRole('switch'));
        expect(onChange).not.toHaveBeenCalled();
    });
});
