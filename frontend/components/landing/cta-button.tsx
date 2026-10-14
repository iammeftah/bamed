import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  gold: "bg-gold text-gold-foreground hover:bg-gold/90",
  dark: "bg-foreground text-background hover:bg-foreground/90",
  light: "bg-white text-neutral-950 hover:bg-white/90",
  outline: "border border-white/60 text-white hover:border-white",
};

export function CtaButton({
  href = "#",
  children,
  variant = "gold",
  arrow = false,
  className,
}: {
  href?: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold whitespace-nowrap transition-colors active:scale-[0.98]",
        variants[variant],
        className,
      )}
    >
      {children}
      {arrow && <ArrowRight className="size-4" aria-hidden />}
    </Link>
  );
}