"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { mocksEnabled } from "@/lib/config";
import { images } from "@/lib/products";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const copy = {
  login: {
    title: "Connexion",
    intro: "Retrouvez vos commandes et vos favoris.",
    submit: "Se connecter",
    switchText: "Pas encore membre ?",
    switchLink: "Créer un compte",
    switchHref: "/inscription",
    eyebrow: "Espace membre",
    aside: "Content de vous revoir.",
    image: images.hero,
  },
  register: {
    title: "Créer un compte",
    intro: "Quelques secondes suffisent pour commencer.",
    submit: "Créer mon compte",
    switchText: "Déjà membre ?",
    switchLink: "Se connecter",
    switchHref: "/connexion",
    eyebrow: "Rejoindre BAMED",
    aside: "Votre style, votre rythme.",
    image: images.editorial,
  },
} as const;

const perks = [
  { icon: PackageCheck, label: "Suivi de vos commandes" },
  { icon: Heart, label: "Vos favoris sauvegardés" },
  { icon: RotateCcw, label: "Retours simplifiés" },
];

const formVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const inputClass =
  "h-11 w-full rounded-md bg-muted px-3.5 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:bg-foreground/[0.06] aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive";

const strengthLabels = ["Trop court", "Faible", "Correct", "Bon", "Excellent"];

function strengthOf(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  return score;
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <div id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </motion.div>
  );
}

export function AuthForm({ mode, next }: { mode: Mode; next: string }) {
  const t = copy[mode];
  const router = useRouter();
  const { status, login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const score = strengthOf(password);
  const showDemo =
    mode === "login" && mocksEnabled && process.env.NODE_ENV !== "production";

  // Already signed in, or just signed in: go to the destination
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setPending(true);

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors ?? {});
        setError(
          err.status === 401
            ? "Email ou mot de passe incorrect."
            : err.status === 409
              ? "Un compte existe déjà avec cet email."
              : err.message,
        );
      } else {
        setError("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setPending(false);
    }
  }

  const switchHref = `${t.switchHref}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Visual side: banner on mobile, full panel on desktop */}
      <aside className="relative isolate flex h-56 flex-col justify-between overflow-hidden bg-black p-5 text-white sm:h-64 lg:h-auto lg:min-h-svh lg:p-10">
        <motion.div
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease }}
          className="absolute inset-0 -z-10"
        >
          <ImagePlaceholder
            src={t.image.src}
            alt={t.image.alt}
            ratio="fill"
            label="Photo BAMED"
            kind="hero"
            tone="dark"
            sizes="(min-width:1024px) 52vw, 100vw"
            priority
          />
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/20 to-black/45"
        />

        <Link
          href="/"
          aria-label="BAMED, accueil"
          className="w-fit font-display text-2xl font-bold tracking-[0.3em]"
        >
          BAMED
        </Link>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            {t.eyebrow}
          </p>
          <h2 className="max-w-xl font-display text-4xl font-bold uppercase leading-[0.9] sm:text-5xl lg:text-7xl xl:text-8xl">
            {t.aside}
          </h2>
          <ul className="mt-8 hidden space-y-3 lg:block">
            {perks.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-sm text-white/80"
              >
                <Icon className="size-4 text-gold" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form side */}
      <section className="relative flex flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/boutique"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour à la boutique
          </Link>
          <ThemeToggle />
        </div>

        <div className="my-auto w-full max-w-sm py-10 lg:mx-auto">
          <h1 className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-6xl">
            {t.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{t.intro}</p>

          <motion.form
            onSubmit={onSubmit}
            variants={formVariants}
            initial="hidden"
            animate="show"
            className="mt-8 space-y-5"
          >
            {mode === "register" && (
              <Field id="name" label="Nom complet" error={fieldErrors.name}>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                  className={inputClass}
                />
              </Field>
            )}

            <Field id="email" label="Email" error={fieldErrors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className={inputClass}
              />
            </Field>

            <Field
              id="password"
              label="Mot de passe"
              error={fieldErrors.password}
              hint={
                mode === "register" ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-1" aria-hidden>
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-sm transition-colors",
                            i < score ? "bg-gold" : "bg-foreground/10",
                          )}
                        />
                      ))}
                    </div>
                    <p>
                      {password
                        ? `Sécurité : ${strengthLabels[score]}`
                        : "8 caractères minimum."}
                    </p>
                  </div>
                ) : undefined
              }
            >
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={mode === "register" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password
                      ? "password-error"
                      : mode === "register"
                        ? "password-hint"
                        : undefined
                  }
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-[18px]" aria-hidden />
                  ) : (
                    <Eye className="size-[18px]" aria-hidden />
                  )}
                </button>
              </div>
            </Field>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </div>
            )}

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={pending}
                className="flex h-11 w-full items-center justify-between rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 active:scale-[0.99] disabled:opacity-60"
              >
                {t.submit}
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <ArrowRight className="size-4" aria-hidden />
                )}
              </button>
            </motion.div>
          </motion.form>

          <div className="mt-8 space-y-3">
            <p className="text-xs text-muted-foreground">{t.switchText}</p>
            <Link
              href={switchHref}
              className="flex h-11 w-full items-center justify-center rounded-md bg-muted text-sm font-semibold transition-colors hover:bg-foreground/10"
            >
              {t.switchLink}
            </Link>
          </div>

          {showDemo && (
            <p className="mt-6 rounded-md bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              Mode démo : <span className="font-semibold text-foreground">admin@bamed.ma</span>{" "}
              / <span className="font-semibold text-foreground">admin123</span> pour un compte
              administrateur.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}