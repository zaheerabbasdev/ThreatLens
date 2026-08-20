import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { EditProfileForm } from "@/components/EditProfileForm";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABEL } from "@/constants/roles";
import { formatDate } from "@/utils/format";
import styles from "./ProfileTab.module.css";

export function ProfileTab() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <Card>
        <div className={styles.summary}>
          <Avatar name={user.name} seed={user.avatarSeed} size="lg" />
          <div className={styles.summaryText}>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.email}>{user.email}</span>
            <div className={styles.meta}>
              <Badge tone="accent">{ROLE_LABEL[user.role]}</Badge>
              <span className={styles.since}>Member since {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display name &amp; title</CardTitle>
        </CardHeader>
        <p className={styles.hint}>
          This is how you appear to teammates across incidents, investigations, and audit history.
        </p>
        <EditProfileForm userId={user.id} defaultValues={{ name: user.name, title: user.title }} />
      </Card>
    </>
  );
}
