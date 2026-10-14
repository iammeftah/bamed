"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { ADMIN_HOME } from "@/lib/auth/redirect";
import { mocksEnabled } from "@/lib/config";

const inputClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring aria-[invalid=true]:border-destructive";

const labelClass = "block text-xs font-medium";

export function AdminLoginForm({ next }: { next: string }) {
  const { status, login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showDemo = mocksEnabled && process.env.NODE_ENV !== "production";

  // Signed in (already, or just now): go to the dashboard.
  // A full page load is used on purpose: the server then sees the new cookie,
  // and the client session state restarts from the real server answer.
  useEffect(() => {
    if (status === "authenticated") {
      window.location.assign(next || ADMIN_HOME);
    }
  }, [status, next]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await login({ phone, password });
      // Success: the effect above redirects. The button stays busy until then.
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Numéro ou mot de passe incorrect.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError(err.message);
      } else {
        // Never show raw server messages to the visitor
        setError("Connexion impossible. Réessayez dans un instant.");
      }
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-svh flex-col px-5 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <span className="font-display text-xl font-bold tracking-[0.3em]">
          BAMED
        </span>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour au site
        </Link>
      </div>

      <div className="mx-auto my-auto w-full max-w-sm py-10">
        <p className="mb-3 text-[13px] font-medium tracking-[0.4px] text-gold">
          Administration
        </p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.6px]">
          Connexion
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accès réservé à l&apos;équipe BAMED.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="phone" className={labelClass}>
              Téléphone
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="username"
              required
              maxLength={20}
              placeholder="06 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={Boolean(error)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className={labelClass}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={128}
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
                className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
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
            className="flex h-10 w-full items-center justify-between rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 disabled:opacity-60"
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
          <p className="mt-6 rounded-md border border-border bg-card px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Mode démo :{" "}
            <span className="font-medium text-foreground">0600000000</span> /{" "}
            <span className="font-medium text-foreground">admin123</span>
          </p>
        )}
      </div>
    </main>
  );
}