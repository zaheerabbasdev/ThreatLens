import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { Dropdown } from "@/components/Dropdown";
import { Badge } from "@/components/Badge";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { ROLE_LABEL } from "@/constants/roles";
import styles from "./Topbar.module.css";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const canViewUsers = usePermission("users:read");
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className={styles.root}>
      <button
        type="button"
        className={styles.menuButton}
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Icon name="bars" size="md" />
      </button>

      <div className={styles.spacer} />

      <Badge tone="accent" className={styles.roleBadge}>
        {ROLE_LABEL[user.role]}
      </Badge>

      <button type="button" className={styles.iconButton} aria-label="Notifications">
        <Icon name="bell" size="sm" />
      </button>

      <Dropdown
        align="end"
        ariaLabel={`Account menu for ${user.name}`}
        trigger={
          <span className={styles.userTrigger}>
            <Avatar name={user.name} seed={user.avatarSeed} size="sm" />
            <span className={styles.userName}>{user.name}</span>
            <Icon name="chevron-down" size="xs" />
          </span>
        }
        items={[
          ...(canViewUsers
            ? [
                {
                  label: "My profile",
                  icon: "circle-user" as const,
                  onSelect: () => navigate(`/app/users/${user.id}`),
                },
              ]
            : []),
          {
            label: "Settings",
            icon: "gear",
            onSelect: () => navigate("/app/settings"),
          },
          {
            label: "Sign out",
            icon: "right-from-bracket",
            tone: "danger",
            onSelect: () => {
              void logout().then(() => navigate("/login"));
            },
          },
        ]}
      />
    </header>
  );
}
