export type Role = "admin" | "manager" | "customer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type LoginInput = { email: string; password: string };
export type RegisterInput = { name: string; email: string; password: string };