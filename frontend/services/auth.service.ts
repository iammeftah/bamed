/**
 * Admin auth. The browser only talks to our own Next.js routes:
 *   POST /api/auth/login   { phone, password } -> { user }   (sets the httpOnly cookie)
 *   GET  /api/auth/me                           -> user
 *   POST /api/auth/logout                       -> 204       (revokes the token, clears the cookie)
 * The Sanctum token lives only in that cookie, JavaScript can never read it.
 * There is no register endpoint: admin accounts are seeded in the backend.
 */
import { ApiError, apiFetch } from "@/lib/api/client";
import { normalizePhone } from "@/lib/auth/phone";
import type { LoginInput, User } from "@/types/auth";

type UserDto = {
  id: string | number;
  name?: string;
  phone?: string;
  role?: string;
};

function toUser(dto: UserDto): User {
  if (dto.role !== "admin") {
    throw new ApiError(403, "Accès réservé à l'administrateur.");
  }
  return {
    id: String(dto.id),
    name: dto.name ?? dto.phone ?? "",
    phone: dto.phone ?? "",
    role: "admin",
  };
}

async function me(): Promise<User> {
  return toUser(await apiFetch<UserDto>("/me", { session: true }));
}

async function login(input: LoginInput): Promise<User> {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new ApiError(400, "Numéro de téléphone invalide.");

  const { user } = await apiFetch<{ user: UserDto }>("/login", {
    method: "POST",
    session: true,
    body: { phone, password: input.password },
  });
  return toUser(user);
}

async function logout(): Promise<void> {
  try {
    await apiFetch("/logout", { method: "POST", session: true });
  } catch {
    /* the cookie is cleared server-side either way */
  }
}

export const authService = { login, logout, me };