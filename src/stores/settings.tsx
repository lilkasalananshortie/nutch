import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SETTINGS, native, type AppSettings } from "../lib/native";

interface SettingsContextValue {
  settings: AppSettings;
  ready: boolean;
  error: string | null;
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([native.loadSettings(), isEnabled()]).then(([stored, startup]) => {
      if (!active) return;
      const loaded = stored.status === "fulfilled" ? stored.value : DEFAULT_SETTINGS;
      const launchAtStartup = startup.status === "fulfilled" ? startup.value : loaded.launchAtStartup;
      setSettings({ ...DEFAULT_SETTINGS, ...loaded, launchAtStartup });
      setReady(true);
      if (stored.status === "rejected") setError("Settings could not be loaded; safe defaults are active.");
    });
    return () => { active = false; };
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const previous = settings;
    const next = { ...settings, ...patch, topOffset: Math.max(0, Math.min(30, patch.topOffset ?? settings.topOffset)) };
    setSettings(next);
    setError(null);
    try {
      if (patch.launchAtStartup !== undefined && patch.launchAtStartup !== settings.launchAtStartup) {
        await (patch.launchAtStartup ? enable() : disable());
      }
      await native.saveSettings(next);
    } catch (reason) {
      if (patch.launchAtStartup !== undefined && patch.launchAtStartup !== previous.launchAtStartup) {
        try {
          await (previous.launchAtStartup ? enable() : disable());
        } catch {
          // Keep the primary settings error visible; the status is re-read at next launch.
        }
      }
      setSettings(previous);
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }, [settings]);

  const value = useMemo(() => ({ settings, ready, error, update }), [settings, ready, error, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
