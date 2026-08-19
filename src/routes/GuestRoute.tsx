import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/PageLoader";

/** Sends already-authenticated users away from auth pages (login/register/etc). */
export function GuestRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return <PageLoader label="Loading" />;
  }

  if (status === "authenticated") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
