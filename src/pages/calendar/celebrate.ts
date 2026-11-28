import confetti from 'canvas-confetti';

/** Confetti celebration for a new booking (skipped for users who prefer reduced motion). */
export function celebrateBooking(): void {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}
