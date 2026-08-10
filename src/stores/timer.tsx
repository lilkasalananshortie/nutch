import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface TimerSession { running: boolean; paused: boolean; durationMs: number; startedAt: number; remainingMs: number; }
interface TimerValue { session: TimerSession | null; start: (minutes: number) => void; pause: () => void; resume: () => void; stop: () => void; }
const TimerContext = createContext<TimerValue | null>(null);
const KEY = "nutch.timer.v1";
function load(): TimerSession | null { try { const value = JSON.parse(localStorage.getItem(KEY) ?? "null") as TimerSession | null; return value && value.remainingMs > 0 ? value : null; } catch { return null; } }
export function TimerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TimerSession | null>(load);
  useEffect(() => { try { if (session) localStorage.setItem(KEY, JSON.stringify(session)); else localStorage.removeItem(KEY); } catch { /* Timer state is recoverable in memory. */ } }, [session]);
  useEffect(() => {
    if (!session || !session.running || session.paused) return;
    const interval = window.setInterval(() => setSession((current) => { if (!current || current.paused) return current; const remainingMs = Math.max(0, current.durationMs - (Date.now() - current.startedAt)); return remainingMs === 0 ? null : { ...current, remainingMs }; }), 500);
    return () => window.clearInterval(interval);
  }, [session?.running, session?.paused, session?.startedAt, session?.durationMs]);
  const start = useCallback((minutes: number) => { const durationMs = Math.max(1, Math.min(24 * 60, minutes)) * 60_000; setSession({ running: true, paused: false, durationMs, startedAt: Date.now(), remainingMs: durationMs }); }, []);
  const pause = useCallback(() => setSession((current) => current ? { ...current, paused: true, remainingMs: Math.max(0, current.durationMs - (Date.now() - current.startedAt)) } : null), []);
  const resume = useCallback(() => setSession((current) => current ? { ...current, paused: false, startedAt: Date.now() - (current.durationMs - current.remainingMs) } : null), []);
  const stop = useCallback(() => setSession(null), []);
  const value = useMemo(() => ({ session, start, pause, resume, stop }), [session, start, pause, resume, stop]);
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
export function useTimer() { const context = useContext(TimerContext); if (!context) throw new Error("useTimer must be used within TimerProvider"); return context; }
