interface UpdateBannerProps {
  onReload: () => void
}

/**
 * Small fixed notice shown when a new service worker took control while the
 * user may be mid-form. Mounted outside the app's React tree from main.tsx, so
 * it must not depend on any provider.
 */
export default function UpdateBanner({ onReload }: UpdateBannerProps) {
  return (
    <div
      role="status"
      className="fixed inset-x-4 z-[10000] mx-auto flex max-w-md items-center justify-between gap-4 rounded bg-charcoal px-4 py-3 font-sans text-sm text-bone shadow-lg"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <span>Ný útgáfa er tilbúin.</span>
      <button
        type="button"
        onClick={onReload}
        className="rounded bg-amber px-3 py-1.5 font-medium text-charcoal transition-colors duration-200 hover:bg-amber-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-bone"
      >
        Endurhlaða
      </button>
    </div>
  )
}
