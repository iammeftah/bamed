import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Connexion | BAMED" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="login" next={safeNext(next)} />;
}