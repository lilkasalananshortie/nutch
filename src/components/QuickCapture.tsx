import { useState } from "react";
import { useQuickNotes } from "../hooks/useQuickNotes";
import { usePlanner } from "../hooks/usePlanner";
import type { QuickNote, PlannerItem } from "../lib/native";

type CaptureKind = "note" | "task" | "reminder";
export function QuickCapture({ onBack }: { onBack: () => void }) {
  const { save: saveNote } = useQuickNotes();
  const { save: saveTask } = usePlanner();
  const [kind, setKind] = useState<CaptureKind>("note");
  const [text, setText] = useState("");
  const [due, setDue] = useState(() => { const date = new Date(Date.now() + 3_600_000); date.setSeconds(0, 0); return date.toISOString().slice(0, 16); });
  const save = async () => {
    const value = text.trim();
    if (!value) return;
    const now = Date.now();
    if (kind === "note") { const note: QuickNote = { id: crypto.randomUUID(), title: value.slice(0, 80), body: value, updatedAt: now, private: false }; await saveNote(note); }
    else { const scheduledAt = kind === "reminder" ? new Date(due).getTime() : null; const item: PlannerItem = { id: crypto.randomUUID(), title: value, description: "", scheduledAt, reminderAt: scheduledAt, completed: false, createdAt: now, updatedAt: now }; await saveTask(item); }
    onBack();
  };
  return <section className="capture-panel"><header className="panel-header"><button className="back-button" onClick={onBack} aria-label="Close Quick Capture">×</button><div><h1>Quick Capture</h1><p>Save a thought before it disappears.</p></div></header><textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} placeholder="What's on your mind?" onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") void save(); }} /><div className="capture-segmented" role="group" aria-label="Capture type">{(["note", "task", "reminder"] as CaptureKind[]).map((value) => <button key={value} className={kind === value ? "selected" : ""} onClick={() => setKind(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div>{kind === "reminder" && <label className="capture-due">Reminder time<input type="datetime-local" value={due} onChange={(event) => setDue(event.target.value)} /></label>}<button className="primary-button" disabled={!text.trim()} onClick={() => void save()}>Save {kind}</button><small className="capture-hint">Ctrl/Cmd + Enter to save</small></section>;
}
