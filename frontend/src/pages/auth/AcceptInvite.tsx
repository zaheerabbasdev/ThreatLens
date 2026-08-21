import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { AlertBanner } from "@/components/Alert";
import { services } from "@/services";
import { invitationPasswordSchema, type InvitationPasswordInput } from "@/schemas/auth";
import styles from "./AuthForm.module.css";

export function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InvitationPasswordInput>({ resolver: zodResolver(invitationPasswordSchema) });

  async function submit(values: InvitationPasswordInput) {
    setError(null);
    try {
      await services.auth.acceptInvitation({ token, password: values.password });
      navigate("/login", { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This invitation could not be accepted.");
    }
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Accept your invitation</h1>
      <p className={styles.subtitle}>Create a password to activate your ThreatLens account.</p>
      {error && <AlertBanner tone="danger" title="Invitation failed">{error}</AlertBanner>}
      {!token && <AlertBanner tone="warning" title="Missing invitation token">Use the invitation link from your email.</AlertBanner>}
      <form className={styles.form} onSubmit={handleSubmit(submit)} noValidate>
        <Input label="Password" type="password" autoComplete="new-password" required hint="At least 12 characters, with upper/lowercase, a number, and a symbol." error={errors.password?.message} {...register("password")} />
        <Input label="Confirm password" type="password" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <Button type="submit" fullWidth loading={isSubmitting} disabled={!token}>Activate account</Button>
      </form>
      <p className={styles.footer}><Link to="/login" className={styles.link}>Back to sign in</Link></p>
    </div>
  );
}
