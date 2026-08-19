import type { IconName } from "@/components/Icon";
import type { Permission } from "./roles";

export interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  permission?: Permission;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", path: "/app/dashboard", icon: "gauge-high" }],
  },
  {
    label: "Threat Intelligence",
    items: [
      {
        label: "IOC Overview",
        path: "/app/threat-intel",
        icon: "magnifying-glass-chart",
        permission: "ioc:read",
      },
      {
        label: "Threat Graph",
        path: "/app/threat-graph",
        icon: "diagram-project",
        permission: "threat_graph:read",
      },
      {
        label: "MITRE ATT&CK",
        path: "/app/mitre",
        icon: "chess-board",
        permission: "ioc:read",
      },
    ],
  },
  {
    label: "Response",
    items: [
      {
        label: "Incidents",
        path: "/app/incidents",
        icon: "fire",
        permission: "incidents:read",
      },
      {
        label: "Alerts",
        path: "/app/alerts",
        icon: "bell",
        permission: "alerts:read",
      },
      {
        label: "Investigations",
        path: "/app/investigations",
        icon: "magnifying-glass",
        permission: "investigations:read",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "AI Assistant",
        path: "/app/ai-assistant",
        icon: "wand-magic-sparkles",
      },
      {
        label: "Reports",
        path: "/app/reports",
        icon: "file-lines",
        permission: "reports:read",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users",
        path: "/app/users",
        icon: "users",
        permission: "users:read",
      },
      {
        label: "Audit Logs",
        path: "/app/audit-logs",
        icon: "clipboard-list",
        permission: "audit:read",
      },
      {
        label: "Settings",
        path: "/app/settings",
        icon: "gear",
        permission: "settings:read",
      },
    ],
  },
];
