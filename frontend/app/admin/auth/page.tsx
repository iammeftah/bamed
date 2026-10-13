import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Connexion" };

export default async function AdminAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const value = Array.isArray(next) ? next[0] : next;
  return <AdminLoginForm next={safeNext(value)} />;
}