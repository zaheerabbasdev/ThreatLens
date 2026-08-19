import { useState } from "react";
import type { User } from "@/types";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { AccountStatusBadge } from "@/components/AccountStatusBadge";
import { Dropdown } from "@/components/Dropdown";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Modal } from "@/components/Modal";
import { EditProfileForm } from "@/components/EditProfileForm";
import { useUpdateUserRole, useUpdateUserStatus, useSetMfaEnabled } from "@/api/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { ROLE_LABEL } from "@/constants/roles";
import { ACCOUNT_STATUS_CONFIG, ACCOUNT_STATUS_ORDER } from "@/constants/accountStatus";
import { formatDate, formatRelativeTime } from "@/utils/format";
import type { Role, AccountStatus } from "@/types";
import styles from "./UserHeaderCard.module.css";

const ROLE_ORDER: Role[] = ["super_admin", "security_admin", "security_analyst", "viewer"];

export function UserHeaderCard({ user }: { user: User }) {
  const { user: currentUser } = useAuth();
  const canManage = usePermission("users:manage");
  const isSelf = currentUser?.id === user.id;
  const canEditProfile = canManage || isSelf;
  const canToggleMfa = canManage || isSelf;

  const [editOpen, setEditOpen] = useState(false);
  const updateRole = useUpdateUserRole(user.id);
  const updateStatus = useUpdateUserStatus(user.id);
  const setMfaEnabled = useSetMfaEnabled(user.id);

  return (
    <Card>
      <div className={styles.top}>
        <div className={styles.identity}>
          <Avatar name={user.name} seed={user.avatarSeed} size="lg" />
          <div className={styles.identityText}>
            <span className={styles.name}>{user.name}</span>
            {user.title && <span className={styles.titleLine}>{user.title}</span>}
            <span className={styles.email}>{user.email}</span>
          </div>
        </div>
        {canEditProfile && (
          <div className={styles.actions}>
            <Button variant="secondary" size="sm" iconLeft="user" onClick={() => setEditOpen(true)}>
              Edit profile
            </Button>
          </div>
        )}
      </div>

      <div className={styles.badgeRow}>
        {canManage ? (
          <Dropdown
            align="start"
            trigger={
              <span className={styles.dropdownTrigger}>
                <Badge tone={user.role === "super_admin" || user.role === "security_admin" ? "accent" : "neutral"}>
                  {ROLE_LABEL[user.role]}
                </Badge>
                <Icon name="chevron-down" size="xs" />
              </span>
            }
            items={ROLE_ORDER.map((role) => ({
              label: ROLE_LABEL[role],
              icon: "id-badge" as const,
              onSelect: () => updateRole.mutate(role),
            }))}
          />
        ) : (
          <Badge tone={user.role === "super_admin" || user.role === "security_admin" ? "accent" : "neutral"}>
            {ROLE_LABEL[user.role]}
          </Badge>
        )}

        {canManage ? (
          <Dropdown
            align="start"
            trigger={
              <span className={styles.dropdownTrigger}>
                <AccountStatusBadge status={user.status} />
                <Icon name="chevron-down" size="xs" />
              </span>
            }
            items={(ACCOUNT_STATUS_ORDER as AccountStatus[]).map((status) => ({
              label: ACCOUNT_STATUS_CONFIG[status].label,
              icon: ACCOUNT_STATUS_CONFIG[status].iconName,
              onSelect: () => updateStatus.mutate(status),
            }))}
          />
        ) : (
          <AccountStatusBadge status={user.status} />
        )}
      </div>

      {canToggleMfa && (
        <div className={styles.mfaRow}>
          <div className={styles.mfaText}>
            <span className={styles.mfaLabel}>
              <Icon name="shield-halved" size="sm" />
              Multi-factor authentication
            </span>
            <span className={styles.mfaHint}>
              {user.mfaEnabled
                ? "MFA is required at sign-in for this account."
                : "This account can sign in with a password alone."}
            </span>
          </div>
          <Checkbox
            label="Require MFA at sign-in"
            checked={user.mfaEnabled}
            onChange={(e) => setMfaEnabled.mutate(e.target.checked)}
          />
        </div>
      )}

      <div className={styles.footer}>
        <span>Joined {formatDate(user.createdAt)}</span>
        <span className={styles.timestamps}>
          <span>{user.lastActiveAt ? `Last active ${formatRelativeTime(user.lastActiveAt)}` : "Never signed in"}</span>
        </span>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
        <EditProfileForm
          userId={user.id}
          defaultValues={{ name: user.name, title: user.title }}
          onSuccess={() => setEditOpen(false)}
        />
      </Modal>
    </Card>
  );
}
