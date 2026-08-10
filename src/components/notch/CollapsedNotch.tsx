import { BatteryStatus } from "../BatteryStatus";
import { Clock } from "../Clock";
import { Icon } from "../ui/Icon";
import type { AppSettings, BatteryStatus as Battery, MediaStatus } from "../../lib/native";
import type { LiveActivity } from "../../stores/liveActivity";

function CompactMedia({ media }: { media: MediaStatus }) {
  const progress = media.durationSeconds > 0 ? Math.min(100, media.positionSeconds / media.durationSeconds * 100) : 0;
  return <div className="compact-media" aria-label={`Now playing ${media.title}${media.artist ? ` by ${media.artist}` : ""}`}>
    <span className="compact-media-art">{media.artworkDataUrl ? <img src={media.artworkDataUrl} alt="" /> : <Icon name="music" size="small" />}</span>
    <span className="compact-media-copy"><strong title={media.title}>{media.title || "Unknown title"}</strong><small title={media.artist}>{media.artist || media.source || "Now playing"}</small></span>
    {media.playing && <span className="equalizer" aria-label="Playing"><i /><i /><i /></span>}
    <span className="compact-media-progress" aria-hidden="true"><i style={{ width: `${progress}%` }} /></span>
  </div>;
}

export function CollapsedNotch({ format, battery, unreadCount, activity, media, minimalIdle }: { format: AppSettings["timeFormat"]; battery: Battery | null; unreadCount: number; activity: LiveActivity | null; media: MediaStatus | null; minimalIdle: boolean }) {
  const showMedia = !!media?.available && (!activity || activity.kind === "media");
  return <div className="collapsed-content">
    <div className="collapsed-context">{activity && activity.kind !== "media" ? <><span className="context-mark" /><span className="collapsed-activity"><strong>{activity.title}</strong>{activity.detail && <small>{activity.detail}</small>}</span></> : showMedia ? <CompactMedia media={media} /> : <span className="context-mark idle-mark" />}</div>
    <div className="collapsed-time"><Clock format={format} /></div>
    <div className="collapsed-status">{!minimalIdle && unreadCount > 0 && <span className="unread-pill" aria-label={`${unreadCount} unread notifications`}>{Math.min(unreadCount, 9)}</span>}{!minimalIdle && <BatteryStatus battery={battery} />}</div>
  </div>;
}
