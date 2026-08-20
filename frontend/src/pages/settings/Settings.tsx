import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, type TabItem } from "@/components/Tabs";
import { ProfileTab } from "./tabs/ProfileTab";
import { OrganizationTab } from "./tabs/OrganizationTab";
import { SecurityTab } from "./tabs/SecurityTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { AppearanceTab } from "./tabs/AppearanceTab";
import { IntegrationsTab } from "./tabs/IntegrationsTab";
import styles from "./Settings.module.css";

const TABS: TabItem[] = [
  { id: "profile", label: "Profile" },
  { id: "organization", label: "Organization" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "integrations", label: "Integrations" },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className={styles.root}>
      <PageHeader title="Settings" subtitle="Manage your profile, organization, and workspace preferences." />

      <Tabs items={TABS} activeId={activeTab} onChange={setActiveTab} className={styles.tabs} />

      <div className={styles.tabPanel} role="tabpanel">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "organization" && <OrganizationTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "appearance" && <AppearanceTab />}
        {activeTab === "integrations" && <IntegrationsTab />}
      </div>
    </div>
  );
}
