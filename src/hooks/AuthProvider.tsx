import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { services } from "@/services/mock";
import type { LoginInput, RegisterInput } from "@/services/auth.service";
import type { AuthSession } from "@/types";
import { AuthContext, type AuthContextValue } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    services.auth.getSession().then((existing) => {
      if (cancelled) return;
      setSession(existing);
      setStatus(existing ? "authenticated" : "unauthenticated");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setError(null);
    try {
      const next = await services.auth.login(input);
      setSession(next);
      setStatus("authenticated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
      throw e;
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setError(null);
    try {
      const next = await services.auth.register(input);
      setSession(next);
      setStatus("authenticated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create account.");
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    await services.auth.logout();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const refreshUser = useCallback(async () => {
    const next = await services.auth.refreshSession();
    if (next) setSession(next);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, status, login, register, logout, refreshUser, error, clearError }),
    [session, status, login, register, logout, refreshUser, error, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
