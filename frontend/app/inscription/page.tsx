import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Créer un compte | BAMED" };

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="register" next={safeNext(next)} />;
}