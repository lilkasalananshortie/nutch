import type { CSSProperties, MutableRefObject } from "react";
import type { VolumeStatus } from "../lib/native";

function VolumeIcon({ muted }: { muted: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" />{muted ? <path d="m17 9 4 4m0-4-4 4" className="stroke" /> : <path d="M16 8.5c1.8 1.8 1.8 5.2 0 7" className="stroke" />}</svg>;
}

export function VolumeControl({ status, error, onVolume, onMute, dragging }: {
  status: VolumeStatus | null;
  error: boolean;
  onVolume: (value: number) => void;
  onMute: () => void;
  dragging: MutableRefObject<boolean>;
}) {
  const value = status?.volume ?? 0;
  return (
    <section className="volume-section" aria-label="Windows master volume">
      <div className="section-heading"><span>Volume</span><strong>{error ? "Unavailable" : `${value}%`}</strong></div>
      <div className="volume-row">
        <button className={`icon-button ${status?.muted ? "is-active" : ""}`} onClick={onMute} disabled={error} aria-label={status?.muted ? "Unmute Windows audio" : "Mute Windows audio"}>
          <VolumeIcon muted={status?.muted ?? false} />
        </button>
        <input
          aria-label="Windows master volume"
          type="range"
          min="0"
          max="100"
          value={value}
          disabled={error}
          style={{ "--volume": `${value}%` } as CSSProperties}
          onPointerDown={() => { dragging.current = true; }}
          onPointerUp={() => { dragging.current = false; }}
          onBlur={() => { dragging.current = false; }}
          onChange={(event) => onVolume(Number(event.target.value))}
        />
      </div>
      {error && <p className="inline-error">Connect an audio output to restore controls.</p>}
    </section>
  );
}
