import { useFocus } from "../stores/focus";
import { Icon } from "./ui/Icon";

function format(ms: number) { const total = Math.ceil(ms / 1_000); return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; }

export function FocusPanel({ onBack }: { onBack: () => void }) {
  const { session, start, pause, resume, stop } = useFocus();
  return <section className="focus-panel"><header className="panel-header"><button className="back-button" onClick={onBack} aria-label="Back to system controls"><Icon name="back" size="small" /></button><div><h1>Focus</h1><p>A quiet timer for one useful thing</p></div></header><div className="focus-face"><span><Icon name="focus" size="large" /></span><strong>{session ? format(session.remainingMs) : "00:00"}</strong><small>{session?.paused ? "Paused" : session ? "In focus" : "Ready when you are"}</small></div><div className="focus-presets">{[25, 45, 60].map((minutes) => <button key={minutes} onClick={() => start(minutes)}>{minutes} min</button>)}</div><div className="focus-actions">{session && <button onClick={session.paused ? resume : pause}>{session.paused ? "Resume" : "Pause"}</button>}{session && <button className="focus-stop" onClick={stop}>End</button>}</div></section>;
}
