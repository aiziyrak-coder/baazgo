import type { SiteNotification } from "../types";

const KEY = "baazgo_notifications_v1";

export const DEFAULT_NOTIFICATIONS: SiteNotification[] = [
  {
    id: "notif-1",
    title: "Xush kelibsiz!",
    message:
      "BaazGo ilovasiga xush kelibsiz. Eng yaxshi furgonlarni bron qiling.",
    read: false,
    type: "success",
    createdAt: new Date().toISOString(),
  },
  {
    id: "notif-2",
    title: "Yangi imkoniyatlar",
    message: "14 kunlik bronlar uchun 10% chegirma.",
    read: false,
    type: "info",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function loadStoredNotifications(): SiteNotification[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_NOTIFICATIONS;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as SiteNotification[];
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_NOTIFICATIONS;
}

export function persistNotifications(list: SiteNotification[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
