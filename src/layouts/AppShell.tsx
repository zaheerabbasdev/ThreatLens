import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Drawer } from "@/components/Drawer";
import styles from "./AppShell.module.css";

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className={styles.root}>
      {/* A plain div, not <aside> — the <nav aria-label="Primary"> inside
          Sidebar is already the real, labeled landmark here; wrapping it in
          an unlabeled <aside> would just add a second, indistinguishable
          "complementary" landmark for screen-reader users. */}
      <div className={styles.desktopSidebar}>
        <Sidebar />
      </div>

      <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Navigation" side="left">
        <Sidebar onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>

      <div className={styles.main}>
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
