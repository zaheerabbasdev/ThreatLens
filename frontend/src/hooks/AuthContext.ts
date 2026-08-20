import { createContext } from "react";
import type { LoginInput, RegisterInput } from "@/services/auth.service";
import type { User } from "@/types";

export interface AuthContextValue {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-syncs the signed-in user from the source of truth — call after
   * editing your own profile/role/status/MFA so the whole app (e.g. the
   * topbar) reflects it immediately. */
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
