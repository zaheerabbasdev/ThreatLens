import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { AlertBanner } from "@/components/Alert";
import { services } from "@/services";
import { resetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth";
import styles from "./AuthForm.module.css";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const navigate = useNavigate();
  const [result, setResult] = useState<"success" | "failure" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    const response = await services.auth.resetPassword({ email, code: values.code, password: values.password });
    setResult(response.success ? "success" : "failure");
    if (response.success) navigate("/login", { replace: true });
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
      <h1 className={styles.title}>Reset your password</h1>
      <p className={styles.subtitle}>Enter the six-digit code sent to your email, then choose a new password.</p>

      {!email && (
        <AlertBanner tone="warning" title="Missing reset token" className={styles.formAlert}>
          This reset request is missing an email address. Request a new code.
        </AlertBanner>
      )}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Six-digit reset code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          error={errors.code?.message}
          {...register("code")}
        />
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
          Reset password
        </Button>
      </form>
      {email && (
        <Button type="button" variant="secondary" fullWidth onClick={() => services.auth.requestPasswordReset(email)}>
          Resend code
        </Button>
      )}
    </div>
  );
}
