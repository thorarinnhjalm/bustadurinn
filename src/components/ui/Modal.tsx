import { useEffect, useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
    open: boolean;
    /** Called on Escape, backdrop click (when dismissible) and the close button */
    onClose: () => void;
    /** Rendered as the dialog heading and wired to aria-labelledby */
    title: string;
    /** Keep the heading for assistive tech but hide it visually */
    hideTitle?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** false = Escape and backdrop do NOT close; the close button is hidden too */
    dismissible?: boolean;
    showCloseButton?: boolean;
    footer?: ReactNode;
    /** Extra classes for the panel (the <dialog>) */
    className?: string;
    /** Extra classes for the scrolling content wrapper */
    bodyClassName?: string;
    /** Element to focus on open; default: first focusable in the body, else the dialog */
    initialFocusRef?: RefObject<HTMLElement | null>;
    children: ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-[24rem]',
    md: 'max-w-[28rem]',
    lg: 'max-w-[32rem]',
    xl: 'max-w-[48rem]',
    full:
        'max-w-none w-[calc(100%-2rem)] h-[calc(100dvh-2rem)] ' +
        'mt-[max(1rem,env(safe-area-inset-top))] mb-[max(1rem,env(safe-area-inset-bottom))] ' +
        'ml-[max(1rem,env(safe-area-inset-left))] mr-[max(1rem,env(safe-area-inset-right))]',
};

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
    open,
    onClose,
    title,
    hideTitle = false,
    size = 'md',
    dismissible = true,
    showCloseButton = true,
    footer,
    className = '',
    bodyClassName = '',
    initialFocusRef,
    children,
}: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const pressStartedOnBackdrop = useRef(false);

    // Keep latest callbacks/flags without re-running the open effect
    const onCloseRef = useRef(onClose);
    const dismissibleRef = useRef(dismissible);
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;

    // Open / close the native dialog
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!open || !dialog) return;

        // Remember the opener: the dialog element is removed from the DOM together with
        // this component, and a removed dialog does not restore focus by itself.
        const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        if (!dialog.open) dialog.showModal();

        // showModal focuses the first focusable element, which is the close button.
        // Prefer an explicit target, else the first focusable inside the body.
        const target =
            initialFocusRef?.current ??
            bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
            null;
        if (target) target.focus();

        return () => {
            if (dialog.open) dialog.close();
            if (opener && opener.isConnected && opener !== document.body) opener.focus();
        };
        // initialFocusRef is a stable ref object
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Escape -> cancel event
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!open || !dialog) return;
        const handleCancel = (e: Event) => {
            e.preventDefault();
            if (dismissibleRef.current) onCloseRef.current();
        };
        dialog.addEventListener('cancel', handleCancel);
        return () => dialog.removeEventListener('cancel', handleCancel);
    }, [open]);

    if (!open) return null;

    const isOutsidePanel = (e: React.PointerEvent<HTMLDialogElement>) => {
        if (e.target !== dialogRef.current) return false;
        const rect = dialogRef.current.getBoundingClientRect();
        return (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
        );
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
        pressStartedOnBackdrop.current = isOutsidePanel(e);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
        const startedOnBackdrop = pressStartedOnBackdrop.current;
        pressStartedOnBackdrop.current = false;
        if (startedOnBackdrop && isOutsidePanel(e) && dismissible) onClose();
    };

    const canClose = dismissible && showCloseButton;

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className={
                'm-auto w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] p-0 bg-white text-charcoal rounded-md shadow-xl ' +
                'backdrop:bg-charcoal/50 backdrop:backdrop-blur-sm open:flex open:flex-col overflow-hidden ' +
                `${SIZE_CLASSES[size]} ${className}`
            }
        >
            <div
                className={
                    hideTitle && !canClose
                        ? ''
                        : 'flex items-start justify-between gap-4 px-6 pt-5 pb-3 shrink-0'
                }
            >
                <h2
                    id={titleId}
                    className={
                        hideTitle
                            ? 'sr-only'
                            : 'font-serif text-xl font-semibold text-charcoal mb-0 pr-2'
                    }
                >
                    {title}
                </h2>
                {canClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Loka"
                        className="ml-auto -mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-stone-500 hover:text-charcoal hover:bg-stone-100 transition-colors"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                )}
            </div>
            <div
                ref={bodyRef}
                className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-6 ${bodyClassName}`}
            >
                {children}
            </div>
            {footer && (
                <div className="shrink-0 border-t border-stone-200 bg-white px-6 py-4 flex flex-wrap justify-end gap-3">
                    {footer}
                </div>
            )}
        </dialog>
    );
}
