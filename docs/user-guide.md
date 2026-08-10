# Nutch user guide

## First launch

New installs show a short setup flow for Notch/Island appearance and hover or
click interaction. Clipboard history and AI remain disabled until explicitly
configured. Existing installations skip onboarding during upgrade.

## Everyday controls

Hover or click the collapsed surface to expand it. The left region shows the
current context, the center keeps the local clock stable, and the right region
shows compact status. Scroll over the collapsed surface to adjust master
volume when Wheel volume is enabled.

Quick Search supports local Notes and Planner search plus safe commands such as
`volume 50`, `mute`, `focus 25`, `new note`, `open settings`, `2^8`, and
`20 km to miles`.

## Planner and Focus

Planner reminders are stored locally. If Nutch was closed or Windows slept
through a reminder, the next launch surfaces a bounded missed-reminder notice
and de-duplicates it. Focus derives remaining time from timestamps so sleep
does not make the countdown drift.

## Privacy

Notes, Planner items, settings, and Nutch notification history stay local.
Clipboard history is not implemented/enabled by default. AI is not configured
in this release and no API secret is stored in settings or frontend code.
Diagnostics intentionally omit Notes, Planner text, clipboard data, and
credentials.

## Recovery

Use Settings → Run setup again to revisit onboarding. Settings → About &
diagnostics reports non-sensitive subsystem health. A malformed settings file
is moved aside with a `.corrupt-<timestamp>` suffix and safe defaults are used.

## Data location

Nutch stores settings, Notes, and Planner data in the per-user application
configuration directory resolved by Tauri. The source tree never stores user
content.
