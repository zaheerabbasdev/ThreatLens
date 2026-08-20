import { Link } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import styles from "./StatusPage.module.css";

export function ErrorPage() {
  return (
    <div className={styles.root}>
      <div className={styles.iconWrap}>
        <Icon name="triangle-exclamation" size="xl" />
      </div>
      <p className={styles.eyebrow}>Something went wrong</p>
      <h1 className={styles.title}>We hit an unexpected error</h1>
      <p className={styles.description}>
        This has been logged. Try reloading the page — if the problem continues, contact your
        organization admin.
      </p>
      <div className={styles.actions}>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
        <Link to="/">
          <Button variant="secondary">Go to homepage</Button>
        </Link>
      </div>
    </div>
  );
}
