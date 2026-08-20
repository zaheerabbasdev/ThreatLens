import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { AlertBanner } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import { useOrganization, useUpdateOrganizationName } from "@/api/useUsers";
import { usePermission } from "@/hooks/usePermission";
import { organizationNameSchema, type OrganizationNameInput } from "@/schemas/user";
import { formatDate } from "@/utils/format";
import styles from "./OrganizationTab.module.css";

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter",
  team: "Team",
  enterprise: "Enterprise",
};

export function OrganizationTab() {
  const canManage = usePermission("settings:manage");
  const { data: organization, isLoading } = useOrganization();
  const updateName = useUpdateOrganizationName();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrganizationNameInput>({
    resolver: zodResolver(organizationNameSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (organization) reset({ name: organization.name });
  }, [organization, reset]);

  async function onSubmit(values: OrganizationNameInput) {
    await updateName.mutateAsync(values.name);
  }

  if (isLoading || !organization) {
    return (
      <Card>
        <Skeleton height={20} width="40%" />
        <Skeleton height={40} />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
      </CardHeader>

      <div className={styles.meta}>
        <Badge tone="neutral">{PLAN_LABEL[organization.plan] ?? organization.plan}</Badge>
        <span className={styles.since}>Workspace created {formatDate(organization.createdAt)}</span>
      </div>

      {updateName.isError && (
        <AlertBanner tone="danger" title="Couldn't save organization name" className={styles.alert}>
          {updateName.error instanceof Error ? updateName.error.message : "Something went wrong."}
        </AlertBanner>
      )}

      {canManage ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
          <div className={styles.fields}>
            <Input label="Organization name" required error={errors.name?.message} {...register("name")} />
          </div>
          <div className={styles.footer}>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.readonly}>
          <span className={styles.readonlyLabel}>Organization name</span>
          <span className={styles.readonlyValue}>{organization.name}</span>
          <p className={styles.readonlyHint}>Only Security Admins and Super Admins can rename the organization.</p>
        </div>
      )}
    </Card>
  );
}
