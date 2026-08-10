import { useCallback, useEffect, useState } from "react";
import { native, type PlannerItem } from "../lib/native";

export function usePlanner() {
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setItems(await native.planner()); setError(null); } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const save = useCallback(async (item: PlannerItem) => {
    setItems((current) => [item, ...current.filter((existing) => existing.id !== item.id)].sort((a, b) => (a.scheduledAt ?? Number.MAX_SAFE_INTEGER) - (b.scheduledAt ?? Number.MAX_SAFE_INTEGER)));
    try { await native.savePlannerItem(item); } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); throw reason; }
  }, []);
  const remove = useCallback(async (id: string) => { setItems((current) => current.filter((item) => item.id !== id)); await native.deletePlannerItem(id).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason))); }, []);
  return { items, loading, error, load, save, remove };
}
