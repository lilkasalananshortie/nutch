# Changelog

All notable changes to Nutch are documented here.

## [Unreleased]

### Added

- Versioned JSON backup export/restore for Settings, Notes, and Planner with validation and atomic writes.
- Private Notes that are excluded from ordinary Quick Search previews.
- Quick Capture for Notes, Tasks, and scheduled Reminders.
- General timestamp-based Timer with pause, resume, and Search commands such as `timer 20m`.
- Lightweight fuzzy matching and privacy-conscious local command history in Quick Search.
- Official Tauri global shortcuts: Alt+Space for Search and Alt+N for Quick Capture, with conflict-safe fallback.
- Manual Privacy mode that masks collapsed media/activity titles.
- Notification inbox retention capped at 30 days and 30 entries.
- Single-instance forwarding so launching Nutch twice focuses the existing window.
- Short first-run onboarding with an upgrade-safe completion state.
- About & Diagnostics view with non-sensitive module health checks.
- Missed-reminder recovery after restart or sleep with persistent de-duplication.
- User guide, troubleshooting, security policy, and GitHub issue/PR templates.
- Safe Quick Search commands for volume, mute, Focus, Notes, Planner, Settings, and display mode.
- Local calculator expressions and common unit conversions.
- Persisted minimal-idle, Do Not Disturb, Presentation, and fullscreen-policy settings.

### Changed

- Expanded the monochrome UI system while preserving the compact context/clock/status collapsed layout.

### Fixed

- Volume live activity now respects quiet presentation preferences.

## [0.4.0] - 2026-08-10

### Added

- Responsive Notch and Island shell with clock, battery, master volume, mute, and Windows media session controls.
- Compact media context beside the clock with artwork, progress, and reduced-motion equalizer treatment.
- Local Notes, Planner reminders, Focus sessions, notification inbox, and Settings persistence.
- Top-center DPI-aware positioning, monitor selection, startup integration, and Windows installers.
