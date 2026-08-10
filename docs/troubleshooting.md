# Troubleshooting

## Nutch does not appear

Launch the installed executable once. Check that Windows WebView2 is
available and open Settings → About & diagnostics. A selected monitor that is
disconnected falls back to the primary display.

## Launching twice

Nutch uses a Tauri single-instance guard. A second launch focuses the existing
window instead of creating another island.

## Media is unavailable

The source application must expose Windows System Media Transport Controls.
Some browser tabs and players do not expose compatible metadata until media is
actively playing.

## Planner reminder was missed

Nutch recovers reminders due within the last seven days after restart or
resume. Older reminders are marked as observed to avoid flooding the user.

## Settings look reset

Nutch uses safe defaults when a settings file cannot be parsed and preserves
the malformed file beside it for diagnostics. Do not delete that file until a
copy has been retained for support.

## Notifications are unavailable

Windows notification permission is optional. The in-island Nutch inbox still
works for events generated while Nutch is running.

## Build problems

From the project root run `npm install`, then `npm run build`. For native
checks, use `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D
warnings`, and `cargo test` from `src-tauri`.
