/**
 * PushOptInPrompt tests.
 * Verifies the dashboard-visit + Notification-permission gating logic and
 * that dismissal persists to the user doc (mocked firestore).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { updateDoc } from 'firebase/firestore';
import type { User } from '@/types/models';
import { requestPushPermission } from '@/utils/pushNotifications';
import PushOptInPrompt from './PushOptInPrompt';

vi.mock('@/lib/firebase', () => ({
    db: {},
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => ({})),
    updateDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/utils/pushNotifications', () => ({
    requestPushPermission: vi.fn(() => Promise.resolve('fake-token')),
}));

const mockedUpdateDoc = vi.mocked(updateDoc);
const mockedRequestPushPermission = vi.mocked(requestPushPermission);

function fakeUser(overrides: Partial<User> = {}): User {
    return {
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        house_ids: ['house-1'],
        created_at: new Date(),
        ...overrides,
    };
}

function stubNotification(permission: NotificationPermission | 'default' = 'default') {
    Object.defineProperty(window, 'Notification', {
        writable: true,
        configurable: true,
        value: { permission },
    });
}

describe('PushOptInPrompt', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        stubNotification('default');
    });

    it('does not render on the first dashboard visit', () => {
        render(<PushOptInPrompt currentUser={fakeUser()} />);
        expect(screen.queryByTestId('push-opt-in-prompt')).not.toBeInTheDocument();
        expect(localStorage.getItem('dashboard_visits')).toBe('1');
    });

    it('renders from the 2nd dashboard visit when permission is default and not dismissed', () => {
        localStorage.setItem('dashboard_visits', '1');
        render(<PushOptInPrompt currentUser={fakeUser()} />);
        expect(screen.getByTestId('push-opt-in-prompt')).toBeInTheDocument();
        expect(localStorage.getItem('dashboard_visits')).toBe('2');
    });

    it('does not render if the user already dismissed the prompt', () => {
        localStorage.setItem('dashboard_visits', '2');
        render(<PushOptInPrompt currentUser={fakeUser({ push_prompt_dismissed: true })} />);
        expect(screen.queryByTestId('push-opt-in-prompt')).not.toBeInTheDocument();
    });

    it('does not render if Notification permission is not default', () => {
        stubNotification('granted');
        localStorage.setItem('dashboard_visits', '2');
        render(<PushOptInPrompt currentUser={fakeUser()} />);
        expect(screen.queryByTestId('push-opt-in-prompt')).not.toBeInTheDocument();
    });

    it('does not render when there is no current user', () => {
        localStorage.setItem('dashboard_visits', '2');
        render(<PushOptInPrompt currentUser={null} />);
        expect(screen.queryByTestId('push-opt-in-prompt')).not.toBeInTheDocument();
    });

    it('dismiss button writes push_prompt_dismissed to the user doc and hides the prompt', async () => {
        localStorage.setItem('dashboard_visits', '1');
        const user = fakeUser();
        render(<PushOptInPrompt currentUser={user} />);

        expect(screen.getByTestId('push-opt-in-prompt')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Loka' }));

        expect(screen.queryByTestId('push-opt-in-prompt')).not.toBeInTheDocument();

        await waitFor(() => {
            expect(mockedUpdateDoc).toHaveBeenCalledWith(expect.anything(), { push_prompt_dismissed: true });
        });
    });

    it('enable button calls requestPushPermission and hides the prompt', async () => {
        localStorage.setItem('dashboard_visits', '1');
        const user = fakeUser();
        render(<PushOptInPrompt currentUser={user} />);

        fireEvent.click(screen.getByRole('button', { name: /Virkja tilkynningar/ }));

        await waitFor(() => {
            expect(mockedRequestPushPermission).toHaveBeenCalledWith(user);
        });

        await waitFor(() => {
            expect(screen.queryByTestId('push-opt-in-prompt')).not.toBeInTheDocument();
        });
    });
});
