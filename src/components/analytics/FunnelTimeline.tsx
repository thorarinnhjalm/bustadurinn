/**
 * Shows one user's new-user funnel (`funnel_events`) in time order, so a
 * super admin can see where a stuck signup stopped and why.
 */

import { useEffect, useState } from 'react';
import { Loader2, RotateCw, AppWindow } from 'lucide-react';
import { getFunnelEventsForUser } from '@/services/funnelService';
import type { AnnotatedFunnelEvent } from '@/services/funnelService';
import { logger } from '@/utils/logger';

const EVENT_LABELS: Record<string, string> = {
    signup_viewed: 'Opnaði nýskráningu',
    signup_submitted: 'Sendi inn nýskráningu',
    signup_auth_created: 'Aðgangur stofnaður',
    signup_completed: 'Nýskráningu lokið',
    signup_existing_user: 'Netfangið var þegar skráð',
    signup_error: 'Villa í nýskráningu',
    login_submitted: 'Reyndi að skrá sig inn',
    login_completed: 'Skráði sig inn',
    login_error: 'Villa í innskráningu',
    onboarding_mounted: 'Uppsetningarsíðan opnaðist',
    onboarding_unmounted: 'Fór af uppsetningarsíðunni',
    onboarding_page_hidden: 'Fór úr flipanum eða lokaði honum',
    onboarding_started: 'Sá „Velkomin“',
    step_house: 'Fór á hússkrefið',
    step_invite: 'Fór á boðsskrefið',
    step_finish: 'Fór á lokaskrefið',
    onboarding_back: 'Ýtti á „Til baka“',
    house_create_submitted: 'Reyndi að stofna hús',
    house_create_error: 'Villa við að stofna hús',
    house_created: 'Hús stofnað',
    house_init_error: 'Villa við uppsetningu hússins',
    invites_skipped: 'Sleppti því að bjóða',
    invites_result: 'Sendi boð',
    invites_error: 'Villa við að senda boð',
    onboarding_email_error: 'Tölvupóstur fór ekki',
    onboarding_completed: 'Kláraði uppsetningu',
    onboarding_redirect_dashboard: 'Sendur áfram á stjórnborðið',
    dashboard_redirect_onboarding: 'Sendur aftur á uppsetningu',
    dashboard_no_house_screen: 'Sá „ekkert hús“ skjáinn',
    dashboard_reached: 'Komst á stjórnborðið',
    profile_self_repair: 'Prófíll lagaður sjálfkrafa',
    profile_self_repair_error: 'Villa við að laga prófíl',
    profile_listen_error: 'Villa við að lesa prófíl',
    houses_fetch_error: 'Villa við að sækja hús',
    app_error_boundary: 'Forritið hrundi',
    app_error_retry: 'Ýtti á „Reyna aftur“',
    js_error: 'Villa í vafranum',
    js_unhandled_rejection: 'Ómeðhöndluð villa í vafranum',
    maps_key_missing: 'Kortið vantar lykil',
    maps_load_error: 'Kortið hlóðst ekki',
    address_selected: 'Valdi heimilisfang',
    address_search_error: 'Villa í leit að heimilisfangi',
    join_request_submitted: 'Bað um aðgang að húsi',
    join_request_sent: 'Beiðni um aðgang send',
    join_request_error: 'Villa í beiðni um aðgang',
    pwa_prompt_shown: 'Sá „bæta á heimaskjá“',
};

function labelFor(name: string): string {
    return Object.prototype.hasOwnProperty.call(EVENT_LABELS, name) ? EVENT_LABELS[name] : name;
}

function isProblem(event: AnnotatedFunnelEvent): boolean {
    const name = event.event_name;
    if (name === 'invites_result') return Number(event.data.failed) > 0;
    return (name.includes('error') && name !== 'app_error_retry')
        || name.startsWith('js_')
        || name === 'maps_key_missing';
}

function formatTime(date: Date | null): string {
    if (!date) return 'óþekktur tími';
    return date.toLocaleString('is-IS', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

function formatValue(value: string | number | boolean | null): string {
    return value === null ? '–' : String(value);
}

export default function FunnelTimeline({ uid }: { uid: string }) {
    const [events, setEvents] = useState<AnnotatedFunnelEvent[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getFunnelEventsForUser(uid)
            .then((result) => { if (!cancelled) setEvents(result); })
            .catch((e) => {
                logger.error('Failed to load funnel events:', e);
                if (!cancelled) setError(e?.message || 'Óþekkt villa');
            });
        return () => { cancelled = true; };
    }, [uid]);

    if (error) {
        return <p className="text-sm text-red-700">Gat ekki sótt skrefin: {error}</p>;
    }
    if (!events) {
        return (
            <p className="text-sm text-grey-mid flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Sæki skref...
            </p>
        );
    }
    if (events.length === 0) {
        return (
            <p className="text-sm text-grey-mid italic">
                Engin skref skráð. Notandinn skráði sig mögulega áður en skráningin fór í loftið, eða komst aldrei inn.
            </p>
        );
    }

    return (
        <div>
            <p className="text-xs text-grey-mid mb-2 break-all">
                Tæki: {events.find((e) => e.ua)?.ua || 'óþekkt'}
            </p>
            <ol className="space-y-1">
                {events.map((event) => {
                    const problem = isProblem(event);
                    const details = Object.entries(event.data).filter(([key]) => key !== 'house_id');
                    return (
                        <li key={event.id}>
                            {event.newSession && (
                                <div className="flex items-center gap-1 text-xs font-bold text-blue-700 mt-2 mb-1">
                                    <AppWindow className="w-3 h-3" /> Ný lota: nýr flipi, ný heimsókn eða ný innskráning
                                </div>
                            )}
                            {event.reload && (
                                <div className="flex items-center gap-1 text-xs font-bold text-amber-700 mt-2 mb-1">
                                    <RotateCw className="w-3 h-3" /> Síðan hlóðst upp á nýtt (notandinn eða forritið)
                                </div>
                            )}
                            <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 px-2 py-1 rounded ${problem ? 'bg-red-50' : ''}`}>
                                <span className="text-xs text-grey-mid tabular-nums">{formatTime(event.at)}</span>
                                <span className={`text-sm font-medium ${problem ? 'text-red-700' : 'text-charcoal'}`}>
                                    {labelFor(event.event_name)}
                                </span>
                                {event.env && event.env !== 'production' && (
                                    <span className="text-xs bg-amber/20 text-amber-800 px-1.5 py-0.5 rounded">{event.env}</span>
                                )}
                                <span className="text-xs text-grey-mid">{event.event_name} · {event.path}</span>
                                {details.map(([key, value]) => (
                                    <span key={key} className="text-xs bg-stone-100 text-grey-dark px-1.5 py-0.5 rounded break-all">
                                        {key}: {formatValue(value)}
                                    </span>
                                ))}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
