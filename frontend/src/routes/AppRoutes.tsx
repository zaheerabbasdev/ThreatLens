import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppShell } from "@/layouts/AppShell";
import { PageLoader } from "@/components/PageLoader";
import { ComingSoon } from "@/pages/system/ComingSoon";
import { ProtectedRoute } from "./ProtectedRoute";
import { GuestRoute } from "./GuestRoute";
import { RequireRole } from "./RequireRole";
import { STUB_ROUTES } from "./stubRoutes";

const Landing = lazy(() => import("@/pages/public/Landing").then((m) => ({ default: m.Landing })));
const Login = lazy(() => import("@/pages/auth/Login").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("@/pages/auth/Register").then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() =>
  import("@/pages/auth/ForgotPassword").then((m) => ({ default: m.ForgotPassword })),
);
const ResetPassword = lazy(() =>
  import("@/pages/auth/ResetPassword").then((m) => ({ default: m.ResetPassword })),
);
const AcceptInvite = lazy(() =>
  import("@/pages/auth/AcceptInvite").then((m) => ({ default: m.AcceptInvite })),
);
const VerifyEmail = lazy(() =>
  import("@/pages/auth/VerifyEmail").then((m) => ({ default: m.VerifyEmail })),
);
const Dashboard = lazy(() =>
  import("@/pages/dashboard/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const IncidentsList = lazy(() =>
  import("@/pages/incidents/IncidentsList").then((m) => ({ default: m.IncidentsList })),
);
const IncidentDetail = lazy(() =>
  import("@/pages/incidents/IncidentDetail").then((m) => ({ default: m.IncidentDetail })),
);
const AlertsList = lazy(() => import("@/pages/alerts/AlertsList").then((m) => ({ default: m.AlertsList })));
const AlertDetail = lazy(() => import("@/pages/alerts/AlertDetail").then((m) => ({ default: m.AlertDetail })));
const IOCOverview = lazy(() =>
  import("@/pages/threatIntel/IOCOverview").then((m) => ({ default: m.IOCOverview })),
);
const IndicatorDetail = lazy(() =>
  import("@/pages/threatIntel/IndicatorDetail").then((m) => ({ default: m.IndicatorDetail })),
);
const ThreatGraph = lazy(() =>
  import("@/pages/threatGraph/ThreatGraph").then((m) => ({ default: m.ThreatGraph })),
);
const MitreBrowser = lazy(() =>
  import("@/pages/mitre/MitreBrowser").then((m) => ({ default: m.MitreBrowser })),
);
const MitreTechniqueDetail = lazy(() =>
  import("@/pages/mitre/MitreTechniqueDetail").then((m) => ({ default: m.MitreTechniqueDetail })),
);
const AIAssistant = lazy(() =>
  import("@/pages/aiAssistant/AIAssistant").then((m) => ({ default: m.AIAssistant })),
);
const InvestigationsList = lazy(() =>
  import("@/pages/investigations/InvestigationsList").then((m) => ({ default: m.InvestigationsList })),
);
const InvestigationDetail = lazy(() =>
  import("@/pages/investigations/InvestigationDetail").then((m) => ({ default: m.InvestigationDetail })),
);
const ReportsList = lazy(() => import("@/pages/reports/ReportsList").then((m) => ({ default: m.ReportsList })));
const ReportDetail = lazy(() => import("@/pages/reports/ReportDetail").then((m) => ({ default: m.ReportDetail })));
const UsersList = lazy(() => import("@/pages/users/UsersList").then((m) => ({ default: m.UsersList })));
const UserProfile = lazy(() => import("@/pages/users/UserProfile").then((m) => ({ default: m.UserProfile })));
const Settings = lazy(() => import("@/pages/settings/Settings").then((m) => ({ default: m.Settings })));
const AuditLogsList = lazy(() =>
  import("@/pages/auditLogs/AuditLogsList").then((m) => ({ default: m.AuditLogsList })),
);
const NotFound = lazy(() => import("@/pages/system/NotFound").then((m) => ({ default: m.NotFound })));
const Forbidden = lazy(() => import("@/pages/system/Forbidden").then((m) => ({ default: m.Forbidden })));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader label="Loading page" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
        </Route>

        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="incidents"
              element={
                <RequireRole permission="incidents:read">
                  <IncidentsList />
                </RequireRole>
              }
            />
            <Route
              path="incidents/:id"
              element={
                <RequireRole permission="incidents:read">
                  <IncidentDetail />
                </RequireRole>
              }
            />
            <Route
              path="alerts"
              element={
                <RequireRole permission="alerts:read">
                  <AlertsList />
                </RequireRole>
              }
            />
            <Route
              path="alerts/:id"
              element={
                <RequireRole permission="alerts:read">
                  <AlertDetail />
                </RequireRole>
              }
            />
            <Route
              path="threat-intel"
              element={
                <RequireRole permission="ioc:read">
                  <IOCOverview />
                </RequireRole>
              }
            />
            <Route
              path="threat-intel/:id"
              element={
                <RequireRole permission="ioc:read">
                  <IndicatorDetail />
                </RequireRole>
              }
            />
            <Route
              path="threat-graph"
              element={
                <RequireRole permission="threat_graph:read">
                  <ThreatGraph />
                </RequireRole>
              }
            />
            <Route
              path="mitre"
              element={
                <RequireRole permission="ioc:read">
                  <MitreBrowser />
                </RequireRole>
              }
            />
            <Route
              path="mitre/:id"
              element={
                <RequireRole permission="ioc:read">
                  <MitreTechniqueDetail />
                </RequireRole>
              }
            />
            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route
              path="investigations"
              element={
                <RequireRole permission="investigations:read">
                  <InvestigationsList />
                </RequireRole>
              }
            />
            <Route
              path="investigations/:id"
              element={
                <RequireRole permission="investigations:read">
                  <InvestigationDetail />
                </RequireRole>
              }
            />
            <Route
              path="reports"
              element={
                <RequireRole permission="reports:read">
                  <ReportsList />
                </RequireRole>
              }
            />
            <Route
              path="reports/:id"
              element={
                <RequireRole permission="reports:read">
                  <ReportDetail />
                </RequireRole>
              }
            />
            <Route
              path="users"
              element={
                <RequireRole permission="users:read">
                  <UsersList />
                </RequireRole>
              }
            />
            <Route
              path="users/:id"
              element={
                <RequireRole permission="users:read">
                  <UserProfile />
                </RequireRole>
              }
            />
            <Route
              path="settings"
              element={
                <RequireRole permission="settings:read">
                  <Settings />
                </RequireRole>
              }
            />
            <Route
              path="audit-logs"
              element={
                <RequireRole permission="audit:read">
                  <AuditLogsList />
                </RequireRole>
              }
            />
            <Route path="403" element={<Forbidden />} />
            {STUB_ROUTES.map((stub) => (
              <Route
                key={stub.path}
                path={stub.path}
                element={
                  stub.permission ? (
                    <RequireRole permission={stub.permission}>
                      <ComingSoon feature={stub.feature} phase="Coming in a later build phase" icon={stub.icon} />
                    </RequireRole>
                  ) : (
                    <ComingSoon feature={stub.feature} phase="Coming in a later build phase" icon={stub.icon} />
                  )
                }
              />
            ))}
          </Route>
        </Route>

        {/* Only unlayouted route in the app — StatusPage's own root isn't a
            <main>, since it's also rendered nested inside AppShell/AuthLayout
            (each of which already provides one). Give this standalone case
            its own landmark so a truly unmatched URL isn't a page with zero. */}
        <Route path="*" element={<main><NotFound /></main>} />
      </Routes>
    </Suspense>
  );
}
