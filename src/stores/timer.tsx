import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface TimerSession { id: string; label: string; running: boolean; paused: boolean; durationMs: number; startedAt: number; remainingMs: number; pinned?: boolean; }
interface TimerValue { sessions: TimerSession[]; session: TimerSession | null; start: (minutes: number, label?: string) => string; pause: (id?: string) => void; resume: (id?: string) => void; stop: (id?: string) => void; pin: (id: string) => void; }
const TimerContext = createContext<TimerValue | null>(null);
const KEY = "nutch.timer.v1";
function load(): TimerSession[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as TimerSession | TimerSession[] | null;
    const values = Array.isArray(raw) ? raw : raw ? [{ ...raw, id: "timer-legacy", label: "Timer" }] : [];
    return values.filter((value) => value && value.remainingMs > 0).map((value) => ({ ...value, id: value.id || crypto.randomUUID(), label: value.label || "Timer" }));
  } catch { return []; }
}
export function TimerProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<TimerSession[]>(load);
  useEffect(() => { try { if (sessions.length) localStorage.setItem(KEY, JSON.stringify(sessions)); else localStorage.removeItem(KEY); } catch { /* Timer state is recoverable in memory. */ } }, [sessions]);
  useEffect(() => {
    if (!sessions.some((session) => session.running && !session.paused)) return;
    const interval = window.setInterval(() => setSessions((current) => current.flatMap((session) => {
      if (!session.running || session.paused) return [session];
      const remainingMs = Math.max(0, session.durationMs - (Date.now() - session.startedAt));
      return remainingMs === 0 ? [] : [{ ...session, remainingMs }];
    })), 500);
    return () => window.clearInterval(interval);
  }, [sessions]);
  const start = useCallback((minutes: number, label = "Timer") => { const durationMs = Math.max(1, Math.min(24 * 60, minutes)) * 60_000; const id = crypto.randomUUID(); setSessions((current) => [...current, { id, label: label.trim() || "Timer", running: true, paused: false, durationMs, startedAt: Date.now(), remainingMs: durationMs }]); return id; }, []);
  const update = useCallback((id: string | undefined, updater: (session: TimerSession) => TimerSession | null) => setSessions((current) => { const target = id ?? current.find((session) => session.pinned)?.id ?? current[0]?.id; return current.flatMap((session) => session.id === target ? [updater(session)].filter((item): item is TimerSession => !!item) : [session]); }), []);
  const pause = useCallback((id?: string) => update(id, (session) => ({ ...session, paused: true, remainingMs: Math.max(0, session.durationMs - (Date.now() - session.startedAt)) })), [update]);
  const resume = useCallback((id?: string) => update(id, (session) => ({ ...session, paused: false, startedAt: Date.now() - (session.durationMs - session.remainingMs) })), [update]);
  const stop = useCallback((id?: string) => update(id, () => null), [update]);
  const pin = useCallback((id: string) => setSessions((current) => current.map((session) => ({ ...session, pinned: session.id === id ? !session.pinned : false }))), []);
  const session = sessions.find((item) => item.pinned) ?? sessions[0] ?? null;
  const value = useMemo(() => ({ sessions, session, start, pause, resume, stop, pin }), [sessions, session, start, pause, resume, stop, pin]);
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
export function useTimer() { const context = useContext(TimerContext); if (!context) throw new Error("useTimer must be used within TimerProvider"); return context; }
