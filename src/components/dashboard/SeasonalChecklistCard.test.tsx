/**
 * SeasonalChecklistCard tests. Pure presentational component driven by the
 * current date, `House.seasonal_checklists`, and a `seasonalLogged` flag
 * derived by the caller (DashboardPage) from its internal_logs listener — so
 * no Firestore/service mocks are needed beyond src/test/setup.ts.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SeasonalChecklistCard from './SeasonalChecklistCard';
import type { House } from '@/types/models';

const baseHouse = {
    id: 'house-1',
    name: 'Sumarbústaður',
    address: '',
    location: { lat: 0, lng: 0 },
    manager_id: 'u1',
    owner_ids: ['u1'],
    holiday_mode: 'first_come',
    seasonal_checklists: {
        spring: ['Skrúfa frá vatni', 'Setja upp útihúsgögn'],
        autumn: ['Tæma vatnslagnir', 'Taka inn útihúsgögn']
    }
} as unknown as House;

afterEach(() => {
    vi.useRealTimers();
});

describe('SeasonalChecklistCard', () => {
    it('renders nothing outside the spring/autumn month windows', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 6, 20)); // July

        const { container } = render(
            <SeasonalChecklistCard house={baseHouse} seasonalLogged={{ spring: false, autumn: false }} onConfirm={vi.fn()} />
        );

        expect(container.firstChild).toBeNull();
    });

    it('renders the spring card in April when not yet logged this year', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 3, 15)); // April

        render(
            <SeasonalChecklistCard house={baseHouse} seasonalLogged={{ spring: false, autumn: false }} onConfirm={vi.fn()} />
        );

        expect(screen.getByText('Vor-opnun framundan')).toBeInTheDocument();
    });

    it('renders nothing in the spring window when already logged this year', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 3, 15)); // April

        const { container } = render(
            <SeasonalChecklistCard house={baseHouse} seasonalLogged={{ spring: true, autumn: false }} onConfirm={vi.fn()} />
        );

        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when the house has no checklist configured for the active season', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 3, 15)); // April

        const houseWithoutSpring = { ...baseHouse, seasonal_checklists: { autumn: ['Tæma vatnslagnir'] } } as House;
        const { container } = render(
            <SeasonalChecklistCard house={houseWithoutSpring} seasonalLogged={{ spring: false, autumn: false }} onConfirm={vi.fn()} />
        );

        expect(container.firstChild).toBeNull();
    });

    it('opens the modal, toggles items, and confirms with the season and full checklist map', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 8, 10)); // September -> autumn

        const onConfirm = vi.fn().mockResolvedValue(undefined);
        render(
            <SeasonalChecklistCard house={baseHouse} seasonalLogged={{ spring: false, autumn: false }} onConfirm={onConfirm} />
        );

        fireEvent.click(screen.getByRole('button', { name: /Vetrarfrágangur framundan/ }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Tæma vatnslagnir' }));

        // The confirm handler awaits the (resolved) onConfirm promise before
        // its follow-up setLoading/setShowModal state updates fire — flush
        // those microtasks inside act() so React doesn't warn about updates
        // happening outside of it.
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Skrá vetrarfrágang' }));
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(onConfirm).toHaveBeenCalledWith('autumn', {
            'Tæma vatnslagnir': true,
            'Taka inn útihúsgögn': false
        });
        expect(screen.queryByText('Gátlisti (valfrjálst)')).not.toBeInTheDocument();
    });
});
