import { useClock } from "../hooks/useClock";
import type { AppSettings } from "../lib/native";

export function Clock({ format, expanded = false }: { format: AppSettings["timeFormat"]; expanded?: boolean }) {
  const { time, date } = useClock(format);
  return expanded ? (
    <div className="clock-expanded">
      <time>{time}</time>
      <span>{date}</span>
    </div>
  ) : <time className="clock-collapsed">{time}</time>;
}
