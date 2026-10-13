import { redirect } from "next/navigation";
import { ADMIN_HOME } from "@/lib/auth/redirect";

export default function AdminIndexPage() {
  redirect(ADMIN_HOME);
}