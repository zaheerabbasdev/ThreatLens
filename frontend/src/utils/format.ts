const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

const relativeFormatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

/** e.g. "3 hours ago". Falls back to "just now" for sub-minute deltas. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const deltaSeconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(deltaSeconds);

  if (abs < 60) return "just now";

  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (abs >= secondsInUnit) {
      return relativeFormatter.format(Math.round(deltaSeconds / secondsInUnit), unit);
    }
  }
  return relativeFormatter.format(Math.round(deltaSeconds / 60), "minute");
}

export function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function truncateMiddle(value: string, keep = 6): string {
  if (value.length <= keep * 2 + 3) return value;
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** "inc_1" → "INC-1", "alert_12" → "ALERT-12" — a stable, readable display ID. */
export function formatShortId(id: string): string {
  const [prefix, ...rest] = id.split("_");
  if (rest.length === 0) return id.toUpperCase();
  return `${prefix?.toUpperCase()}-${rest.join("_")}`;
}
