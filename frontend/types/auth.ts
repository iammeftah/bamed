// frontend/types/auth.ts
/**
 * Only the back office has accounts. Customers never sign in.
 * "super_admin" is the developer account (supervision dashboard).
 */
export type Role = "admin" | "super_admin";

export type User = {
  id: string;
  name: string;
  /** International format, e.g. +212612345678 */
  phone: string;
  role: Role;
};

export type LoginInput = { phone: string; password: string };