import { NavLink } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { NAV_SECTIONS } from "@/constants/nav";
import { useAuth } from "@/hooks/useAuth";
import { roleHasPermission } from "@/constants/roles";
import { cn } from "@/utils/cn";
import styles from "./Sidebar.module.css";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();

  return (
    <nav className={styles.root} aria-label="Primary">
      <div className={styles.brand}>
        <Logo />
      </div>
      <div className={styles.sections}>
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter(
            (item) => !item.permission || (user && roleHasPermission(user.role, item.permission)),
          );
          if (items.length === 0) return null;
          return (
            <div key={section.label} className={styles.section}>
              <p className={styles.sectionLabel}>{section.label}</p>
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) => cn(styles.link, isActive && styles.active)}
                >
                  <Icon name={item.icon} size="sm" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
