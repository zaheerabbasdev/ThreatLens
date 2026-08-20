import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { cn } from "@/utils/cn";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  interactive?: boolean;
}

export function Card({
  children,
  padded = true,
  interactive,
  className,
  onClick,
  onKeyDown,
  ...rest
}: CardProps) {
  // interactive + onClick means this div acts like a button — give it the
  // keyboard semantics a real button gets for free (role, focusability,
  // Enter/Space activation), not just the hover cursor.
  const isActivatable = interactive && Boolean(onClick);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (isActivatable && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick?.(event as unknown as MouseEvent<HTMLDivElement>);
    }
  }

  return (
    <div
      className={cn(styles.root, padded && styles.padded, interactive && styles.interactive, className)}
      onClick={onClick}
      onKeyDown={isActivatable ? handleKeyDown : onKeyDown}
      role={isActivatable ? "button" : undefined}
      tabIndex={isActivatable ? 0 : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(styles.header, className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  // Cards are the direct top-level sections beneath each page's <h1> (from
  // PageHeader), so their titles are <h2> — using <h3> skipped a level and
  // disoriented screen-reader users navigating by heading.
  return (
    <h2 className={cn(styles.title, className)} {...rest}>
      {children}
    </h2>
  );
}
