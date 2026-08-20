import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Input } from "./Input";
import { Button } from "./Button";
import { AlertBanner } from "./Alert";
import { useUpdateProfile } from "@/api/useUsers";
import { editProfileSchema, type EditProfileInput } from "@/schemas/user";
import styles from "./EditProfileForm.module.css";

export interface EditProfileFormProps {
  userId: string;
  defaultValues: { name: string; title?: string };
  onSuccess?: () => void;
  submitLabel?: string;
}

/** Shared name/title edit form — used both on a user's own Settings > Profile
 * tab and (for an admin editing someone else) on the Users profile page. */
export function EditProfileForm({ userId, defaultValues, onSuccess, submitLabel = "Save changes" }: EditProfileFormProps) {
  const updateProfile = useUpdateProfile(userId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { name: defaultValues.name, title: defaultValues.title ?? "" },
  });

  // Keep the form in sync if the underlying user record changes out from under it
  // (e.g. after a successful save invalidates and refetches).
  useEffect(() => {
    reset({ name: defaultValues.name, title: defaultValues.title ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues.name, defaultValues.title]);

  async function onSubmit(values: EditProfileInput) {
    await updateProfile.mutateAsync({ name: values.name, title: values.title || undefined });
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      {updateProfile.isError && (
        <AlertBanner tone="danger" title="Couldn't save changes" className={styles.alert}>
          {updateProfile.error instanceof Error ? updateProfile.error.message : "Something went wrong."}
        </AlertBanner>
      )}
      <div className={styles.fields}>
        <Input label="Full name" required error={errors.name?.message} {...register("name")} />
        <Input label="Title" placeholder="e.g. Security Analyst II" error={errors.title?.message} {...register("title")} />
      </div>
      <div className={styles.footer}>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
