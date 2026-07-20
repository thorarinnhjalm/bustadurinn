import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/types/models';
import { requestPushPermission } from '@/utils/pushNotifications';
import { logger } from '@/utils/logger';

const DASHBOARD_VISITS_KEY = 'dashboard_visits';
const MIN_VISITS_BEFORE_PROMPT = 2;

interface PushOptInPromptProps {
    currentUser: User | null;
}

/**
 * Dashboard card that nudges users to opt in to push notifications
 * (booking + weather alerts). Shown only from the 2nd dashboard visit
 * onward, and only while the browser's Notification permission is still
 * 'default' (unasked). Dismissal is written to the user doc so it never
 * reappears on other devices; the visit counter itself is a cheap local
 * heuristic and stays in localStorage.
 */
export default function PushOptInPrompt({ currentUser }: PushOptInPromptProps) {
    const [visible, setVisible] = useState(false);
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Track dashboard visits regardless of notification support so the
        // counter reflects real usage.
        let visits = 1;
        try {
            visits = parseInt(localStorage.getItem(DASHBOARD_VISITS_KEY) || '0', 10) + 1;
            localStorage.setItem(DASHBOARD_VISITS_KEY, String(visits));
        } catch {
            // localStorage unavailable (e.g. private browsing) — treat as first visit.
        }

        if (!currentUser) return;
        if (currentUser.push_prompt_dismissed) return;
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'default') return;
        if (visits < MIN_VISITS_BEFORE_PROMPT) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
    }, [currentUser]);

    if (!visible || !currentUser) return null;

    const handleEnable = async () => {
        setRequesting(true);
        try {
            await requestPushPermission(currentUser);
        } catch (error) {
            logger.error('Failed to enable push notifications from dashboard prompt:', error);
        } finally {
            setRequesting(false);
            // Hide regardless of outcome — the browser permission is no
            // longer 'default' either way (granted or denied).
            setVisible(false);
        }
    };

    const handleDismiss = async () => {
        setVisible(false);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { push_prompt_dismissed: true });
        } catch (error) {
            logger.error('Failed to persist push prompt dismissal:', error);
        }
    };

    return (
        <div
            data-testid="push-opt-in-prompt"
            className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 flex items-start gap-4"
        >
            <div className="w-10 h-10 rounded-full bg-amber/20 text-amber flex items-center justify-center flex-shrink-0">
                <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-charcoal">Fá tilkynningar í símann?</p>
                <p className="text-xs text-stone-500 mt-1">
                    Við sendum þér ábendingu þegar einhver bókar húsið eða þegar von er á
                    slæmu veðri fyrir ferðina þína — ekkert spam, bara það sem skiptir máli.
                </p>
                <button
                    onClick={handleEnable}
                    disabled={requesting}
                    className="btn btn-primary btn-sm mt-3 disabled:opacity-60"
                >
                    {requesting ? 'Virkja...' : 'Virkja tilkynningar'}
                </button>
            </div>
            <button
                onClick={handleDismiss}
                className="text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0"
                title="Loka"
                aria-label="Loka"
            >
                <X size={16} />
            </button>
        </div>
    );
}
