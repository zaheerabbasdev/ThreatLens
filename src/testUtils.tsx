import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/AuthProvider";
import { AUTH_SESSION_STORAGE_KEY } from "@/services/mock/auth.service.mock";
import { MOCK_USERS } from "@/mocks/identity";
import type { User } from "@/types";

/** Seeds an authenticated mock session in localStorage before rendering. */
export function signInAs(user: User = MOCK_USERS[0] as User) {
  window.localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      user,
      token: "test_token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }),
  );
}

export function renderWithProviders(ui: ReactElement, { route = "/" }: { route?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
