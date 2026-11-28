import { useState, useEffect, useId } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import {
    User as UserIcon,
    LogOut,
    Edit2,
    Image as ImageIcon,
    AlertTriangle,
    RefreshCw,
    Bell,
    Mail,
    Check
} from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { requestPushPermission } from '@/utils/pushNotifications';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useAppStore } from '@/store/appStore';
import type { User, NotificationSettings } from '@/types/models';
import { updateUserNameInAllCollections } from '@/services/userService';
import Toggle from '@/components/settings/Toggle';
import { logger } from '@/utils/logger';
import type { MembershipAction, SettingsFeedback } from './types';

interface ProfileTabProps extends SettingsFeedback {
    currentUser: User | null | undefined;
    isImpersonating: boolean;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    canChangeMembership: boolean;
    onAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLogout: () => void;
    onOpenMembershipAction: (action: MembershipAction) => void;
}

/** Mínar stillingar tab: avatar, language, name, notifications, password reset and account deletion. */
export default function ProfileTab({
    currentUser,
    isImpersonating,
    loading,
    setLoading,
    canChangeMembership,
    onAvatarSelect,
    onLogout,
    onOpenMembershipAction,
    setSuccess,
    setError,
}: ProfileTabProps) {
    const baseId = useId();
    const { startImpersonation } = useImpersonation();
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);

    // Profile State
    const [userName, setUserName] = useState('');
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        emails: {
            new_bookings: true,
            task_reminders: true,
            system_updates: true,
            member_activity: true,
            weather_alerts: true
        },
        in_app: {
            new_bookings: true,
            task_assignments: true,
            guestbook_entries: true,
            shopping_list_updates: true,
            weather_alerts: true
        }
    });

    useEffect(() => {
        if (currentUser?.name) {
            setUserName(currentUser.name);
        }
        if (currentUser?.notification_settings) {
            setNotificationSettings(currentUser.notification_settings);
        }
    }, [currentUser]);

    const handleSaveProfile = async () => {
        if (!currentUser || !userName.trim()) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                name: userName.trim()
            });

            // Update the denormalised name copies in every house
            const nameResult = await updateUserNameInAllCollections(currentUser.uid, userName.trim(), currentUser.house_ids || []);

            const updatedUser = { ...currentUser, name: userName.trim() };

            if (isImpersonating) {
                startImpersonation(updatedUser);
            } else {
                setCurrentUser(updatedUser);
            }

            if (nameResult.ok) {
                setSuccess('Nafni breytt!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(
                    `Nafninu var breytt, en það tókst ekki að uppfæra það á eldri færslum í ${nameResult.failedHouseIds.length} húsi. ` +
                    'Eldri færslur geta enn sýnt gamla nafnið. Reyndu að vista aftur síðar.'
                );
            }
        } catch (err) {
            logger.error('Error updating profile:', err);
            setError('Gat ekki vistað nafn.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!currentUser?.email) return;
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            setSuccess(`Tölvupóstur sendur á ${currentUser.email}. Athugaðu ruslpóstinn ef hann berst ekki.`);
        } catch (err) {
            logger.error('Error sending password reset:', err);
            setError('Gat ekki sent tölvupóst. Reyndu aftur síðar.');
        }
    };

    const handleUpdateLanguage = async (code: 'is' | 'en' | 'de' | 'fr' | 'es') => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                language: code
            });
            const updatedUser = { ...currentUser, language: code };
            if (isImpersonating) {
                startImpersonation(updatedUser);
            } else {
                setCurrentUser(updatedUser);
            }
            setSuccess('Tungumál uppfært');
            setTimeout(() => setSuccess(''), 2000);
        } catch (e) {
            logger.error('Error updating language', e);
            setError('Gat ekki uppfært tungumál');
        }
    };

    const handleUpdateNotificationSettings = async (
        category: 'emails' | 'in_app',
        setting: string,
        value: boolean
    ) => {
        if (!currentUser) return;

        const newSettings = {
            ...notificationSettings,
            [category]: {
                ...notificationSettings[category],
                [setting]: value
            }
        };

        setNotificationSettings(newSettings);

        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                notification_settings: newSettings
            });

            // Update global state
            setCurrentUser({
                ...currentUser,
                notification_settings: newSettings
            });
        } catch (err) {
            logger.error('Error updating notification settings:', err);
            setError('Gat ekki uppfært tilkynningastillingar.');
            // Revert on error
            setNotificationSettings(notificationSettings);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <UserIcon className="w-6 h-6 text-amber-ink" aria-hidden="true" />
                <h2 className="text-xl font-serif">Mínar stillingar</h2>
            </div>

            <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center pb-6 border-b border-stone-200">
                    <div className="relative group cursor-pointer mb-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-stone-100">
                            {currentUser?.avatar ? (
                                <img loading="lazy" src={currentUser.avatar} alt="Prófílmynd" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-500">
                                    <UserIcon size={40} aria-hidden="true" />
                                </div>
                            )}
                        </div>
                        <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity cursor-pointer text-white">
                            <ImageIcon size={24} aria-hidden="true" />
                            <span className="sr-only">Velja nýja prófílmynd</span>
                            <input
                                id="avatar-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={onAvatarSelect}
                            />
                        </label>
                        <button
                            type="button"
                            aria-label="Breyta prófílmynd"
                            className="absolute bottom-0 right-0 bg-amber text-charcoal p-1.5 rounded-full shadow-sm hover:bg-amber-dark transition-colors"
                            onClick={() => {
                                const input = document.getElementById('avatar-upload') as HTMLInputElement;
                                input?.click();
                            }}
                        >
                            <Edit2 size={12} aria-hidden="true" />
                        </button>
                    </div>
                    <p className="text-sm text-stone-500">Smelltu á myndina til að breyta</p>
                </div>

                <div>
                    <p id={`${baseId}-lang-h`} className="label">Tungumál</p>
                    <div role="group" aria-labelledby={`${baseId}-lang-h`} className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                            { code: 'is', label: '🇮🇸 Íslenska' },
                            { code: 'en', label: '🇬🇧 English' },
                            { code: 'de', label: '🇩🇪 Deutsch' },
                            { code: 'fr', label: '🇫🇷 Français' },
                            { code: 'es', label: '🇪🇸 Español' },
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                type="button"
                                aria-pressed={currentUser?.language === lang.code}
                                onClick={() => handleUpdateLanguage(lang.code as any)}
                                className={`
                            p-3 rounded-lg border text-sm font-medium transition-all
                            ${currentUser?.language === lang.code
                                        ? 'border-amber bg-amber/10 text-charcoal ring-1 ring-amber'
                                        : 'border-grey-warm hover:border-grey-mid'
                                    }
                          `}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-grey-warm">
                    <label htmlFor={`${baseId}-user-name`} className="label">Nafn</label>
                    <div className="flex gap-2">
                        <input
                            id={`${baseId}-user-name`}
                            type="text"
                            className="input max-w-md"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Nafn..."
                            aria-describedby={`${baseId}-user-name-help`}
                        />
                        <button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={loading || !userName.trim() || userName === currentUser?.name}
                            className="btn btn-primary whitespace-nowrap"
                        >
                            Vista
                        </button>
                    </div>
                    <p id={`${baseId}-user-name-help`} className="text-xs text-grey-mid mt-1">Hér getur þú breytt nafninu þínu sem birtist öðrum notendum.</p>
                </div>

                {/* Granular Notification Settings */}
                <div className="pt-8 border-t border-stone-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-ink">
                            <Bell size={20} aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="font-serif text-lg font-bold">Tilkynningar</h3>
                            <p className="text-xs text-stone-500">Stjórnaðu hvernig og hvenær þú færð tilkynningar.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Email Notifications */}
                        <div role="group" aria-labelledby={`${baseId}-notif-email-h`} className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Mail size={16} className="text-stone-500" aria-hidden="true" />
                                <h4 id={`${baseId}-notif-email-h`} className="text-sm font-bold uppercase tracking-wider text-stone-600">Tölvupóstur</h4>
                            </div>

                            <Toggle
                                variant="row"
                                label="Nýjar bókanir"
                                description="Fá tölvupóst þegar húsfélagsmeðlimur bókar"
                                checked={notificationSettings.emails.new_bookings}
                                onChange={(val) => handleUpdateNotificationSettings('emails', 'new_bookings', val)}
                            />
                            <Toggle
                                variant="row"
                                label="Verkefni"
                                description="Áminningar um verkefni sem eiga að klárast"
                                checked={notificationSettings.emails.task_reminders}
                                onChange={(val) => handleUpdateNotificationSettings('emails', 'task_reminders', val)}
                            />
                            <Toggle
                                variant="row"
                                label="Veðurviðvaranir"
                                description="Fá sjarmerandi veðuráminningar fyrir dvalir"
                                checked={notificationSettings.emails.weather_alerts}
                                onChange={(val) => handleUpdateNotificationSettings('emails', 'weather_alerts', val)}
                            />
                        </div>

                        {/* In-App Notifications */}
                        <div role="group" aria-labelledby={`${baseId}-notif-app-h`} className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Bell size={16} className="text-stone-500" aria-hidden="true" />
                                <h4 id={`${baseId}-notif-app-h`} className="text-sm font-bold uppercase tracking-wider text-stone-600">Í forritinu</h4>
                            </div>

                            <Toggle
                                variant="row"
                                label="Nýjar bókanir"
                                description="Tilkynning á stjórnborði þegar ný bókun kemur"
                                checked={notificationSettings.in_app.new_bookings}
                                onChange={(val) => handleUpdateNotificationSettings('in_app', 'new_bookings', val)}
                            />
                            <Toggle
                                variant="row"
                                label="Gestabók"
                                description="Þegar gestir skrifa í gestabókina"
                                checked={notificationSettings.in_app.guestbook_entries}
                                onChange={(val) => handleUpdateNotificationSettings('in_app', 'guestbook_entries', val)}
                            />
                            <Toggle
                                variant="row"
                                label="Veðurviðvaranir"
                                description="Veðurspá og aðstæður á stjórnborði"
                                checked={notificationSettings.in_app.weather_alerts}
                                onChange={(val) => handleUpdateNotificationSettings('in_app', 'weather_alerts', val)}
                            />
                        </div>

                        {/* Push Notifications */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div aria-hidden="true" className="w-4 h-4 rounded-full bg-amber flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-stone-600">Push-tilkynningar</h4>
                            </div>

                            <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                                <p className="text-xs text-stone-500 mb-4">
                                    Virkaðu push-tilkynningar til að fá skilaboð beint í símann þinn (eins og "native" app).
                                </p>

                                {currentUser?.fcm_tokens && currentUser.fcm_tokens.length > 0 ? (
                                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                        <Check size={14} aria-hidden="true" />
                                        <span className="text-xs font-bold">Virkjað á þessu tæki</span>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!currentUser) return;
                                            const token = await requestPushPermission(currentUser);
                                            if (token) {
                                                setSuccess('Push-tilkynningar virkjaðar!');
                                                // We need to refresh the UI state or rely on currentUser from store updating
                                            } else {
                                                setError('Gat ekki virkjað tilkynningar. Athugaðu leyfi í vafranum.');
                                            }
                                        }}
                                        className="w-full btn btn-primary text-xs py-2"
                                    >
                                        Virkja í þessum síma/vafra
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-grey-warm">
                    <p className="label">Netfang & Aðgangur</p>
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <p className="text-sm font-bold text-charcoal">Netfang</p>
                                <p className="text-stone-600 font-mono text-sm">{currentUser?.email}</p>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Virkt</span>
                        </div>
                        <div className="pt-3 border-t border-stone-200 mt-2">
                            <button
                                type="button"
                                onClick={handlePasswordReset}
                                className="text-sm font-bold text-amber-ink hover:text-amber-dark flex items-center gap-1 hover:underline"
                            >
                                <RefreshCw size={14} aria-hidden="true" />
                                Endurstilla lykilorð (Senda tölvupóst)
                            </button>
                        </div>
                    </div>
                </div>

                {canChangeMembership && (
                    <div className="pt-8 border-t border-red-200">
                        <div className="flex items-center gap-2 mb-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                            <h3 className="font-serif text-lg font-bold">Eyða aðgangi</h3>
                        </div>
                        <p className="text-sm text-stone-600 mb-4 max-w-xl">
                            Aðgangnum þínum er eytt varanlega. Hús þar sem þú ert eini eigandinn eyðast með öllum bókunum,
                            fjármálum, verkefnum og gestahlekkjum. Í öðrum húsum ert þú fjarlægð(ur) og ef þú ert umsjónarmaður
                            tekur næsti meðeigandi við.
                        </p>
                        <button
                            type="button"
                            onClick={() => onOpenMembershipAction({ type: 'delete_account' })}
                            className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                        >
                            Eyða aðgangi
                        </button>
                    </div>
                )}

                <div className="pt-8 border-t border-grey-warm flex justify-end">
                    <button
                        type="button"
                        onClick={onLogout}
                        className="btn btn-ghost text-red-600 hover:bg-red-50"
                    >
                        <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                        Skrá út
                    </button>
                </div>
            </div>
        </div>
    );
}
