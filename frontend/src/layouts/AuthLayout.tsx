import { Outlet } from "react-router-dom";
import { Logo } from "@/components/Logo";
import styles from "./AuthLayout.module.css";

export function AuthLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.panel}>
        <header className={styles.brandRow}>
          <Logo size={32} />
        </header>
        <main className={styles.card}>
          <Outlet />
        </main>
      </div>
      <div className={styles.side} aria-hidden="true">
        <div className={styles.sideContent}>
          <p className={styles.sideEyebrow}>Threat Intelligence &amp; Response</p>
          <p className={styles.sideHeadline}>
            One workspace to detect, investigate, and respond — built for lean security
            teams.
          </p>
        </div>
      </div>
    </div>
  );
}
