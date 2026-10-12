const KEY = "bamed.auth";

export type Tokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

const empty: Tokens = { accessToken: null, refreshToken: null };

export function getTokens(): Tokens {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<Tokens>;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
    };
  } catch {
    return empty;
  }
}

export function setTokens(tokens: {
  accessToken: string;
  refreshToken?: string | null;
}) {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
      }),
    );
  } catch {
    /* storage unavailable: the session just won't persist */
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}