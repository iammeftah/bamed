// frontend/types/auth.ts
/** Only the back office has accounts. Customers never sign in. */
export type Role = "admin";

export type User = {
  id: string;
  name: string;
  /** International format, e.g. +212612345678 */
  phone: string;
  role: Role;
};

export type LoginInput = { phone: string; password: string };