export const config = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, ""),
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === "true",
} as const;

/** True when there is no backend to call: services then answer from local sample data. */
export const mocksEnabled = config.useMocks || !config.apiUrl;