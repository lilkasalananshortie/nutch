import { useCallback, useEffect, useState } from "react";
import { native, type QuickNote } from "../lib/native";

export function useQuickNotes() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void native.notes()
      .then((loaded) => { if (active) setNotes(loaded); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const save = useCallback(async (note: QuickNote) => {
    setError(null);
    setNotes((current) => [note, ...current.filter((item) => item.id !== note.id)].sort((a, b) => b.updatedAt - a.updatedAt));
    try {
      await native.saveNote(note);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      throw reason;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    const previous = notes;
    setNotes((current) => current.filter((note) => note.id !== id));
    setError(null);
    try {
      await native.deleteNote(id);
    } catch (reason) {
      setNotes(previous);
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }, [notes]);

  return { notes, loading, error, save, remove };
}
