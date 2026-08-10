import { useState } from "react";
import { usePlanner } from "../hooks/usePlanner";
import type { PlannerItem, PlannerSubtask } from "../lib/native";

function localInput(timestamp: number | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function fromInput(value: string) { return value ? new Date(value).getTime() : null; }
function normalize(item: PlannerItem): PlannerItem { return { ...item, tags: item.tags ?? [], subtasks: item.subtasks ?? [], durationMinutes: item.durationMinutes ?? null }; }

export function PlannerPanel({ onBack }: { onBack: () => void }) {
  const { items, loading, error, save, remove } = usePlanner();
  const [editing, setEditing] = useState<PlannerItem | null>(null);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const create = () => { const now = Date.now(); setSubtaskDraft(""); setEditing({ id: crypto.randomUUID(), title: "", description: "", scheduledAt: now + 3_600_000, reminderAt: now + 3_600_000, completed: false, createdAt: now, updatedAt: now, tags: [], durationMinutes: null, subtasks: [] }); };
  const commit = async () => { if (!editing?.title.trim()) return; await save({ ...normalize(editing), title: editing.title.trim(), tags: (editing.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 12), updatedAt: Date.now() }); setEditing(null); };
  const addSubtask = () => { const title = subtaskDraft.trim(); if (!title || !editing) return; const task: PlannerSubtask = { id: crypto.randomUUID(), title, completed: false }; setEditing({ ...editing, subtasks: [...(editing.subtasks ?? []), task] }); setSubtaskDraft(""); };
  const toggleSubtask = (taskId: string) => { if (!editing) return; setEditing({ ...editing, subtasks: (editing.subtasks ?? []).map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task) }); };
  return <section className="planner-panel">
    <header className="panel-header planner-header"><button className="back-button" onClick={onBack} aria-label="Back to system controls">←</button><div><h1>Planner</h1><p>Tasks and reminders, stored locally</p></div><button className="new-note-button planner-add" onClick={create} aria-label="Create planner task">＋</button></header>
    {editing && <div className="planner-editor"><input autoFocus placeholder="What needs doing?" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /><textarea placeholder="Details (optional)" value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /><label>Due <input type="datetime-local" value={localInput(editing.scheduledAt)} onChange={(event) => setEditing({ ...editing, scheduledAt: fromInput(event.target.value), reminderAt: fromInput(event.target.value) })} /></label><label>Tags <input placeholder="work, school" value={(editing.tags ?? []).join(", ")} onChange={(event) => setEditing({ ...editing, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} /></label><label>Estimate <input className="planner-duration" type="number" min="1" max="1440" placeholder="minutes" value={editing.durationMinutes ?? ""} onChange={(event) => setEditing({ ...editing, durationMinutes: event.target.value ? Number(event.target.value) : null })} /></label><div className="planner-subtasks"><span>Subtasks</span>{(editing.subtasks ?? []).map((task) => <label className="subtask-row" key={task.id}><input type="checkbox" checked={task.completed} onChange={() => toggleSubtask(task.id)} /><span className={task.completed ? "done" : ""}>{task.title}</span></label>)}<div className="subtask-add"><input placeholder="Add a subtask" value={subtaskDraft} onChange={(event) => setSubtaskDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSubtask(); } }} /><button onClick={addSubtask} disabled={!subtaskDraft.trim()}>Add</button></div></div><div className="planner-editor-actions"><button onClick={() => setEditing(null)}>Cancel</button><button className="primary-action" disabled={!editing.title.trim()} onClick={() => void commit()}>Save</button></div></div>}
    <div className="planner-list">
      {loading && <p className="notes-empty">Loading planner…</p>}
      {!loading && !editing && items.length === 0 && <div className="notes-empty"><span>◇</span><strong>No tasks yet</strong><small>Keep the next useful thing close.</small><button onClick={create}>New Task</button></div>}
      {items.map((raw) => { const item = normalize(raw); const doneSubtasks = item.subtasks?.filter((task) => task.completed).length ?? 0; return <article className={`planner-item ${item.completed ? "completed" : ""}`} key={item.id}><button className="planner-check" aria-label={item.completed ? "Mark task incomplete" : "Complete task"} onClick={() => void save({ ...item, completed: !item.completed, updatedAt: Date.now() })}>{item.completed ? "✓" : ""}</button><button className="planner-copy planner-open" onClick={() => { setSubtaskDraft(""); setEditing(item); }}><strong>{item.title}</strong>{item.scheduledAt && <time>{new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(item.scheduledAt)}</time>}{item.description && <p>{item.description}</p>}<span className="planner-meta">{item.durationMinutes ? `${item.durationMinutes} min` : ""}{item.tags?.length ? ` · ${item.tags.join(" · ")}` : ""}{item.subtasks?.length ? ` · ${doneSubtasks}/${item.subtasks.length} subtasks` : ""}</span></button><button className="planner-delete" aria-label={`Delete ${item.title}`} onClick={() => void remove(item.id)}>×</button></article>; })}
    </div>
    {error && <p className="inline-error">{error}</p>}
  </section>;
}
