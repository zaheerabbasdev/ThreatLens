import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { AlertBanner } from "@/components/Alert";
import { Icon } from "@/components/Icon";
import { useSetMfaEnabled, useChangePassword } from "@/api/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { changePasswordSchema, type ChangePasswordFormInput } from "@/schemas/user";
import styles from "./SecurityTab.module.css";

export function SecurityTab() {
  const { user } = useAuth();
  const setMfaEnabled = useSetMfaEnabled(user?.id ?? "");
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  if (!user) return null;

  async function onSubmit(values: ChangePasswordFormInput) {
    const result = await changePassword.mutateAsync({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    if (result.success) reset();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Multi-factor authentication</CardTitle>
        </CardHeader>
        <div className={styles.mfaRow}>
          <div className={styles.mfaText}>
            <span className={styles.mfaLabel}>
              <Icon name="shield-halved" size="sm" />
              {user.mfaEnabled ? "MFA is enabled" : "MFA is not enabled"}
            </span>
            <span className={styles.mfaHint}>
              {user.mfaEnabled
                ? "You'll be asked for a second factor at sign-in."
                : "Turn this on to require a second factor at sign-in."}
            </span>
          </div>
          <Checkbox
            label="Require MFA at sign-in"
            checked={user.mfaEnabled}
            onChange={(e) => setMfaEnabled.mutate(e.target.checked)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>

        {changePassword.isSuccess && changePassword.data?.success && (
          <AlertBanner tone="success" title="Password updated" className={styles.alert}>
            Your password has been changed.
          </AlertBanner>
        )}
        {(changePassword.isError || (changePassword.isSuccess && !changePassword.data?.success)) && (
          <AlertBanner tone="danger" title="Couldn't change password" className={styles.alert}>
            {changePassword.isError
              ? changePassword.error instanceof Error
                ? changePassword.error.message
                : "Something went wrong."
              : "Your current password wasn't correct."}
          </AlertBanner>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
          <div className={styles.fields}>
            <Input
              label="Current password"
              type="password"
              required
              error={errors.currentPassword?.message}
              {...register("currentPassword")}
            />
            <Input
              label="New password"
              type="password"
              required
              hint="At least 10 characters."
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <Input
              label="Confirm new password"
              type="password"
              required
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>
          <div className={styles.footer}>
            <Button type="submit" loading={isSubmitting}>
              Change password
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
