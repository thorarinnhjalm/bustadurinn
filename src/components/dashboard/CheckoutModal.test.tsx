/**
 * CheckoutModal tests.
 * Pure presentational component (no Firestore/service calls), so no mocks
 * are needed beyond what src/test/setup.ts already provides globally.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckoutModal from './CheckoutModal';

describe('CheckoutModal', () => {
    it('renders the fallback reminder line when no checklist is configured', () => {
        render(
            <CheckoutModal
                isOpen={true}
                onClose={vi.fn()}
                loading={false}
                onCheckout={vi.fn()}
                message=""
                onMessageChange={vi.fn()}
            />
        );

        expect(screen.getByText(/Læsa hurðum, loka gluggum og taka ruslið/)).toBeInTheDocument();
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('renders a checkbox per checklist item, all unchecked by default', () => {
        const checklist = ['Læsa öllum hurðum', 'Loka öllum gluggum', 'Taka ruslið'];
        render(
            <CheckoutModal
                isOpen={true}
                onClose={vi.fn()}
                loading={false}
                onCheckout={vi.fn()}
                message=""
                onMessageChange={vi.fn()}
                checklist={checklist}
            />
        );

        expect(screen.queryByText(/Læsa hurðum, loka gluggum og taka ruslið/)).not.toBeInTheDocument();

        checklist.forEach((item) => {
            const checkbox = screen.getByRole('checkbox', { name: item });
            expect(checkbox).not.toBeChecked();
        });
    });

    it('toggles items and passes the full checked-state map back on confirm', () => {
        const checklist = ['Læsa öllum hurðum', 'Loka öllum gluggum', 'Taka ruslið'];
        const onCheckout = vi.fn();
        render(
            <CheckoutModal
                isOpen={true}
                onClose={vi.fn()}
                loading={false}
                onCheckout={onCheckout}
                message=""
                onMessageChange={vi.fn()}
                checklist={checklist}
            />
        );

        // Check the first and third items, leave the second unchecked.
        fireEvent.click(screen.getByRole('checkbox', { name: 'Læsa öllum hurðum' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Taka ruslið' }));

        fireEvent.click(screen.getByRole('button', { name: /Skrá brottför/ }));

        expect(onCheckout).toHaveBeenCalledTimes(1);
        expect(onCheckout).toHaveBeenCalledWith({
            'Læsa öllum hurðum': true,
            'Loka öllum gluggum': false,
            'Taka ruslið': true
        });
    });

    it('allows checkout to proceed with all items unchecked (checklist is optional)', () => {
        const checklist = ['Læsa öllum hurðum'];
        const onCheckout = vi.fn();
        render(
            <CheckoutModal
                isOpen={true}
                onClose={vi.fn()}
                loading={false}
                onCheckout={onCheckout}
                message=""
                onMessageChange={vi.fn()}
                checklist={checklist}
            />
        );

        const confirmButton = screen.getByRole('button', { name: /Skrá brottför/ });
        expect(confirmButton).not.toBeDisabled();

        fireEvent.click(confirmButton);

        expect(onCheckout).toHaveBeenCalledWith({ 'Læsa öllum hurðum': false });
    });

    it('renders nothing when isOpen is false', () => {
        const { container } = render(
            <CheckoutModal
                isOpen={false}
                onClose={vi.fn()}
                loading={false}
                onCheckout={vi.fn()}
                message=""
                onMessageChange={vi.fn()}
                checklist={['Læsa öllum hurðum']}
            />
        );

        expect(container.firstChild).toBeNull();
    });
});
