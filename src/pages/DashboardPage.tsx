
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { shouldShowWeather } from '@/services/weatherService';
import MyServiceWidget from '@/components/dashboard/MyServiceWidget';
import PushOptInPrompt from '@/components/dashboard/PushOptInPrompt';
import BookingWeatherCard from '@/components/BookingWeatherCard';
import SetupProgress from '@/components/SetupProgress';
import WhatsNext from '@/components/WhatsNext';
import DashboardLayout from '@/components/DashboardLayout';
import { trackFunnel, consumeOnboardingMark } from '@/utils/funnel';
import Walkthrough from '@/components/Walkthrough';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useDashboardData } from './dashboard/useDashboardData';
import { useStayActions } from './dashboard/useStayActions';
import DashboardHero from './dashboard/DashboardHero';
import StayActionsBar from './dashboard/StayActionsBar';
import StayActionModals from './dashboard/StayActionModals';
import SeasonalChecklistSection from './dashboard/SeasonalChecklistSection';
import GasCylinderSection from './dashboard/GasCylinderSection';
import HouseNotices from './dashboard/HouseNotices';
import FinanceCard from './dashboard/FinanceCard';
import NextBookingCard from './dashboard/NextBookingCard';
import ShoppingCard from './dashboard/ShoppingCard';
import InventorySection from './dashboard/InventorySection';
import TasksCard from './dashboard/TasksCard';
import BookingDetailDialog from './dashboard/BookingDetailDialog';
import PageTitle from '@/components/PageTitle';

