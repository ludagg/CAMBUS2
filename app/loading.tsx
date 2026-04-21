export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark"
    >
      <div className="flex flex-col items-center gap-4">
        <span className="relative flex size-12">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/30" />
          <span className="relative inline-flex size-12 rounded-full bg-primary/15 ring-1 ring-inset ring-primary/30 items-center justify-center">
            <span className="material-symbols-outlined text-primary">directions_bus</span>
          </span>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
          Chargement…
        </span>
      </div>
    </div>
  )
}
