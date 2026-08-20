import { Link } from "react-router-dom";
import { Icon } from "./Icon";
import styles from "./Breadcrumbs.module.css";

export interface Crumb {
  label: string;
  path?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className={styles.root}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className={styles.item}>
              {item.path && !isLast ? (
                <Link to={item.path} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={styles.current}>
                  {item.label}
                </span>
              )}
              {!isLast && <Icon name="chevron-right" size="xs" className={styles.separator} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
