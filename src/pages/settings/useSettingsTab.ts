import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { parseTab } from './tabs';
import type { Tab } from './tabs';

/**
 * The active settings tab, kept in sync with `?tab=`: the initial tab comes from the
 * URL, else from `location.state.initialTab`, else 'house' (aliases such as `tasks` /
 * `verkefni` resolve to 'logs'); switching tabs replaces the history entry; and a
 * `?tab=` change from outside (e.g. a notification link) is followed.
 */
export function useSettingsTab() {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTabState] = useState<Tab>(() => {
        const state = location.state as { initialTab?: Tab } | null;
        return parseTab(searchParams.get('tab')) || parseTab(state?.initialTab) || 'house';
    });

    // Switching tabs keeps the URL in sync (replace, so Back does not step through tabs)
    const setActiveTab = (tab: Tab) => {
        setActiveTabState(tab);
        if (searchParams.get('tab') !== tab) {
            const next = new URLSearchParams(searchParams);
            next.set('tab', tab);
            setSearchParams(next, { replace: true });
        }
    };

    // Follow the URL when it changes from outside (e.g. a notification link while already on this page)
    const urlTab = parseTab(searchParams.get('tab'));
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- moved unchanged from SettingsPage (the compiler lint did not analyse the old, larger component)
        if (urlTab) setActiveTabState(urlTab);
    }, [urlTab]);

    return { activeTab, setActiveTab };
}
