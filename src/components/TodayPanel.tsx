import { usePlanner } from "../hooks/usePlanner";
import { useFocus } from "../stores/focus";
import { useTimer } from "../stores/timer";
import { Icon } from "./ui/Icon";

function remaining(ms: number) { const total = Math.ceil(ms / 1000); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`; }
export function TodayPanel({ onBack }: { onBack: () => void }) {
  const { items } = usePlanner();
  const { session: focus } = useFocus();
  const { sessions } = useTimer();
  const next = items.filter((item) => !item.completed).sort((a, b) => (a.scheduledAt ?? Number.MAX_SAFE_INTEGER) - (b.scheduledAt ?? Number.MAX_SAFE_INTEGER))[0];
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart); tomorrow.setDate(tomorrow.getDate() + 1);
  const todayItems = items.filter((item) => !item.completed && item.scheduledAt !== null && item.scheduledAt >= todayStart.getTime() && item.scheduledAt < tomorrow.getTime());
  return <section className="today-panel"><header className="panel-header"><button className="back-button" onClick={onBack} aria-label="Back to system controls"><Icon name="back" size="small" /></button><div><h1>Today</h1><p>{new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(Date.now())}</p></div></header><div className="today-content"><div className="today-section"><span>BRIEFING</span><strong>{todayItems.length} {todayItems.length === 1 ? "task" : "tasks"}</strong><small>{focus ? "Focus is active." : next ? "Your next task is ready when you are." : "No scheduled tasks today."}</small></div>{focus && <div className="today-section"><span>FOCUS</span><strong>{remaining(focus.remainingMs)}</strong><small>{focus.paused ? "Paused" : "In progress"}</small></div>}{sessions.length > 0 && <div className="today-section"><span>TIMERS</span>{sessions.slice(0, 3).map((timer) => <div className="today-row" key={timer.id}><strong>{timer.label}</strong><small>{remaining(timer.remainingMs)}</small></div>)}</div>}<div className="today-section"><span>NEXT</span>{next ? <div className="today-next"><strong>{next.title}</strong>{next.scheduledAt && <small>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(next.scheduledAt)}</small>}</div> : <p className="notes-empty">No upcoming tasks.</p>}</div></div></section>;
}
