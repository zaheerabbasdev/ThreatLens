import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { services } from "@/services";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth";
import styles from "./AuthForm.module.css";

export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [devResetToken, setDevResetToken] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    const response = await services.auth.requestPasswordReset(values.email);
    setDevResetToken(response.devToken);
    setSent(true);
  }

  if (sent) {
    return (
      <div className={styles.root}>
        <div className={styles.successIcon}>
          <Icon name="circle-check" size="lg" />
        </div>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.subtitle}>
          If an account exists for that address, we've sent a link to reset your password.
        </p>
        {devResetToken && (
          <p className={styles.subtitle}>
            Local development reset link: {" "}
            <Link to={`/reset-password?token=${encodeURIComponent(devResetToken)}`} className={styles.link}>
              Continue to password reset
            </Link>
          </p>
        )}
        <Link to="/login" className={styles.link}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Reset your password</h1>
      <p className={styles.subtitle}>
        Enter the email associated with your account and we'll send a reset link.
      </p>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className={styles.footer}>
        <Link to="/login" className={styles.link}>
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
