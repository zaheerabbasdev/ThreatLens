import { clsx, type ClassValue } from "clsx";

/** Thin wrapper so class-name composition reads consistently across components. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
