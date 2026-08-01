import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GasCylinderCard from './GasCylinderCard';
import type { GasCylinder } from '@/types/models';

const configured: GasCylinder = { size: '10l', connection: 'smellugas' };

describe('GasCylinderCard', () => {
    it('renders nothing until the cylinder is configured', () => {
        const { container: none } = render(
            <GasCylinderCard onRecordChange={vi.fn()} />
        );
        expect(none.firstChild).toBeNull();

        // Half-configured is still not useful in the shop.
        const { container: partial } = render(
            <GasCylinderCard gasCylinder={{ size: '5l' } as GasCylinder} onRecordChange={vi.fn()} />
        );
        expect(partial.firstChild).toBeNull();
    });

    it('shows the size and connection in Icelandic', () => {
        render(<GasCylinderCard gasCylinder={configured} onRecordChange={vi.fn()} />);
        expect(screen.getByText('10 lítra · Smellugas')).toBeInTheDocument();
    });

    it('says so when no replacement has been recorded', () => {
        render(<GasCylinderCard gasCylinder={configured} onRecordChange={vi.fn()} />);
        expect(screen.getByText(/Ekki skráð hvenær síðast var skipt/)).toBeInTheDocument();
    });

    it('shows how long ago it was changed, and by whom', () => {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        render(
            <GasCylinderCard
                gasCylinder={{
                    ...configured,
                    last_changed_at: twoMonthsAgo,
                    last_changed_by_name: 'Anna',
                }}
                onRecordChange={vi.fn()}
            />
        );

        expect(screen.getByText(/Skipt fyrir/)).toBeInTheDocument();
        expect(screen.getByText(/Anna/)).toBeInTheDocument();
    });

    it('accepts a Firestore Timestamp, not just a Date', () => {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        // The dashboard listener spreads snap.data() without converting nested
        // Timestamps, so this is the shape the card actually receives in the
        // app — treating it as a Date made every save look like a no-op.
        const timestampLike = { toDate: () => twoMonthsAgo } as unknown as Date;

        render(
            <GasCylinderCard
                gasCylinder={{ ...configured, last_changed_at: timestampLike }}
                onRecordChange={vi.fn()}
            />
        );

        expect(screen.getByText(/Skipt fyrir/)).toBeInTheDocument();
        expect(screen.queryByText(/Ekki skráð hvenær síðast var skipt/)).not.toBeInTheDocument();
    });

    it('survives a malformed stored date instead of rendering "Invalid Date"', () => {
        render(
            <GasCylinderCard
                gasCylinder={{ ...configured, last_changed_at: new Date('nonsense') }}
                onRecordChange={vi.fn()}
            />
        );
        expect(screen.getByText(/Ekki skráð hvenær síðast var skipt/)).toBeInTheDocument();
    });

    it('tells the user when recording the change fails', async () => {
        const onRecordChange = vi.fn().mockRejectedValue(new Error('permission-denied'));
        render(<GasCylinderCard gasCylinder={configured} onRecordChange={onRecordChange} />);

        fireEvent.click(screen.getByRole('button', { name: /Skipti um kút/ }));

        // A silent failure is indistinguishable from success — that is exactly
        // how the Firestore rules rejection went unnoticed.
        await waitFor(() =>
            expect(screen.getByText(/Ekki tókst að skrá skiptin/)).toBeInTheDocument()
        );
        expect(screen.getByRole('button', { name: /Skipti um kút/ })).not.toBeDisabled();
    });

    it('reports a replacement and re-enables the button afterwards', async () => {
        const onRecordChange = vi.fn().mockResolvedValue(undefined);
        render(<GasCylinderCard gasCylinder={configured} onRecordChange={onRecordChange} />);

        const button = screen.getByRole('button', { name: /Skipti um kút/ });
        fireEvent.click(button);

        expect(onRecordChange).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(button).not.toBeDisabled());
    });
});
