// frontend/components/auth/admin-login-form.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { mocksEnabled } from "@/lib/config";

const inputClass =
  "h-11 w-full rounded-md bg-muted px-3.5 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:bg-foreground/[0.06] aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive";

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";

export function AdminLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const { status, login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showDemo = mocksEnabled && process.env.NODE_ENV !== "production";

  // Already signed in, or just signed in: go to the dashboard
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login({ phone, password });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? "Numéro ou mot de passe incorrect."
            : err.message,
        );
      } else {
        setError("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-svh flex-col bg-background px-5 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="BAMED, accueil"
          className="font-display text-2xl font-bold tracking-[0.3em]"
        >
          BAMED
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto my-auto w-full max-w-sm py-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          Administration
        </p>
        <h1 className="font-display text-5xl font-bold uppercase leading-[0.9] md:text-6xl">
          Connexion
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Accès réservé à l&apos;équipe BAMED.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label htmlFor="phone" className={labelClass}>
              Téléphone
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="username"
              required
              placeholder="06 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={Boolean(error)}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className={labelClass}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(error)}
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
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex h-11 w-full items-center justify-between rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 active:scale-[0.99] disabled:opacity-60"
          >
            Se connecter
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="size-4" aria-hidden />
            )}
          </button>
        </form>

        {showDemo && (
          <p className="mt-6 rounded-md bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Mode démo :{" "}
            <span className="font-semibold text-foreground">0600000000</span>{" "}
            /{" "}
            <span className="font-semibold text-foreground">admin123</span>
          </p>
        )}
      </div>
    </main>
  );
}