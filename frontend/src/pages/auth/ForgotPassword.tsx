import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { services } from "@/services";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth";
import styles from "./AuthForm.module.css";

export function ForgotPassword() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    await services.auth.requestPasswordReset(values.email);
    navigate(`/reset-password?email=${encodeURIComponent(values.email)}`, { replace: true });
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Reset your password</h1>
      <p className={styles.subtitle}>
        Enter your email and we'll send a six-digit reset code.
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
          Send reset code
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
