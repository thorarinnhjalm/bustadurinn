import type { House, InventoryItem } from '@/types/models';
import ErrorBoundary from '@/components/ErrorBoundary';
import CheckoutModal from '@/components/dashboard/CheckoutModal';
import CheckInModal from '@/components/dashboard/CheckInModal';
import ModalErrorFallback from './ModalErrorFallback';

interface StayActionModalsProps {
    currentHouse: House;
    inventoryItems: InventoryItem[];
    showCheckoutModal: boolean;
    onCloseCheckout: () => void;
    checkoutLoading: boolean;
    onCheckout: (checklist: Record<string, boolean>, suppliesOut: string[]) => Promise<void>;
    checkoutMessage: string;
    onCheckoutMessageChange: (message: string) => void;
    showCheckInModal: boolean;
    onCloseCheckIn: () => void;
    checkInLoading: boolean;
    onCheckIn: (checklist: Record<string, boolean>) => Promise<void>;
}

/** Check-out and check-in dialogs (rendered at the page root, outside the content column). */
export default function StayActionModals({
    currentHouse,
    inventoryItems,
    showCheckoutModal,
    onCloseCheckout,
    checkoutLoading,
    onCheckout,
    checkoutMessage,
    onCheckoutMessageChange,
    showCheckInModal,
    onCloseCheckIn,
    checkInLoading,
    onCheckIn
}: StayActionModalsProps) {
    return (
        <>
            {showCheckoutModal && (
                <ErrorBoundary fallback={
                    <ModalErrorFallback open={showCheckoutModal} onClose={onCloseCheckout} message="Ekki tókst að hlaða útskráningarglugga" />
                }>
                    <CheckoutModal
                        isOpen={showCheckoutModal}
                        onClose={onCloseCheckout}
                        loading={checkoutLoading}
                        onCheckout={onCheckout}
                        message={checkoutMessage}
                        onMessageChange={onCheckoutMessageChange}
                        checklist={currentHouse?.checkout_checklist}
                        supplyChecklist={
                            inventoryItems.length > 0
                                ? inventoryItems.filter(i => i.category === 'pantry' || i.category === 'cleaning').map(i => i.name)
                                : currentHouse?.supply_checklist
                        }
                    />
                </ErrorBoundary>
            )}
            {showCheckInModal && (
                <ErrorBoundary fallback={
                    <ModalErrorFallback open={showCheckInModal} onClose={onCloseCheckIn} message="Ekki tókst að hlaða innskráningarglugga" />
                }>
                    <CheckInModal
                        isOpen={showCheckInModal}
                        onClose={onCloseCheckIn}
                        loading={checkInLoading}
                        onCheckIn={onCheckIn}
                        checklist={currentHouse?.arrival_checklist}
                    />
                </ErrorBoundary>
            )}
        </>
    );
}
