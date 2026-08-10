# Advanced feature status

This document records the implementation boundary for the current unreleased
work on Nutch. It is intentionally conservative: a feature is not marked
complete unless the current Tauri/Windows architecture provides a reliable
implementation.

## Implemented

- Context activity metadata with priority classes, pinned activity preference,
  cycling, expiration, and an expanded activity stack.
- Compact media beside the clock, persistent timestamp-based Focus and multiple
  labeled timers, and the Today view with a local daily briefing summary.
- Quick Capture for Notes, Tasks, and Reminders; private Notes; bounded
  notification history; privacy masking; versioned backup and restore.
- Quick Search fuzzy ranking, bounded local command history, aliases/prefixes,
  calculator/conversions, safe Nutch commands, global Search/Capture shortcuts.
- Local Default, Work, Study, Gaming, and Presentation profiles with explicit
  DND/presentation policy changes.
- Single-instance forwarding, onboarding, diagnostics, settings recovery, and
  missed-reminder recovery.

## Partial or intentionally limited

- Planner remains a lightweight task/reminder list with tags, estimates, and
  subtasks. Recurrence, calendar providers, dependencies, and ICS are not yet
  part of the data model.
- Search currently covers Nutch data and allowlisted commands with local
  category filters; Windows app/file
  indexing, fuzzy app launching, clipboard sources, and web search are not
  enabled by default.
- Fullscreen behavior is persisted as a user preference, but automatic
  fullscreen detection is not enabled.
- Profiles are explicit local policies; schedule-based and per-application
  switching is not enabled.

## Deferred until reliable APIs or secure infrastructure exist

- Per-application audio mixer, output/microphone switching, microphone mute,
  brightness, Night Light, power mode, VPN/USB/device monitoring, and Windows
  Update awareness.
- Clipboard 2.0, file-drop mutation actions, QR/screenshot history, ZIP tools,
  and broad recent-file/download tracking.
- Calendar cloud providers, meeting detection, voice input, AI Copilot/tool
  execution, secure updater signing, code signing, and GitHub Releases.
- Automation rules, virtual-desktop awareness, phone integrations, and a
  third-party extension marketplace.

These items remain documented roadmap work rather than simulated UI. No
arbitrary shell execution, invasive hooks, telemetry, or silent data upload is
used to make them appear complete.
