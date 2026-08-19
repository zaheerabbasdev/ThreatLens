import { StatusPage } from "./StatusPage";

export function NotFound() {
  return (
    <StatusPage
      icon="magnifying-glass"
      eyebrow="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved."
      primaryAction={{ label: "Back to dashboard", to: "/app/dashboard" }}
      secondaryAction={{ label: "Go to homepage", to: "/" }}
    />
  );
}
