export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background"
    >
      <span className="animate-pulse font-display text-3xl font-bold tracking-[0.3em] motion-reduce:animate-none">
        BAMED
      </span>
      <span
        aria-hidden
        className="h-px w-24 animate-pulse bg-gold motion-reduce:animate-none"
      />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}