const UserDashboard = () => {
    const navigate = useNavigate();
    const currentHouse = useAppStore((state) => state.currentHouse);
    const { user: currentUser } = useEffectiveUser();

    // UI state
    const [showWalkthrough, setShowWalkthrough] = useState(false);
    const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);

    // Funnel: the first dashboard view after onboarding in this tab is the
    // end of the new-user funnel.
    useEffect(() => {
        if (currentUser && currentHouse && consumeOnboardingMark()) {
            void trackFunnel('dashboard_reached', { house_id: currentHouse.id });
        }
    }, [currentUser, currentHouse]);

    // Check for first-time walkthrough
    useEffect(() => {
        const hasSeen = localStorage.getItem('has_seen_walkthrough');
        if (!hasSeen && currentUser && currentHouse) {
            // Small delay to allow fade-in
            const timer = setTimeout(() => setShowWalkthrough(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [currentUser, currentHouse]);

    // Real Data State
    const appLoading = useAppStore((state) => state.isLoading);

    // Users without any house go to onboarding (the data hooks below
    // subscribe to nothing for them).
    useEffect(() => {
        if (currentUser && (!currentUser.house_ids || currentUser.house_ids.length === 0)) {
            void trackFunnel('dashboard_redirect_onboarding');
            navigate('/onboarding');
            return;
        }
    }, [currentHouse?.id, currentUser?.uid, navigate]);

    const {
        dashboardLoading,
        nextBooking,
        isOccupied,
        tasks,
        shoppingItems,
        inventoryItems,
        weather,
        finances,
        budgetPlan,
        isCheckedIn,
        setIsCheckedIn,
        lastCheckoutChecklist,
        seasonalLogged
    } = useDashboardData(currentHouse, currentUser);

    const stay = useStayActions(currentHouse, currentUser, isCheckedIn, setIsCheckedIn);

    // Funnel: a user who has house_ids but still sees "Engin hús fundust" is
    // stuck. (Users with no house_ids see it for one frame before the redirect
    // to onboarding, which is recorded separately.)
    const showsNoHouseScreen = !appLoading && !currentHouse && (currentUser?.house_ids?.length ?? 0) > 0;
    useEffect(() => {
        if (showsNoHouseScreen) {
            void trackFunnel('dashboard_no_house_screen', { house_ids: currentUser?.house_ids?.length ?? 0 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showsNoHouseScreen]);

    if (appLoading) {
        return (
            <div role="status" className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
                <Loader2 className="w-8 h-8 motion-safe:animate-spin text-stone-500" aria-hidden="true" />
                <span className="sr-only">Hleð…</span>
            </div>
        );
    }

    // Handle missing house (e.g., during impersonation or onboarding incomplete)
    // MOVED UP: Check this BEFORE trying to render dashboard content
    if (!currentHouse) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6">
                <div className="card max-w-md text-center">
                    <h2 className="text-2xl font-serif mb-4">Engin hús fundust</h2>
                    <p className="text-grey-dark mb-6">
                        Ekki tókst að hlaða húsinu þínu. Reyndu aftur eða hafðu samband ef vandinn heldur áfram.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="btn btn-primary"
                    >
                        Reyna aftur
                    </button>
                    <Link to="/hafa-samband" className="btn btn-ghost mt-2 inline-block">
                        Hafa samband
                    </Link>
                </div>
            </div>
        );
    }

    if (dashboardLoading) {
        return (
            <div role="status" className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
                <Loader2 className="w-8 h-8 motion-safe:animate-spin text-stone-500" aria-hidden="true" />
                <span className="sr-only">Hleð…</span>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <PageTitle title="Stjórnborð" />
            {/* --- HERO IMAGE & STATUS --- */}
            <DashboardHero
                currentHouse={currentHouse}
                currentUser={currentUser}
                weather={weather}
                isOccupied={isOccupied}
            />

            {/* --- MAIN CONTENT --- */}
            <div className="max-w-5xl mx-auto px-4 relative z-10 space-y-8 -mt-8 pt-10">

                {/* Push notification opt-in nudge (booking + weather alerts) */}
                <PushOptInPrompt currentUser={currentUser} />

                {/* Service Provider Widget (Only visible for providers) */}
                <MyServiceWidget />

                {/* Setup Progress (shows if incomplete) */}
                <SetupProgress
                    house={currentHouse}
                    onShowWalkthrough={() => setShowWalkthrough(true)}
                />

                {/* What's Next nudges (shows when setup complete but actions pending) */}
                <WhatsNext
                    house={currentHouse}
                    currentUser={currentUser}
                    bookingsCount={nextBooking ? 1 : 0}
                    membersCount={currentHouse?.owner_ids?.length || 1}
                />

                {/* Quick Actions Bar */}
                <StayActionsBar isCheckedIn={isCheckedIn} onStayButtonClick={stay.onStayButtonClick} />

                {/* Seasonal checklist nudge (spring-opening / winter-closing) */}
                <SeasonalChecklistSection
                    currentHouse={currentHouse}
                    currentUser={currentUser}
                    seasonalLogged={seasonalLogged}
                />

                {/* Gas cylinder — renders only when configured in settings */}
                <GasCylinderSection currentHouse={currentHouse} currentUser={currentUser} />

                {/* Last checkout checklist strip + missing address warning */}
                <HouseNotices
                    currentHouse={currentHouse}
                    currentUser={currentUser}
                    lastCheckoutChecklist={lastCheckoutChecklist}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

                    <FinanceCard
                        currentHouse={currentHouse}
                        currentUser={currentUser}
                        finances={finances}
                        budgetPlan={budgetPlan}
                    />

                    <NextBookingCard
                        nextBooking={nextBooking}
                        onOpenDetails={() => setShowBookingDetailModal(true)}
                    />

                    <ShoppingCard
                        currentHouse={currentHouse}
                        currentUser={currentUser}
                        shoppingItems={shoppingItems}
                    />

                    <InventorySection
                        currentHouse={currentHouse}
                        currentUser={currentUser}
                        inventoryItems={inventoryItems}
                    />

                    <TasksCard tasks={tasks} />
                </div>

                {/* WEATHER FORECAST (only when a booking is coming up within the next 7 days) */}
                {nextBooking && currentHouse?.location?.lat && currentHouse?.location?.lng && shouldShowWeather(nextBooking.start) && (
                    <ErrorBoundary fallback={<></>}>
                        <BookingWeatherCard
                            bookingId={nextBooking.id}
                            startDate={nextBooking.start}
                            endDate={nextBooking.end}
                            houseLatitude={currentHouse.location.lat}
                            houseLongitude={currentHouse.location.lng}
                            houseName={currentHouse.name}
                        />
                    </ErrorBoundary>
                )}
            </div>

            {nextBooking && (
                <BookingDetailDialog
                    booking={nextBooking}
                    currentHouse={currentHouse}
                    currentUser={currentUser}
                    open={showBookingDetailModal}
                    onClose={() => setShowBookingDetailModal(false)}
                />
            )}

            <StayActionModals
                currentHouse={currentHouse}
                inventoryItems={inventoryItems}
                showCheckoutModal={stay.showCheckoutModal}
                onCloseCheckout={() => stay.setShowCheckoutModal(false)}
                checkoutLoading={stay.checkoutLoading}
                onCheckout={stay.handleCheckout}
                checkoutMessage={stay.checkoutMessage}
                onCheckoutMessageChange={stay.setCheckoutMessage}
                showCheckInModal={stay.showCheckInModal}
                onCloseCheckIn={() => stay.setShowCheckInModal(false)}
                checkInLoading={stay.checkInLoading}
                onCheckIn={stay.handleCheckIn}
            />
            {showWalkthrough && (
                <Walkthrough onClose={() => setShowWalkthrough(false)} />
            )}
        </DashboardLayout>
    );
};

export default UserDashboard;
