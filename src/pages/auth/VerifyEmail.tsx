import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/Spinner";
import { services } from "@/services/mock";
import styles from "./AuthForm.module.css";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"checking" | "verified" | "failed">("checking");

  useEffect(() => {
    let cancelled = false;
    services.auth.verifyEmail(token).then((result) => {
      if (!cancelled) setStatus(result.verified ? "verified" : "failed");
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "checking") {
    return (
      <div className={styles.root}>
        <Spinner size="lg" label="Verifying your email" />
        <h1 className={styles.title} style={{ marginTop: "var(--space-4)" }}>
          Verifying your email…
        </h1>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={styles.root}>
        <div className={styles.errorIcon}>
          <Icon name="circle-xmark" size="lg" />
        </div>
        <h1 className={styles.title}>Verification failed</h1>
        <p className={styles.subtitle}>This verification link is invalid or has expired.</p>
        <Link to="/login" className={styles.link}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.successIcon}>
        <Icon name="circle-check" size="lg" />
      </div>
      <h1 className={styles.title}>Email verified</h1>
      <p className={styles.subtitle}>Your email address has been confirmed.</p>
      <Link to="/login" className={styles.link}>
        Continue to sign in
      </Link>
    </div>
  );
}
