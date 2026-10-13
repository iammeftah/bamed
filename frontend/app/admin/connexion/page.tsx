// frontend/app/admin/connexion/page.tsx
import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Connexion admin | BAMED" };

export default async function AdminConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AdminLoginForm next={safeNext(next)} />;
}