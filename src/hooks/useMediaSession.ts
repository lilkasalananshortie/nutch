import { useCallback, useEffect, useState } from "react";
import { native, type MediaStatus } from "../lib/native";

export function useMediaSession(active: boolean) {
  const [media, setMedia] = useState<MediaStatus | null>(null);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setMedia(await native.media());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void refresh();
    const timer = window.setInterval(refresh, 3_000);
    return () => window.clearInterval(timer);
  }, [active, refresh]);

  const control = useCallback(async (action: "toggle" | "next" | "previous") => {
    try {
      await native.controlMedia(action);
      window.setTimeout(() => void refresh(), 180);
    } catch {
      setError(true);
    }
  }, [refresh]);

  return { media, error, control };
}
