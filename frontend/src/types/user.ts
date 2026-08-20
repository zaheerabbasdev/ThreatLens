import type { ISODateString } from "./common";

export type Role = "super_admin" | "security_admin" | "security_analyst" | "viewer";

export type AccountStatus = "active" | "invited" | "suspended" | "deactivated";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "team" | "enterprise";
  createdAt: ISODateString;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  title?: string;
  avatarSeed: string;
  lastActiveAt?: ISODateString;
  createdAt: ISODateString;
  mfaEnabled: boolean;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: ISODateString;
}
