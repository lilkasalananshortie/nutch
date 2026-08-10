import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ActivityKind = "notification" | "reminder" | "interaction" | "ai" | "focus" | "timer" | "media" | "volume" | "device" | "battery";
export interface LiveActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  priority: number;
  expiresAt?: number;
  createdAt: number;
}

interface LiveActivityValue {
  current: LiveActivity | null;
  activities: LiveActivity[];
  push: (activity: Omit<LiveActivity, "createdAt">) => string;
  upsert: (activity: Omit<LiveActivity, "createdAt">) => void;
  remove: (id: string) => void;
}

const ActivityContext = createContext<LiveActivityValue | null>(null);

function choose(activities: LiveActivity[]) {
  return activities.slice().sort((a, b) => b.priority - a.priority || b.createdAt - a.createdAt)[0] ?? null;
}

export function LiveActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const prune = useCallback(() => {
    const now = Date.now();
    setActivities((current) => current.filter((item) => !item.expiresAt || item.expiresAt > now));
  }, []);
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
  const value = useMemo(() => ({ current: choose(activities), activities, push, upsert, remove }), [activities, push, upsert, remove]);
  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useLiveActivity() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error("useLiveActivity must be used within LiveActivityProvider");
  return context;
}
