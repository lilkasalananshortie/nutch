import { useCallback, useEffect, useState } from "react";
import { native, type SystemStats } from "../lib/native";

export function useSystemStats(active: boolean) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setStats(await native.systemStats());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void refresh();
    const timer = window.setInterval(refresh, 2_000);
    return () => window.clearInterval(timer);
  }, [active, refresh]);

  return { stats, error };
}
