import { Spinner } from "./Spinner";
import styles from "./PageLoader.module.css";

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className={styles.root}>
      <Spinner size="lg" label={label} />
    </div>
  );
}
