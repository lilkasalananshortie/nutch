import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface NutchNotification {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
}

interface NotificationContextValue {
  notifications: NutchNotification[];
  unreadCount: number;
  addNotification: (title: string, body: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = "nutch.notification-inbox.v1";
const NotificationContext = createContext<NotificationContextValue | null>(null);

function loadStoredNotifications(): NutchNotification[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as NutchNotification[];
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState(loadStoredNotifications);

  const commit = useCallback((update: (current: NutchNotification[]) => NutchNotification[]) => {
    setNotifications((current) => {
      const next = update(current).slice(0, 30);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Inbox persistence is best-effort. */ }
      return next;
    });
  }, []);

  const addNotification = useCallback((title: string, body: string) => {
    const item: NutchNotification = {
      id: crypto.randomUUID(),
      title,
      body,
      createdAt: Date.now(),
      read: false,
    };
    commit((current) => [item, ...current]);
  }, [commit]);

  const markAllRead = useCallback(() => commit((current) => current.map((item) => ({ ...item, read: true }))), [commit]);
  const clearAll = useCallback(() => commit(() => []), [commit]);
  const unreadCount = notifications.reduce((count, item) => count + (item.read ? 0 : 1), 0);
  const value = useMemo(() => ({ notifications, unreadCount, addNotification, markAllRead, clearAll }), [notifications, unreadCount, addNotification, markAllRead, clearAll]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}
