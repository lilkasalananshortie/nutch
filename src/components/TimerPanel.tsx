import { useState } from "react";
import { useTimer } from "../stores/timer";
import { Icon } from "./ui/Icon";

function formatRemaining(ms: number) { const total = Math.ceil(ms / 1000); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`; }
export function TimerPanel({ onBack }: { onBack: () => void }) {
  const { session, start, pause, resume, stop } = useTimer();
  const [custom, setCustom] = useState("20");
  return <section className="timer-panel"><header className="panel-header"><button className="back-button" onClick={onBack} aria-label="Back to system controls"><Icon name="back" size="small" /></button><div><h1>Timer</h1><p>Timestamp-based and sleep-safe</p></div></header>{session ? <div className="timer-active"><strong>{formatRemaining(session.remainingMs)}</strong><span>{session.paused ? "Paused" : "Running"}</span><div><button className="secondary-button" onClick={session.paused ? resume : pause}>{session.paused ? "Resume" : "Pause"}</button><button className="secondary-button" onClick={stop}>Stop</button></div></div> : <><div className="timer-presets">{[5, 20, 60].map((minutes) => <button key={minutes} onClick={() => start(minutes)}><strong>{minutes}</strong><small>minutes</small></button>)}</div><label className="timer-custom">Custom minutes<input type="number" min="1" max="1440" value={custom} onChange={(event) => setCustom(event.target.value)} /><button className="primary-button" onClick={() => start(Number(custom) || 20)}>Start</button></label></>}</section>;
}
