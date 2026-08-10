import type { MediaStatus } from "../lib/native";
import { Icon } from "./ui/Icon";

function transportIcon(kind: "previous" | "play" | "pause" | "next") {
  if (kind === "previous") return <path d="M6 5h2v14H6V5Zm3 7 9-7v14l-9-7Z" />;
  if (kind === "next") return <path d="M16 5h2v14h-2V5ZM6 5l9 7-9 7V5Z" />;
  if (kind === "pause") return <path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" />;
  return <path d="m8 5 11 7-11 7V5Z" />;
}

function TransportButton({ kind, disabled, onClick, label }: { kind: "previous" | "play" | "pause" | "next"; disabled: boolean; onClick: () => void; label: string }) {
  return <button className="transport-button" disabled={disabled} onClick={onClick} aria-label={label}><svg viewBox="0 0 24 24" aria-hidden="true">{transportIcon(kind)}</svg></button>;
}

export function MediaControl({ media, error, onControl }: { media: MediaStatus | null; error: boolean; onControl: (action: "toggle" | "next" | "previous") => void }) {
  if (error) return <section className="media-card media-empty"><span>Media session unavailable</span></section>;
  if (!media?.available) return <section className="media-card media-empty"><span>No media playing</span><small>Start playback in a supported Windows app</small></section>;
  const progress = media.durationSeconds > 0 ? Math.min(100, media.positionSeconds / media.durationSeconds * 100) : 0;
  return <section className="media-card" aria-label="Windows media controls">
    <div className="media-art">{media.artworkDataUrl ? <img src={media.artworkDataUrl} alt="" /> : <Icon name="music" size="large" />}</div>
    <div className="media-details"><strong title={media.title}>{media.title || "Unknown title"}</strong><span title={media.artist}>{media.artist || media.source || "Windows media"}</span><div className="media-progress"><i style={{ width: `${progress}%` }} /></div></div>
    <div className="transport-controls"><TransportButton kind="previous" disabled={!media.canPrevious} onClick={() => onControl("previous")} label="Previous track" /><TransportButton kind={media.playing ? "pause" : "play"} disabled={!media.canToggle} onClick={() => onControl("toggle")} label={media.playing ? "Pause" : "Play"} /><TransportButton kind="next" disabled={!media.canNext} onClick={() => onControl("next")} label="Next track" /></div>
  </section>;
}
