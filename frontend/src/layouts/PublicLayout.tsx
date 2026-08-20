import { Link, Outlet } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import styles from "./PublicLayout.module.css";

export function PublicLayout() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to="/" aria-label="ThreatLens home">
          <Logo />
        </Link>
        <div className={styles.actions}>
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Start free
            </Button>
          </Link>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
