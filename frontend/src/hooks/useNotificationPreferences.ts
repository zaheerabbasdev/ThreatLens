import { useCallback, useState } from "react";

export interface NotificationPreferences {
  criticalAlerts: boolean;
  incidentAssigned: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
}

const STORAGE_KEY = "threatlens.notification_preferences";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  criticalAlerts: true,
  incidentAssigned: true,
  weeklyDigest: true,
  productUpdates: false,
};

function readPreferences(): NotificationPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<NotificationPreferences>) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Notification preferences have no backend yet — there's no notification
 * delivery system in Phase 1 to configure, so this persists to localStorage
 * only, scoped to this browser. That's disclosed in the UI rather than
 * implied to sync anywhere.
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(readPreferences);

  const setPreference = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { preferences, setPreference };
}
