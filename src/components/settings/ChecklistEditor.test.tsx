/**
 * ChecklistEditor tests. Pure presentational component (no Firestore/service
 * calls), so no mocks are needed beyond what src/test/setup.ts already
 * provides globally.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListChecks } from 'lucide-react';
import ChecklistEditor from './ChecklistEditor';

const baseProps = {
    icon: ListChecks,
    title: 'Prófgátlisti',
    description: 'Lýsing.',
    defaults: ['Sjálfgefið atriði 1', 'Sjálfgefið atriði 2'],
    isManager: true
};

describe('ChecklistEditor', () => {
    it('shows the empty state with a one-click defaults button when there are no items', () => {
        const onChange = vi.fn();
        render(<ChecklistEditor {...baseProps} items={[]} onChange={onChange} />);

        expect(screen.getByText('Enginn listi hefur verið settur upp.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Setja inn sjálfgefinn lista' }));

        expect(onChange).toHaveBeenCalledWith(['Sjálfgefið atriði 1', 'Sjálfgefið atriði 2']);
    });

    it('adds a new item via the input and button', () => {
        const onChange = vi.fn();
        render(<ChecklistEditor {...baseProps} items={['Fyrsta atriði']} onChange={onChange} />);

        const input = screen.getByPlaceholderText('T.d. Nýtt atriði');
        fireEvent.change(input, { target: { value: 'Nýtt atriði' } });
        fireEvent.click(screen.getByRole('button', { name: /Bæta við/ }));

        expect(onChange).toHaveBeenCalledWith(['Fyrsta atriði', 'Nýtt atriði']);
    });

    it('adds a new item on Enter key press', () => {
        const onChange = vi.fn();
        render(<ChecklistEditor {...baseProps} items={[]} onChange={onChange} />);

        const input = screen.getByPlaceholderText('T.d. Nýtt atriði');
        fireEvent.change(input, { target: { value: 'Enter atriði' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onChange).toHaveBeenCalledWith(['Enter atriði']);
    });

    it('does not add a blank item', () => {
        const onChange = vi.fn();
        render(<ChecklistEditor {...baseProps} items={[]} onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: /Bæta við/ }));

        expect(onChange).not.toHaveBeenCalled();
    });

    it('removes an item when its delete button is clicked', () => {
        const onChange = vi.fn();
        render(
            <ChecklistEditor
                {...baseProps}
                items={['Atriði A', 'Atriði B']}
                onChange={onChange}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Eyða Atriði A' }));

        expect(onChange).toHaveBeenCalledWith(['Atriði B']);
    });

    it('hides add/remove controls when isManager is false', () => {
        render(
            <ChecklistEditor
                {...baseProps}
                items={['Atriði A']}
                onChange={vi.fn()}
                isManager={false}
            />
        );

        expect(screen.queryByPlaceholderText('T.d. Nýtt atriði')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Eyða Atriði A' })).not.toBeInTheDocument();
    });
});
