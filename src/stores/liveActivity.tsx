import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ActivityKind = "notification" | "reminder" | "interaction" | "ai" | "focus" | "timer" | "media" | "volume" | "device" | "battery";
export type ActivityPriorityClass = "critical" | "important" | "user" | "active" | "background" | "idle";
export interface LiveActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  priority: number;
  expiresAt?: number;
  createdAt: number;
  priorityClass?: ActivityPriorityClass;
  persistent?: boolean;
  pinned?: boolean;
  interruptible?: boolean;
  source?: string;
  metadata?: Record<string, string | number | boolean>;
}

interface LiveActivityValue {
  current: LiveActivity | null;
  activities: LiveActivity[];
  push: (activity: Omit<LiveActivity, "createdAt">) => string;
  upsert: (activity: Omit<LiveActivity, "createdAt">) => void;
  remove: (id: string) => void;
  cycle: () => void;
  togglePinned: (id: string) => void;
}

const ActivityContext = createContext<LiveActivityValue | null>(null);

function choose(activities: LiveActivity[]) {
  return activities.slice().sort((a, b) => (b.priority + (b.pinned ? 15 : 0)) - (a.priority + (a.pinned ? 15 : 0)) || b.createdAt - a.createdAt)[0] ?? null;
}

export function LiveActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const prune = useCallback(() => {
    const now = Date.now();
    setActivities((current) => current.filter((item) => !item.expiresAt || item.expiresAt > now));
  }, []);
  useEffect(() => { const timer = window.setInterval(prune, 1000); return () => window.clearInterval(timer); }, [prune]);
  const push = useCallback((activity: Omit<LiveActivity, "createdAt">) => {
    const item = { ...activity, createdAt: Date.now() };
    setActivities((current) => [...current.filter((existing) => existing.id !== item.id), item]);
    if (item.expiresAt) window.setTimeout(prune, Math.max(0, item.expiresAt - Date.now()) + 25);
    return item.id;
  }, [prune]);
  const upsert = useCallback((activity: Omit<LiveActivity, "createdAt">) => {
    setActivities((current) => {
      const old = current.find((item) => item.id === activity.id);
      return [...current.filter((item) => item.id !== activity.id), { ...activity, createdAt: old?.createdAt ?? Date.now() }];
    });
  }, []);
  const remove = useCallback((id: string) => setActivities((current) => current.filter((item) => item.id !== id)), []);
  const cycle = useCallback(() => setSelectedId((selected) => {
    const ordered = activities.slice().sort((a, b) => (b.priority + (b.pinned ? 15 : 0)) - (a.priority + (a.pinned ? 15 : 0)) || b.createdAt - a.createdAt);
    if (ordered.length < 2) return selected;
    const index = Math.max(0, ordered.findIndex((item) => item.id === selected));
    return ordered[(index + 1) % ordered.length].id;
  }), [activities]);
  const togglePinned = useCallback((id: string) => setActivities((current) => current.map((item) => item.id === id ? { ...item, pinned: !item.pinned, persistent: true } : item)), []);
  const current = selectedId ? activities.find((item) => item.id === selectedId) ?? choose(activities) : choose(activities);
  const value = useMemo(() => ({ current, activities, push, upsert, remove, cycle, togglePinned }), [current, activities, push, upsert, remove, cycle, togglePinned]);
  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useLiveActivity() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error("useLiveActivity must be used within LiveActivityProvider");
  return context;
}
