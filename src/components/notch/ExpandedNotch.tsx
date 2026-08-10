import { BatteryStatus } from "../BatteryStatus";
import { Clock } from "../Clock";
import { VolumeControl } from "../VolumeControl";
import { MediaControl } from "../MediaControl";
import { SystemStats } from "../SystemStats";
import { Icon } from "../ui/Icon";
import { useSystemStats } from "../../hooks/useSystemStats";
import { useSystemVolume } from "../../hooks/useSystemVolume";
import { useSettings } from "../../stores/settings";
import { useLiveActivity } from "../../stores/liveActivity";
import type { AppSettings, BatteryStatus as Battery, MediaStatus } from "../../lib/native";

interface ExpandedNotchProps {
  format: AppSettings["timeFormat"];
  battery: Battery | null;
  media: MediaStatus | null;
  mediaError: boolean;
  unreadCount: number;
  onSettings: () => void;
  onNotes: () => void;
  onNotifications: () => void;
  onPlanner: () => void;
  onSearch: () => void;
  onFocus: () => void;
  onTimer: () => void;
  onCapture: () => void;
  onVolumeActivity: (status: { volume: number; muted: boolean }) => void;
  onMediaControl: (action: "toggle" | "next" | "previous") => void;
}

export function ExpandedNotch({ format, battery, media, mediaError, unreadCount, onSettings, onNotes, onNotifications, onPlanner, onSearch, onFocus, onTimer, onCapture, onVolumeActivity, onMediaControl }: ExpandedNotchProps) {
  const volume = useSystemVolume(true, onVolumeActivity);
  const { settings } = useSettings();
  const { activities, current: activity, cycle, togglePinned } = useLiveActivity();
  const system = useSystemStats(settings.showSystemStats);
  return <div className="expanded-content island-layout">
    <div className="island-main">
      <header className="system-header"><Clock format={format} expanded /><BatteryStatus battery={battery} expanded /></header>
      {activities.length > 1 && activity && <div className="activity-stack"><button onClick={cycle} aria-label="Cycle active activities"><span>{activities.length} active</span><strong>{activity.title}</strong></button><button onClick={() => togglePinned(activity.id)} aria-label={activity.pinned ? "Unpin activity" : "Pin activity"}>{activity.pinned ? "Pinned" : "Pin"}</button></div>}
      <VolumeControl status={volume.status} error={volume.error} onVolume={(value) => void volume.setVolume(value)} onMute={() => void volume.toggleMute()} dragging={volume.dragging} />
      {settings.showMedia && (media?.available || mediaError) && <MediaControl media={media} error={mediaError} onControl={onMediaControl} />}
      {settings.showSystemStats && <SystemStats stats={system.stats} error={system.error} />}
    </div>
    <aside className="tool-rail" aria-label="Nutch tools">
      <button className="rail-button" onClick={onNotes} aria-label="Open Notes" title="Notes"><Icon name="notes" size="small" /></button>
      <button className="rail-button" onClick={onPlanner} aria-label="Open Planner" title="Planner"><Icon name="planner" size="small" /></button>
      <button className="rail-button" onClick={onSearch} aria-label="Open Search" title="Search"><Icon name="search" size="small" /></button>
      <button className="rail-button" onClick={onFocus} aria-label="Open Focus" title="Focus"><Icon name="focus" size="small" /></button>
      <button className="rail-button" onClick={onTimer} aria-label="Open Timer" title="Timer"><Icon name="timer" size="small" /></button>
      <button className="rail-button" onClick={onCapture} aria-label="Quick Capture" title="Quick Capture"><Icon name="plus" size="small" /></button>
      <button className="rail-button" onClick={onNotifications} aria-label="Open Notifications" title="Alerts"><Icon name="notifications" size="small" />{unreadCount > 0 && <b>{Math.min(unreadCount, 9)}</b>}</button>
      <button className="rail-button" onClick={onSettings} aria-label="Open Settings" title="Settings"><Icon name="settings" size="small" /></button>
    </aside>
  </div>;
}
