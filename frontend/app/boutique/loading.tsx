export default function BoutiqueLoading() {
  return (
    <main
      aria-busy="true"
      className="overflow-x-clip bg-background pb-20 pt-28 md:pb-28 md:pt-40"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <h1 className="font-display text-[length:clamp(4rem,14vw,11rem)] font-bold uppercase leading-[0.9]">
          Boutique
        </h1>
        <p className="sr-only" role="status">
          Chargement du catalogue…
        </p>

        <div className="mt-12 h-10 w-full max-w-md animate-pulse rounded-md bg-muted motion-reduce:animate-none" />

        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/5] animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}