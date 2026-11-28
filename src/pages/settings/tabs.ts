export type Tab = 'house' | 'members' | 'profile' | 'guests' | 'guestbook' | 'shopping' | 'logs';

export const TAB_IDS: readonly Tab[] = ['house', 'members', 'profile', 'guests', 'guestbook', 'shopping', 'logs'];
// Alternative names accepted in /settings?tab=...
export const TAB_ALIASES: Record<string, Tab> = { tasks: 'logs', verkefni: 'logs' };

/** Resolve a ?tab= value (or router state) to a known tab id, or null. */
export function parseTab(value: unknown): Tab | null {
    if (typeof value !== 'string') return null;
    if ((TAB_IDS as readonly string[]).includes(value)) return value as Tab;
    return TAB_ALIASES[value] ?? null;
}
