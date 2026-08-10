import { useCallback, useEffect, useState } from "react";
import { native, type BatteryStatus } from "../lib/native";

export function useBattery() {
  const [battery, setBattery] = useState<BatteryStatus | null>(null);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setBattery(await native.battery());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  return { battery, error, refresh };
}
