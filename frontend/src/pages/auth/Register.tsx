import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/Input";
import { Checkbox } from "@/components/Checkbox";
import { Button } from "@/components/Button";
import { AlertBanner } from "@/components/Alert";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/schemas/auth";
import styles from "./AuthForm.module.css";

export function Register() {
  const { register: registerAccount, logout } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setSubmitError(null);
    try {
      await registerAccount(values);
      await logout();
      navigate("/login", { replace: true });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unable to create your account.");
    }
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Create your workspace</h1>
      <p className={styles.subtitle}>Start monitoring threats in minutes — no credit card required.</p>

      {submitError && (
        <AlertBanner tone="danger" title="Registration failed" className={styles.formAlert}>
          {submitError}
        </AlertBanner>
      )}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Full name" autoComplete="name" required error={errors.name?.message} {...register("name")} />
        <Input
          label="Organization name"
          autoComplete="organization"
          required
          error={errors.organization?.message}
          {...register("organization")}
        />
        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 12 characters, with upper/lowercase, a number, and a symbol."
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Checkbox
          label="I agree to the Terms of Service and Privacy Policy"
          error={errors.acceptTerms?.message}
          {...register("acceptTerms")}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className={styles.footer}>
        Already have an account?{" "}
        <Link to="/login" className={styles.link}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
