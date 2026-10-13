// frontend/services/auth.service.ts
/**
 * Admin auth endpoints expected from the backend:
 *   POST /auth/login    { phone, password }  -> { accessToken, refreshToken?, user? }
 *   POST /auth/refresh  { refreshToken }     -> { accessToken, refreshToken? }
 *   POST /auth/logout   { refreshToken }     -> 204
 *   GET  /auth/me                            -> user
 * "phone" is sent in international format (+212612345678).
 * "token" is accepted instead of "accessToken", "ROLE_ADMIN" instead of "admin",
 * "phoneNumber" instead of "phone".
 * There is no register endpoint: the admin account is seeded in the backend.
 * If your backend differs, adapt toUser / establishSession below, nothing else.
 */
import { ApiError, apiFetch } from "@/lib/api/client";
import { mocksEnabled } from "@/lib/config";
import { normalizePhone } from "@/lib/auth/phone";
import { clearSession, getTokens, setTokens } from "@/lib/auth/storage";
import type { LoginInput, User } from "@/types/auth";

type UserDto = {
  id: string | number;
  name?: string;
  fullName?: string;
  username?: string;
  phone?: string;
  phoneNumber?: string;
  role?: string;
  roles?: string[];
};

type SessionDto = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: UserDto;
};

function toUser(dto: UserDto): User {
  const raw = String(dto.role ?? dto.roles?.[0] ?? "")
    .replace(/^ROLE_/i, "")
    .toLowerCase();
  if (raw !== "admin") {
    throw new ApiError(403, "Accès réservé à l'administrateur.");
  }
  const phone = dto.phone ?? dto.phoneNumber ?? "";
  return {
    id: String(dto.id),
    name: dto.name ?? dto.fullName ?? dto.username ?? phone,
    phone,
    role: "admin",
  };
}

async function establishSession(dto: SessionDto): Promise<User> {
  const accessToken = dto.accessToken ?? dto.token;
  if (!accessToken) throw new ApiError(502, "Réponse du serveur invalide.");
  setTokens({ accessToken, refreshToken: dto.refreshToken ?? null });
  try {
    return dto.user ? toUser(dto.user) : await me();
  } catch (e) {
    // Never keep a session that is not a valid admin one
    clearSession();
    throw e;
  }
}

async function me(): Promise<User> {
  if (mocksEnabled) return mockMe();
  return toUser(await apiFetch<UserDto>("/auth/me", { auth: true }));
}

async function login(input: LoginInput): Promise<User> {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new ApiError(400, "Numéro de téléphone invalide.");
  const credentials = { phone, password: input.password };

  if (mocksEnabled) return mockLogin(credentials);
  const dto = await apiFetch<SessionDto>("/auth/login", {
    method: "POST",
    body: credentials,
  });
  return establishSession(dto);
}

async function logout(): Promise<void> {
  try {
    const { refreshToken } = getTokens();
    if (!mocksEnabled && refreshToken) {
      await apiFetch("/auth/logout", {
        method: "POST",
        auth: true,
        body: { refreshToken },
      });
    }
  } catch {
    /* the local session is cleared either way */
  } finally {
    clearSession();
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
  setTokens({ accessToken: `mock.${MOCK_ADMIN.id}`, refreshToken: null });
  window.localStorage.setItem(MOCK_KEY, JSON.stringify(MOCK_ADMIN));
  return MOCK_ADMIN;
}

async function mockMe(): Promise<User> {
  mockGuard();
  const raw = window.localStorage.getItem(MOCK_KEY);
  if (!raw) throw new ApiError(401, "Non connecté.");
  return JSON.parse(raw) as User;
}