import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { AlertBanner } from "@/components/Alert";
import { services } from "@/services";
import { resetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth";
import styles from "./AuthForm.module.css";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [result, setResult] = useState<"success" | "failure" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    const response = await services.auth.resetPassword({ token, password: values.password });
    setResult(response.success ? "success" : "failure");
  }

  if (result === "success") {
    return (
      <div className={styles.root}>
        <div className={styles.successIcon}>
          <Icon name="circle-check" size="lg" />
        </div>
        <h1 className={styles.title}>Password updated</h1>
        <p className={styles.subtitle}>You can now sign in with your new password.</p>
        <Link to="/login" className={styles.link}>
          Go to sign in
        </Link>
      </div>
    );
  }

  if (result === "failure") {
    return (
      <div className={styles.root}>
        <div className={styles.errorIcon}>
          <Icon name="circle-xmark" size="lg" />
        </div>
        <h1 className={styles.title}>Link expired</h1>
        <p className={styles.subtitle}>This password reset link is invalid or has expired.</p>
        <Link to="/forgot-password" className={styles.link}>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Choose a new password</h1>
      <p className={styles.subtitle}>Your new password must be different from previous passwords.</p>

      {!token && (
        <AlertBanner tone="warning" title="Missing reset token" className={styles.formAlert}>
          This link is missing a reset token — request a new one if this happened unexpectedly.
        </AlertBanner>
      )}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 12 characters, with upper/lowercase, a number, and a symbol."
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </div>
  );
}
