# Nutch architecture

## Runtime boundary

Nutch is a Tauri 2 application. React and TypeScript render the compact
surface, panels, animations, and accessible controls. Rust commands are the
only path to Windows-specific data such as Core Audio, GSMTC media sessions,
battery state, monitor geometry, and startup configuration.

## Context engine

`src/stores/liveActivity.tsx` stores active contexts and selects the highest
priority non-expired activity. `Notch.tsx` feeds media, Focus, reminder,
battery, and volume events into that provider. The collapsed view renders the
selected context to the left of a stable clock and compact status region.

## Persistence

Notes and Planner items are validated and persisted by Rust in the user's
Nutch configuration directory. UI hooks optimistically update React state and
restore the previous state when a native write fails. Settings use the same
directory and are merged with safe defaults so older settings files remain
compatible when new preferences are added. Focus sessions and the notification
inbox are lightweight local browser state because they do not require native
system access.

## Native integrations

- `audio.rs`: Windows Core Audio master volume, mute, endpoint events.
- `media.rs`: Windows System Media Transport Controls metadata and playback.
- `battery.rs`: Windows power status with no-battery fallback.
- `window.rs`: DPI-aware top-center placement and animated native geometry.
- `planner.rs` / `notes.rs` / `settings.rs`: bounded local JSON persistence.

## Search safety

Quick Search uses local Notes and Planner data and a small allowlisted command
registry. Calculator input is parsed by a restricted arithmetic parser and
unit conversion is local. Search never dispatches arbitrary shell, PowerShell,
filesystem, or process commands.

## Deferred integrations

Generic browser download tracking, microphone/camera privacy indicators,
brightness and network toggles, system-wide app indexing, clipboard capture,
and AI are intentionally separate milestones. They require additional Windows
permissions, privacy decisions, or reliable APIs and are not faked by the
current release.
