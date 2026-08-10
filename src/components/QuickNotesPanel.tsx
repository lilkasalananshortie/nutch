import { useEffect, useRef, useState } from "react";
import { useQuickNotes } from "../hooks/useQuickNotes";
import type { QuickNote } from "../lib/native";

function notePreview(note: QuickNote) {
  const preview = note.body.trim().replace(/\s+/g, " ");
  return preview || "No additional text";
}

function NoteEditor({ note, onBack, onSave, onDelete }: { note: QuickNote; onBack: () => void; onSave: (note: QuickNote) => Promise<void>; onDelete: () => Promise<void> }) {
  const [draft, setDraft] = useState(note);
  const [saved, setSaved] = useState(true);
  const timer = useRef(0);
  const pending = useRef<QuickNote | null>(null);

  useEffect(() => () => {
    window.clearTimeout(timer.current);
    if (pending.current) void onSave(pending.current);
  }, [onSave]);
  const change = (patch: Partial<QuickNote>) => {
    const next = { ...draft, ...patch, updatedAt: Date.now() };
    setDraft(next);
    setSaved(false);
    pending.current = next;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void onSave(next).then(() => { pending.current = null; setSaved(true); }).catch(() => setSaved(false));
    }, 450);
  };
  const deleteNote = async () => {
    window.clearTimeout(timer.current);
    pending.current = null;
    await onSave(draft);
    await onDelete();
  };

  return (
    <div className="note-editor">
      <header className="notes-toolbar">
        <button className="notes-link" onClick={onBack} aria-label="Back to notes">‹ Notes</button>
        <span>{saved ? "Saved" : "Saving…"}</span>
        <button className="notes-link danger" onClick={() => void deleteNote()}>Delete</button>
      </header>
      <input className="note-title-input" maxLength={120} value={draft.title} placeholder="Title" onChange={(event) => change({ title: event.target.value })} />
      <time className="note-date">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(draft.updatedAt)}</time>
      <textarea autoFocus className="note-body-input" maxLength={20_000} value={draft.body} placeholder="Start typing…" onChange={(event) => change({ body: event.target.value })} />
    </div>
  );
}

export function QuickNotesPanel({ onBack }: { onBack: () => void }) {
  const { notes, loading, error, save, remove } = useQuickNotes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = notes.find((note) => note.id === selectedId);

  const createNote = async () => {
    const note: QuickNote = { id: crypto.randomUUID(), title: "", body: "", updatedAt: Date.now() };
    await save(note);
    setSelectedId(note.id);
  };
  if (selected) return <NoteEditor note={selected} onBack={() => setSelectedId(null)} onSave={save} onDelete={async () => { await remove(selected.id); setSelectedId(null); }} />;

  return (
    <section className="notes-panel">
      <header className="panel-header notes-header">
        <button className="back-button" onClick={onBack} aria-label="Back to system controls">←</button>
        <div><h1>Quick Notes</h1><p>Saved locally on this PC</p></div>
        <button className="new-note-button" onClick={() => void createNote()} aria-label="Create a new note">＋</button>
      </header>
      <div className="notes-list">
        {loading && <p className="notes-empty">Loading notes…</p>}
        {!loading && notes.length === 0 && <div className="notes-empty"><span>✎</span><strong>No notes yet</strong><small>Capture a thought without leaving Nutch.</small><button onClick={() => void createNote()}>New Note</button></div>}
        {notes.map((note) => (
          <button className="note-row" key={note.id} onClick={() => setSelectedId(note.id)}>
            <strong>{note.title.trim() || "New Note"}</strong>
            <span>{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(note.updatedAt)} · {notePreview(note)}</span>
          </button>
        ))}
      </div>
      {error && <p className="inline-error">{error}</p>}
    </section>
  );
}
