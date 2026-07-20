/**
 * HolidayFairnessPanel tests.
 * Mocks '@/services/fairnessService' (getHolidayPriority) and
 * '@/utils/icelandicHolidays' (getUpcomingContestedWindows) so the panel's
 * own rendering logic — priority name, opens-to-all state, history line,
 * claim callback — is exercised without touching real Firestore reads.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getDoc } from 'firebase/firestore';
import HolidayFairnessPanel from './HolidayFairnessPanel';
import { getHolidayPriority } from '@/services/fairnessService';
import { getUpcomingContestedWindows } from '@/utils/icelandicHolidays';
import type { ContestedHolidayWindow } from '@/utils/icelandicHolidays';

vi.mock('@/lib/firebase', () => ({
    db: {},
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    getDoc: vi.fn(),
}));

vi.mock('@/services/fairnessService', () => ({
    getHolidayPriority: vi.fn(),
}));

vi.mock('@/utils/icelandicHolidays', () => ({
    getUpcomingContestedWindows: vi.fn(),
}));

const mockedGetDoc = vi.mocked(getDoc);
const mockedGetHolidayPriority = vi.mocked(getHolidayPriority);
const mockedGetUpcoming = vi.mocked(getUpcomingContestedWindows);

const paskarWindow: ContestedHolidayWindow = {
    key: 'paskar',
    name: 'Páskar',
    start: new Date(2026, 3, 2),
    end: new Date(2026, 3, 7), // exclusive
};

describe('HolidayFairnessPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedGetUpcoming.mockReturnValue([paskarWindow]);
        mockedGetDoc.mockResolvedValue({
            data: () => ({ name: 'Anna' }),
        } as unknown as Awaited<ReturnType<typeof getDoc>>);
    });

    it('renders the window, priority name and history, and fires onClaimWindow', async () => {
        mockedGetHolidayPriority.mockResolvedValue({
            ranking: ['u1', 'u2'],
            topUserId: 'u1',
            opensToAllAt: new Date(2100, 0, 1), // far future - still gated
            history: [
                { year: 2024, heldByUserId: null, heldByUserName: null },
                { year: 2025, heldByUserId: 'u2', heldByUserName: 'Jón' },
            ],
        });

        const onClaimWindow = vi.fn();
        render(
            <HolidayFairnessPanel houseId="house-1" ownerIds={['u1', 'u2']} onClaimWindow={onClaimWindow} />
        );

        expect(await screen.findByText('Páskar')).toBeInTheDocument();
        expect(await screen.findByText(/Forgangur: Anna/)).toBeInTheDocument();
        expect(screen.getByText(/2025: Jón/)).toBeInTheDocument();
        expect(screen.getByText(/2024: —/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Bóka þessa helgi' }));
        expect(onClaimWindow).toHaveBeenCalledWith(paskarWindow);
    });

    it('shows "Opið öllum" once the window has opened to everyone', async () => {
        mockedGetHolidayPriority.mockResolvedValue({
            ranking: ['u1', 'u2'],
            topUserId: 'u1',
            opensToAllAt: new Date(2000, 0, 1), // already past
            history: [],
        });

        render(
            <HolidayFairnessPanel houseId="house-1" ownerIds={['u1', 'u2']} onClaimWindow={vi.fn()} />
        );

        expect(await screen.findByText('Opið öllum')).toBeInTheDocument();
        expect(screen.queryByText(/Forgangur:/)).not.toBeInTheDocument();
    });

    it('renders nothing once loaded when there are no upcoming windows', async () => {
        mockedGetUpcoming.mockReturnValue([]);

        const { container } = render(
            <HolidayFairnessPanel houseId="house-1" ownerIds={['u1', 'u2']} onClaimWindow={vi.fn()} />
        );

        await waitFor(() => expect(container.firstChild).toBeNull());
    });
});
