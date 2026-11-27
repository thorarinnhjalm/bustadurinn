import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal';

describe('Modal', () => {
    it('renders title and children when open', () => {
        render(
            <Modal open onClose={() => {}} title="Titill">
                <p>Innihald</p>
            </Modal>
        );
        expect(screen.getByRole('heading', { name: 'Titill' })).toBeInTheDocument();
        expect(screen.getByText('Innihald')).toBeInTheDocument();
    });

    it('renders nothing when closed', () => {
        const { container } = render(
            <Modal open={false} onClose={() => {}} title="Titill">
                <p>Innihald</p>
            </Modal>
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('calls onClose on cancel (Escape) when dismissible', () => {
        const onClose = vi.fn();
        const { container } = render(
            <Modal open onClose={onClose} title="Titill">x</Modal>
        );
        fireEvent(container.querySelector('dialog')!, new Event('cancel', { cancelable: true }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on cancel when dismissible is false', () => {
        const onClose = vi.fn();
        const { container } = render(
            <Modal open onClose={onClose} title="Titill" dismissible={false}>x</Modal>
        );
        const ev = new Event('cancel', { cancelable: true });
        fireEvent(container.querySelector('dialog')!, ev);
        expect(onClose).not.toHaveBeenCalled();
        expect(ev.defaultPrevented).toBe(true);
        expect(screen.queryByRole('button', { name: 'Loka' })).toBeNull();
    });

    it('close button has label Loka and calls onClose', () => {
        const onClose = vi.fn();
        render(<Modal open onClose={onClose} title="Titill">x</Modal>);
        fireEvent.click(screen.getByRole('button', { name: 'Loka' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('wires aria-labelledby to the heading and renders footer', () => {
        const { container } = render(
            <Modal open onClose={() => {}} title="Titill" footer={<button>Vista</button>}>x</Modal>
        );
        const dialog = container.querySelector('dialog')!;
        const heading = screen.getByRole('heading', { name: 'Titill' });
        expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
        expect(screen.getByRole('button', { name: 'Vista' })).toBeInTheDocument();
    });
});
