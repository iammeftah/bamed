/**
 * Auth endpoints expected from the backend:
 *   POST /auth/login     { email, password }        -> { accessToken, refreshToken?, user? }
 *   POST /auth/register  { name, email, password }  -> same
 *   POST /auth/refresh   { refreshToken }           -> { accessToken, refreshToken? }
 *   POST /auth/logout    { refreshToken }           -> 204
 *   GET  /auth/me                                   -> user
 * "token" is accepted instead of "accessToken", "ROLE_ADMIN" instead of "admin".
 * If your backend differs, adapt toUser / toSession below, nothing else.
 */
import { ApiError, apiFetch } from "@/lib/api/client";
import { mocksEnabled } from "@/lib/config";
import { clearSession, getTokens, setTokens } from "@/lib/auth/storage";
import type { LoginInput, RegisterInput, User } from "@/types/auth";

type UserDto = {
  id: string | number;
  name?: string;
  fullName?: string;
  username?: string;
  email: string;
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
  const raw = String(dto.role ?? dto.roles?.[0] ?? "customer")
    .replace(/^ROLE_/i, "")
    .toLowerCase();
  return {
    id: String(dto.id),
    name: dto.name ?? dto.fullName ?? dto.username ?? dto.email.split("@")[0],
    email: dto.email,
    role: raw === "admin" || raw === "manager" ? raw : "customer",
  };
}

async function establishSession(dto: SessionDto): Promise<User> {
  const accessToken = dto.accessToken ?? dto.token;
  if (!accessToken) throw new ApiError(502, "Réponse du serveur invalide.");
  setTokens({ accessToken, refreshToken: dto.refreshToken ?? null });
  return dto.user ? toUser(dto.user) : me();
}

async function me(): Promise<User> {
  if (mocksEnabled) return mockMe();
  return toUser(await apiFetch<UserDto>("/auth/me", { auth: true }));
}

async function login(input: LoginInput): Promise<User> {
  if (mocksEnabled) return mockLogin(input);
  const dto = await apiFetch<SessionDto>("/auth/login", {
    method: "POST",
    body: input,
  });
  return establishSession(dto);
}

async function register(input: RegisterInput): Promise<User> {
  if (mocksEnabled) return mockRegister(input);
  const dto = await apiFetch<SessionDto>("/auth/register", {
    method: "POST",
    body: input,
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

export const authService = { login, register, logout, me };

/* ---------- Dev-only demo mode (no backend configured) ----------
 * admin@bamed.ma / admin123 signs in as admin.
 * Any other email with a 6+ character password signs in as a customer.
 * Disabled in production builds.
 */
const MOCK_KEY = "bamed.mock-user";

function mockGuard() {
  if (process.env.NODE_ENV === "production") {
    throw new ApiError(
      503,
      "Backend non configuré : définissez NEXT_PUBLIC_API_URL.",
    );
  }
}

function mockSave(user: User): User {
  setTokens({ accessToken: `mock.${user.id}`, refreshToken: null });
  window.localStorage.setItem(MOCK_KEY, JSON.stringify(user));
  return user;
}

async function mockLogin({ email, password }: LoginInput): Promise<User> {
  mockGuard();
  const clean = email.trim().toLowerCase();
  if (clean === "admin@bamed.ma" && password === "admin123") {
    return mockSave({
      id: "dev-admin",
      name: "Admin BAMED",
      email: clean,
      role: "admin",
    });
  }
  if (password.length < 6) {
    throw new ApiError(401, "Identifiants incorrects.");
  }
  return mockSave({
    id: `dev-${clean}`,
    name: clean.split("@")[0],
    email: clean,
    role: "customer",
  });
}

async function mockRegister({ name, email }: RegisterInput): Promise<User> {
  mockGuard();
  const clean = email.trim().toLowerCase();
  return mockSave({
    id: `dev-${clean}`,
    name: name.trim() || clean.split("@")[0],
    email: clean,
    role: "customer",
  });
}

async function mockMe(): Promise<User> {
  mockGuard();
  const raw = window.localStorage.getItem(MOCK_KEY);
  if (!raw) throw new ApiError(401, "Non connecté.");
  return JSON.parse(raw) as User;
}