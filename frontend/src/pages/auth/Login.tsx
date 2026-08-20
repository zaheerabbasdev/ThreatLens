import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/Input";
import { Checkbox } from "@/components/Checkbox";
import { Button } from "@/components/Button";
import { AlertBanner } from "@/components/Alert";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { DEMO_CREDENTIALS } from "@/mocks/identity";
import styles from "./AuthForm.module.css";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/app/dashboard";

  async function onSubmit(values: LoginInput) {
    setSubmitError(null);
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unable to sign in.");
    }
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Sign in</h1>
      <p className={styles.subtitle}>Access your organization's security workspace.</p>

      <div className={styles.demoHint}>
        Demo credentials — email <strong>{DEMO_CREDENTIALS.email}</strong>, password{" "}
        <strong>{DEMO_CREDENTIALS.password}</strong>
      </div>

      {submitError && (
        <AlertBanner tone="danger" title="Sign-in failed" className={styles.formAlert}>
          {submitError}
        </AlertBanner>
      )}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register("password")}
        />
        <div className={styles.row}>
          <Checkbox label="Remember me" {...register("remember")} />
          <Link to="/forgot-password" className={styles.link}>
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className={styles.footer}>
        Don't have an account?{" "}
        <Link to="/register" className={styles.link}>
          Create one
        </Link>
      </p>
    </div>
  );
}
