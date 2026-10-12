import { CtaButton } from "@/components/landing/cta-button";
import { Parallax } from "@/components/landing/parallax";
import { Reveal } from "@/components/landing/reveal";

export function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-neutral-950 py-20 text-white md:py-32">
      <Parallax
        decorative
        distance={-70}
        className="pointer-events-none absolute -bottom-[0.18em] left-1/2 -z-10 -translate-x-1/2 select-none font-display text-[length:clamp(6rem,32vw,28rem)] font-bold leading-none text-white/[0.05]"
      >
        BAMED
      </Parallax>

      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <Reveal>
          <h2 className="max-w-3xl font-display text-[length:clamp(2.5rem,8vw,6rem)] font-bold uppercase leading-[0.9]">
            Votre prochaine tenue favorite commence ici.
          </h2>
          <div className="mt-8">
            <CtaButton href="/boutique" variant="gold" arrow>
              Découvrir la collection
            </CtaButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}