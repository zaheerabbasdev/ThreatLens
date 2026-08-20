import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { useUser } from "@/api/useUsers";
import { UserHeaderCard } from "./detail/UserHeaderCard";
import { UserActivityCard } from "./detail/UserActivityCard";
import { UserPermissionsCard } from "./detail/UserPermissionsCard";
import styles from "./UserProfile.module.css";

export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading, isError } = useUser(id);

  if (isLoading) {
    return (
      <div className={styles.root}>
        <Skeleton height={32} width="40%" />
        <Skeleton height={180} />
        <Skeleton height={240} />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <EmptyState
        icon="users"
        title="User not found"
        description="This user doesn't exist or may have been removed."
        action={
          <Link to="/app/users">
            <Button variant="secondary">Back to Users</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title={user.name}
        breadcrumbs={[{ label: "Users", path: "/app/users" }, { label: user.name }]}
      />

      <UserHeaderCard user={user} />

      <div className={styles.grid}>
        <div className={styles.main}>
          <UserActivityCard userId={user.id} />
        </div>
        <div className={styles.side}>
          <UserPermissionsCard role={user.role} />
        </div>
      </div>
    </div>
  );
}
