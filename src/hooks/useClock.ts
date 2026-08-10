import { useEffect, useMemo, useState } from "react";
import type { AppSettings } from "../lib/native";

export function useClock(timeFormat: AppSettings["timeFormat"]) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeout = 0;
    const schedule = () => {
      const current = new Date();
      setNow(current);
      timeout = window.setTimeout(schedule, 60_000 - current.getSeconds() * 1_000 - current.getMilliseconds() + 20);
    };
    schedule();
    return () => window.clearTimeout(timeout);
  }, []);

  return useMemo(() => ({
    time: new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: timeFormat === "12h",
    }).format(now),
    date: new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(now),
  }), [now, timeFormat]);
}
