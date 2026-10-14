import { ArrowUpRight, MapPin } from "lucide-react";

const LAT = 33.60562391950736;
const LNG = -7.5089421036553805;
const ZOOM = 16;
const TILE = 256;
const COLS = 5;
const ROWS = 3;

// Standard web-mercator tile maths: which tile holds the store, and where inside it
const n = 2 ** ZOOM;
const latRad = (LAT * Math.PI) / 180;
const xf = ((LNG + 180) / 360) * n;
const yf =
  ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
const x0 = Math.floor(xf);
const y0 = Math.floor(yf);

// Position of the store inside the tile grid, in pixels
const pinX = (xf - (x0 - Math.floor(COLS / 2))) * TILE;
const pinY = (yf - (y0 - Math.floor(ROWS / 2))) * TILE;

const tiles: { key: string; src: string }[] = [];
for (let dy = -Math.floor(ROWS / 2); dy <= Math.floor(ROWS / 2); dy++) {
  for (let dx = -Math.floor(COLS / 2); dx <= Math.floor(COLS / 2); dx++) {
    const x = x0 + dx;
    const y = y0 + dy;
    tiles.push({
      key: `${x}-${y}`,
      src: `https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png`,
    });
  }
}

const directionsHref = `https://www.google.com/maps/search/?api=1&query=${LAT},${LNG}`;

export function StoreMap({ className }: { className?: string }) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 ${className ?? ""}`}
    >
      {/* Tile wall, centred on the store */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 grid"
        style={{
          width: COLS * TILE,
          height: ROWS * TILE,
          gridTemplateColumns: `repeat(${COLS}, ${TILE}px)`,
          transform: `translate(${-pinX}px, ${-pinY}px)`,
        }}
      >
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={t.key}
            src={t.src}
            alt=""
            width={TILE}
            height={TILE}
            loading="lazy"
            draggable={false}
            className="block opacity-70 contrast-[0.9] grayscale dark:opacity-60 dark:invert"
          />
        ))}
      </div>

      {/* Soft paper edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,var(--background)_130%)]"
      />

      {/* Hand-drawn style ring + pin */}
      <div
        role="img"
        aria-label="Bamed Store, Sidi Bernoussi, Casablanca"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-foreground/50"
        />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-gold/50 motion-reduce:hidden"
        />
        <span className="relative flex size-10 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-[0_6px_20px_rgb(0_0_0/0.25)]">
          <MapPin className="size-5" aria-hidden />
        </span>
      </div>

      {/* Label */}
      <div className="absolute bottom-3 left-3 rounded-md bg-background/90 px-3 py-2 backdrop-blur">
        <p className="font-display text-xl font-bold uppercase leading-none tracking-[0.2em]">
          BAMED
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Sidi Bernoussi</p>
      </div>

      <a
        href={directionsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-3 top-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-semibold text-background transition-colors hover:bg-foreground/90"
      >
        Itinéraire
        <ArrowUpRight className="size-3.5" aria-hidden />
      </a>

      <p className="absolute bottom-3 right-3 text-[10px] text-muted-foreground">
        ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          OpenStreetMap
        </a>
      </p>
    </div>
  );
}