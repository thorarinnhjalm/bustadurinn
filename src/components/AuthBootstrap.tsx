import { useEffect, useState, type ComponentType } from 'react';
import { useLocation } from 'react-router-dom';
import { isDeferredAuthPath, loadAuthHandler, hasPersistedFirebaseAuth, whenPageUsable } from '@/utils/authBootstrap';
import { logger } from '@/utils/logger';

let foregroundMessagingStarted = false;

/**
 * Mounts AuthHandler from its own lazily loaded chunk (it is what pulls in the Firebase SDK).
 *
 * - App routes (login, signup, onboarding, join, guest, dashboard, ...): started immediately,
 *   so signed-in users wait no longer than before.
 * - Public marketing routes: started once the page is usable (load + idle, or first
 *   interaction), or immediately when this browser holds a persisted sign-in, so a returning
 *   user still gets redirected / sees the right header quickly. Navigating to an app route
 *   starts it at once.
 *
 * The store's `isLoading` starts as `true` and only AuthHandler sets it to `false`, so
 * protected routes keep showing their loading state until the handler has reported.
 */
export default function AuthBootstrap({ prefetch = [] }: { prefetch?: Array<() => Promise<unknown>> }) {
    const { pathname } = useLocation();
    const deferred = isDeferredAuthPath(pathname);
    const [started, setStarted] = useState(!deferred);
    const [Handler, setHandler] = useState<ComponentType | null>(null);

    // Moving from a marketing page to an app route starts auth right away.
    useEffect(() => {
        if (!deferred) setStarted(true);
    }, [deferred]);

    // Marketing route, not started yet: wait for idle / interaction, unless a user is persisted.
    useEffect(() => {
        if (started) return;
        let cancelled = false;
        const start = () => {
            if (!cancelled) setStarted(true);
        };
        void hasPersistedFirebaseAuth().then((persisted) => {
            if (persisted) start();
        });
        const cancelIdle = whenPageUsable(() => {
            start();
            // Warm up the pages a marketing visitor is most likely to open next.
            prefetch.forEach((load) => void load().catch(() => {}));
        });
        return () => {
            cancelled = true;
            cancelIdle();
        };
    }, [started, prefetch]);

    useEffect(() => {
        if (!started || Handler) return;
        let cancelled = false;
        const attempt = (retry: number) => {
            loadAuthHandler()
                .then((mod) => {
                    if (cancelled) return;
                    setHandler(() => mod.default);
                    // Foreground push messages used to be wired at startup. firebase/messaging is its own
                    // chunk, so it is fetched once the page is usable instead of competing with the first render.
                    if (!foregroundMessagingStarted) {
                        foregroundMessagingStarted = true;
                        whenPageUsable(() => {
                            void import('@/utils/pushNotifications')
                                .then((m) => m.onForegroundMessage())
                                .catch((err) => logger.warn('Foreground push setup failed:', err));
                        });
                    }
                })
                .catch((err) => {
                    logger.warn('AuthHandler failed to load:', err);
                    if (!cancelled && retry < 3) setTimeout(() => attempt(retry + 1), 2000 * (retry + 1));
                });
        };
        attempt(0);
        return () => {
            cancelled = true;
        };
    }, [started, Handler]);

    return Handler ? <Handler /> : null;
}
