/**
 * Helpers for starting the Firebase-backed auth listener (AuthHandler) lazily.
 *
 * AuthHandler (and with it the Firebase SDK) is a separate chunk. App routes start it
 * immediately; public marketing routes start it once the page is usable, so a logged-out
 * visitor reading the landing page does not wait for it. See src/components/AuthBootstrap.tsx.
 */

declare global {
    interface Window {
        /** Defined by the inline loader in index.html: runs the callback after load + idle, or on first interaction. */
        __whenPageUsable?: (fn: () => void) => void;
        /** Set by scripts/prerender.js: the page is being rendered to static HTML at build time. */
        __PRERENDER__?: boolean;
    }
}

export const loadAuthHandler = () => import('@/components/AuthHandler');

// Public pages that only read auth state to tweak a header/CTA or to redirect a returning
// signed-in user from "/". Every other path (login, signup, onboarding, join, guest,
// dashboard, settings, organizations, ...) starts auth immediately.
const MARKETING_EXACT = new Set([
    '/',
    '/eiginleikar',
    '/spurt-og-svarad',
    '/um-okkur',
    '/hafa-samband',
    '/handbok',
    '/verktakar',
    '/personuvernd',
    '/privacy',
    '/skilmalar',
    '/data-deletion',
    '/gogn-eyding',
    '/prufa',
]);

export function isDeferredAuthPath(pathname: string): boolean {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    return MARKETING_EXACT.has(path) || path.startsWith('/handbok/');
}

/** Runs `fn` once after the page is usable (load + idle, or first interaction). Returns a cancel function. */
export function whenPageUsable(fn: () => void): () => void {
    // Never during the build-time prerender: it would bake modulepreload tags for the chunks into the HTML.
    if (typeof window !== 'undefined' && window.__PRERENDER__) return () => {};
    let cancelled = false;
    const run = () => {
        if (!cancelled) fn();
    };
    if (typeof window !== 'undefined' && window.__whenPageUsable) {
        window.__whenPageUsable(run);
    } else if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(run, { timeout: 3500 });
    } else {
        setTimeout(run, 3500);
    }
    return () => {
        cancelled = true;
    };
}

const AUTH_DB = 'firebaseLocalStorageDb';
const AUTH_STORE = 'firebaseLocalStorage';

/**
 * Does this browser hold a persisted Firebase Auth user? Read straight from the IndexedDB that
 * Firebase Auth uses, without loading the SDK, so that a returning signed-in visitor on a
 * marketing page (who must be redirected / see "Stjórnborð") starts auth immediately instead of
 * waiting for idle. It never creates the database (an empty one made here would break Firebase's
 * own first open) and answers `true` whenever it cannot tell, which is the old behaviour.
 */
export function hasPersistedFirebaseAuth(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(true), 1500);
        const done = (value: boolean) => {
            clearTimeout(timer);
            resolve(value);
        };
        try {
            if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') return done(true);
            indexedDB
                .databases()
                .then((dbs) => {
                    if (!dbs.some((d) => d.name === AUTH_DB)) return done(false);
                    const open = indexedDB.open(AUTH_DB);
                    open.onerror = () => done(true);
                    open.onsuccess = () => {
                        const db = open.result;
                        try {
                            if (!db.objectStoreNames.contains(AUTH_STORE)) {
                                db.close();
                                return done(false);
                            }
                            const keysReq = db.transaction(AUTH_STORE, 'readonly').objectStore(AUTH_STORE).getAllKeys();
                            keysReq.onsuccess = () => {
                                db.close();
                                done(keysReq.result.some((k) => String(k).startsWith('firebase:authUser:')));
                            };
                            keysReq.onerror = () => {
                                db.close();
                                done(true);
                            };
                        } catch {
                            db.close();
                            done(true);
                        }
                    };
                })
                .catch(() => done(true));
        } catch {
            done(true);
        }
    });
}
