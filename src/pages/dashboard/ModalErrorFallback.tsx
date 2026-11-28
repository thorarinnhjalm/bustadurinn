import Modal from '@/components/ui/Modal';

interface ModalErrorFallbackProps {
    open: boolean;
    onClose: () => void;
    message: string;
}

/** ErrorBoundary fallback shown when a lazily-rendered dashboard dialog crashes. */
export default function ModalErrorFallback({ open, onClose, message }: ModalErrorFallbackProps) {
    return (
        <Modal open={open} onClose={onClose} title="Villa kom upp" size="md">
            <div className="text-center">
                <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
                <p className="text-stone-600 mb-4">{message}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-primary"
                >
                    Loka
                </button>
            </div>
        </Modal>
    );
}
