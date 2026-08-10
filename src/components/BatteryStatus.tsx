import type { BatteryStatus as Battery } from "../lib/native";
import { Icon } from "./ui/Icon";

export function BatteryStatus({ battery, expanded = false }: { battery: Battery | null; expanded?: boolean }) {
  if (!battery?.available || battery.percentage === null) {
    return expanded ? <span className="power-label">AC power</span> : null;
  }
  return (
    <div className={`battery ${expanded ? "battery-expanded" : ""}`} aria-label={`Battery ${battery.percentage} percent${battery.charging ? ", charging" : ""}`}>
      {battery.charging ? <Icon name="bolt" size="small" /> : <Icon name="battery" size="small" />}
      <span>{battery.percentage}%</span>
      {expanded && <small>{battery.charging ? "Charging" : battery.pluggedIn ? "Plugged in" : "On battery"}</small>}
    </div>
  );
}
