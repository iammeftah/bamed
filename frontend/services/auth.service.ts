/**
 * Admin auth. The browser only talks to our own Next.js routes:
 *   POST /api/auth/login   { phone, password } -> { user }   (sets the httpOnly cookie)
 *   GET  /api/auth/me                           -> user
 *   POST /api/auth/logout                       -> 204       (revokes the token, clears the cookie)
 * The Sanctum token lives only in that cookie, JavaScript can never read it.
 * There is no register endpoint: admin accounts are seeded in the backend.
 */
import { ApiError, apiFetch } from "@/lib/api/client";
import { mocksEnabled } from "@/lib/config";
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
  if (mocksEnabled) return mockMe();
  return toUser(await apiFetch<UserDto>("/me", { session: true }));
}

async function login(input: LoginInput): Promise<User> {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new ApiError(400, "Numéro de téléphone invalide.");
  const credentials = { phone, password: input.password };

  if (mocksEnabled) return mockLogin(credentials);
  const { user } = await apiFetch<{ user: UserDto }>("/login", {
    method: "POST",
    session: true,
    body: credentials,
  });
  return toUser(user);
}

async function logout(): Promise<void> {
  try {
    if (!mocksEnabled) {
      await apiFetch("/logout", { method: "POST", session: true });
    }
  } catch {
    /* the cookie is cleared server-side either way */
  } finally {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(MOCK_KEY);
    }
  }
}

export const authService = { login, logout, me };

/* ---------- Dev-only demo mode (no backend configured) ----------
 * 0600000000 / admin123 is the only account that works.
 * Disabled in production builds.
 */
const MOCK_KEY = "bamed.mock-user";

const MOCK_ADMIN: User = {
  id: "dev-admin",
  name: "Admin BAMED",
  phone: "+212600000000",
  role: "admin",
};

function mockGuard() {
  if (process.env.NODE_ENV === "production") {
    throw new ApiError(
      503,
      "Backend non configuré : définissez NEXT_PUBLIC_API_URL.",
    );
  }
}

async function mockLogin({ phone, password }: LoginInput): Promise<User> {
  mockGuard();
  if (phone !== MOCK_ADMIN.phone || password !== "admin123") {
    throw new ApiError(401, "Identifiants incorrects.");
  }
  window.localStorage.setItem(MOCK_KEY, JSON.stringify(MOCK_ADMIN));
  return MOCK_ADMIN;
}

async function mockMe(): Promise<User> {
  mockGuard();
  const raw = window.localStorage.getItem(MOCK_KEY);
  if (!raw) throw new ApiError(401, "Non connecté.");
  return JSON.parse(raw) as User;
}