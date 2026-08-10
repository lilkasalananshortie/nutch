import type { SystemStats as Stats } from "../lib/native";

function Meter({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="stat-meter"><div><span>{label}</span><strong>{Math.round(value)}%</strong></div><div className="stat-track"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div><small>{detail}</small></div>;
}

export function SystemStats({ stats, error }: { stats: Stats | null; error: boolean }) {
  if (error) return <section className="stats-card media-empty"><span>System statistics unavailable</span></section>;
  return <section className="stats-card" aria-label="System performance">
    <Meter label="CPU" value={stats?.cpuPercent ?? 0} detail="Total processor use" />
    <Meter label="Memory" value={stats?.memoryPercent ?? 0} detail={stats ? `${stats.memoryUsedGb.toFixed(1)} of ${stats.memoryTotalGb.toFixed(1)} GB` : "Reading memory"} />
  </section>;
}
