import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { native, type VolumeStatus } from "../lib/native";

export function useSystemVolume(active: boolean, onExternalChange?: (status: VolumeStatus) => void) {
  const [status, setStatus] = useState<VolumeStatus | null>(null);
  const [error, setError] = useState(false);
  const dragging = useRef(false);

  const refresh = useCallback(async () => {
    if (dragging.current) return;
    try {
      setStatus(await native.volume());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void native.startAudioEvents();
    void refresh();
    let unlisten: (() => void) | undefined;
    void listen<VolumeStatus>("system-volume-changed", ({ payload }) => {
      if (!dragging.current) {
        setStatus(payload);
        setError(false);
        onExternalChange?.(payload);
      }
    }).then((fn) => { unlisten = fn; });
    const recoveryTimer = window.setInterval(refresh, 15_000);
    return () => {
      unlisten?.();
      window.clearInterval(recoveryTimer);
    };
  }, [active, refresh, onExternalChange]);

  const setVolume = useCallback(async (volume: number) => {
    const bounded = Math.round(Math.max(0, Math.min(100, volume)));
    setStatus((current) => ({ volume: bounded, muted: current?.muted ?? false }));
    try {
      setStatus(await native.setVolume(bounded));
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  const toggleMute = useCallback(async () => {
    const muted = !(status?.muted ?? false);
    setStatus((current) => ({ volume: current?.volume ?? 0, muted }));
    try {
      setStatus(await native.setMuted(muted));
      setError(false);
    } catch {
      setError(true);
    }
  }, [status?.muted]);

  return { status, error, setVolume, toggleMute, dragging };
}
