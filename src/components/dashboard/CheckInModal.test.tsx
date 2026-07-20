/**
 * CheckInModal tests. Mirrors CheckoutModal.test.tsx — pure presentational
 * component (no Firestore/service calls), so no mocks are needed beyond what
 * src/test/setup.ts already provides globally.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckInModal from './CheckInModal';

describe('CheckInModal', () => {
    it('renders a checkbox per checklist item, all unchecked by default', () => {
        const checklist = ['Kveikja á vatni', 'Kveikja á rafmagni', 'Kynda upp'];
        render(
            <CheckInModal
                isOpen={true}
                onClose={vi.fn()}
                loading={false}
                onCheckIn={vi.fn()}
                checklist={checklist}
            />
        );

        checklist.forEach((item) => {
            const checkbox = screen.getByRole('checkbox', { name: item });
            expect(checkbox).not.toBeChecked();
        });
    });

    it('toggles items and passes the full checked-state map back on confirm', () => {
        const checklist = ['Kveikja á vatni', 'Kveikja á rafmagni', 'Kynda upp'];
        const onCheckIn = vi.fn();
        render(
            <CheckInModal
                isOpen={true}
                onClose={vi.fn()}
                loading={false}
                onCheckIn={onCheckIn}
                checklist={checklist}
            />
        );

        fireEvent.click(screen.getByRole('checkbox', { name: 'Kveikja á vatni' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Kynda upp' }));

        fireEvent.click(screen.getByRole('button', { name: /Skrá komu/ }));

        expect(onCheckIn).toHaveBeenCalledTimes(1);
        expect(onCheckIn).toHaveBeenCalledWith({
            'Kveikja á vatni': true,
            'Kveikja á rafmagni': false,
            'Kynda upp': true
        });
    });

    it('allows check-in to proceed with all items unchecked (checklist is optional)', () => {
        const checklist = ['Kveikja á vatni'];
        const onCheckIn = vi.fn();
        render(
            <CheckInModal
                isOpen={true}
                onClose={vi.fn()}
                loading={false}
                onCheckIn={onCheckIn}
                checklist={checklist}
            />
        );

        const confirmButton = screen.getByRole('button', { name: /Skrá komu/ });
        expect(confirmButton).not.toBeDisabled();

        fireEvent.click(confirmButton);

        expect(onCheckIn).toHaveBeenCalledWith({ 'Kveikja á vatni': false });
    });

    it('calls onClose when the cancel button is clicked', () => {
        const onClose = vi.fn();
        render(
            <CheckInModal
                isOpen={true}
                onClose={onClose}
                loading={false}
                onCheckIn={vi.fn()}
                checklist={['Kveikja á vatni']}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Hætta við' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders nothing when isOpen is false', () => {
        const { container } = render(
            <CheckInModal
                isOpen={false}
                onClose={vi.fn()}
                loading={false}
                onCheckIn={vi.fn()}
                checklist={['Kveikja á vatni']}
            />
        );

        expect(container.firstChild).toBeNull();
    });
});
