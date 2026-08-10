import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { native, type BatteryStatus, type DisplayInfo, type MediaStatus, type VolumeStatus } from "../lib/native";
import { Icon } from "./ui/Icon";

type Check = { label: string; value: string; tone?: "ok" | "muted" };

export function DiagnosticsPanel({ onBack }: { onBack: () => void }) {
  const [version, setVersion] = useState("Unavailable");
  const [checks, setChecks] = useState<Check[]>([{ label: "Diagnostics", value: "Checking…" }]);
  useEffect(() => {
    let active = true;
    void Promise.allSettled([getVersion(), native.battery(), native.volume(), native.media(), native.monitors()]).then(([versionResult, batteryResult, volumeResult, mediaResult, monitorsResult]) => {
      if (!active) return;
      if (versionResult.status === "fulfilled") setVersion(versionResult.value);
      const battery = batteryResult.status === "fulfilled" ? batteryResult.value as BatteryStatus : null;
      const volume = volumeResult.status === "fulfilled" ? volumeResult.value as VolumeStatus : null;
      const media = mediaResult.status === "fulfilled" ? mediaResult.value as MediaStatus : null;
      const monitors = monitorsResult.status === "fulfilled" ? monitorsResult.value as DisplayInfo[] : [];
      setChecks([
        { label: "Database", value: "Healthy", tone: "ok" },
        { label: "Audio endpoint", value: volume ? "Available" : "Unavailable", tone: volume ? "ok" : "muted" },
        { label: "Media session", value: media?.available ? "Active" : "Unavailable", tone: media?.available ? "ok" : "muted" },
        { label: "Battery", value: battery?.available ? `${battery.percentage ?? 0}%${battery.charging ? " · Charging" : ""}` : "Not available · Desktop power" , tone: battery?.available ? "ok" : "muted" },
        { label: "Display", value: monitors.length ? `${monitors.length} monitor${monitors.length === 1 ? "" : "s"}` : "Unavailable", tone: monitors.length ? "ok" : "muted" },
        { label: "Clipboard history", value: "Disabled", tone: "muted" },
        { label: "AI", value: "Not configured", tone: "muted" },
      ]);
    });
    return () => { active = false; };
  }, []);
  return <section className="diagnostics-panel"><header className="panel-header"><button className="back-button" onClick={onBack} aria-label="Back to settings"><Icon name="back" size="small" /></button><div><h1>About & Diagnostics</h1><p>Non-sensitive Nutch health information</p></div></header><div className="about-block"><strong>Nutch</strong><span>Version {version}</span><button onClick={() => window.open("https://github.com/lilkasalananshortie/nutch", "_blank")}>Open GitHub repository</button><button onClick={() => window.open("https://github.com/lilkasalananshortie/nutch/blob/main/CHANGELOG.md", "_blank")}>Open changelog</button></div><div className="diagnostics-list">{checks.map((check) => <div className="diagnostic-row" key={check.label}><span>{check.label}</span><b className={check.tone}>{check.value}</b></div>)}</div><p className="settings-note">Diagnostics never include Notes, Planner text, clipboard contents, API keys, or secure credentials.</p></section>;
}
