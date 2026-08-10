import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface FocusSession { running: boolean; paused: boolean; durationMs: number; startedAt: number; remainingMs: number; }
interface FocusValue { session: FocusSession | null; start: (minutes: number) => void; pause: () => void; resume: () => void; stop: () => void; }
const FocusContext = createContext<FocusValue | null>(null);
const KEY = "nutch.focus.v1";
function load(): FocusSession | null { try { const value = JSON.parse(localStorage.getItem(KEY) ?? "null") as FocusSession | null; return value && value.remainingMs > 0 ? value : null; } catch { return null; } }
export function FocusProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<FocusSession | null>(load);
  useEffect(() => { try { if (session) localStorage.setItem(KEY, JSON.stringify(session)); else localStorage.removeItem(KEY); } catch { /* Focus can continue in memory. */ } }, [session]);
  useEffect(() => {
    if (!session || !session.running || session.paused) return;
    const timer = window.setInterval(() => setSession((current) => { if (!current || current.paused) return current; const remainingMs = Math.max(0, current.durationMs - (Date.now() - current.startedAt)); return remainingMs === 0 ? null : { ...current, remainingMs }; }), 500);
    return () => window.clearInterval(timer);
  }, [session?.running, session?.paused, session?.startedAt, session?.durationMs]);
  const start = useCallback((minutes: number) => { const durationMs = Math.max(1, Math.min(240, minutes)) * 60_000; setSession({ running: true, paused: false, durationMs, startedAt: Date.now(), remainingMs: durationMs }); }, []);
  const pause = useCallback(() => setSession((current) => current ? { ...current, paused: true, remainingMs: Math.max(0, current.durationMs - (Date.now() - current.startedAt)) } : null), []);
  const resume = useCallback(() => setSession((current) => current ? { ...current, paused: false, startedAt: Date.now() - (current.durationMs - current.remainingMs) } : null), []);
  const stop = useCallback(() => setSession(null), []);
  const value = useMemo(() => ({ session, start, pause, resume, stop }), [session, start, pause, resume, stop]);
  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}
export function useFocus() { const context = useContext(FocusContext); if (!context) throw new Error("useFocus must be used within FocusProvider"); return context; }
