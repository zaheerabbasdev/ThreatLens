import { StatusPage } from "./StatusPage";

export function Forbidden() {
  return (
    <StatusPage
      icon="lock"
      eyebrow="403"
      title="You don't have access to this page"
      description="Your role doesn't include permission for this section. Contact your organization admin if you believe this is a mistake."
      primaryAction={{ label: "Back to dashboard", to: "/app/dashboard" }}
    />
  );
}
