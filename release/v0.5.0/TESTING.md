# Nutch 0.5.0 Beta Testing

Thank you for testing Nutch. Please use the Setup executable unless you have a
specific reason to test the MSI. You do not need Node.js, npm, Rust, or Visual
Studio to run the installed app.

## Installation

1. Run `Nutch-0.5.0-Setup.exe`.
2. If Windows shows a publisher/reputation warning, verify the checksum and
   choose whether to continue. This is an unsigned beta build; do not disable
   Windows security protections.
3. Launch Nutch and complete the short setup.

## Please test first

### Basic surface

- Launch, collapse, and expand Nutch.
- Try Notch mode and Island mode.
- Restart the application.
- Confirm only one island appears when launching Nutch twice.

### Clock and status

- Verify the time and 12h/24h setting.
- On a laptop, check battery and charging state.
- On a desktop, confirm battery absence is handled quietly.

### Volume and media

- Adjust volume, mute, and unmute.
- Try Spotify, YouTube, or browser media.
- Check title, artist, artwork fallback, play/pause, and next/previous.
- Confirm media stays compact beside the clock.

### Planner, Notes, and Search

- Create a Planner task with a due time, tags, estimate, and subtasks.
- Complete a task and a subtask.
- Create a reminder and verify it survives restart.
- Create/edit a Note, restart Nutch, and confirm it remains.
- Press `Alt+Space`; search Notes, Tasks, and commands using the category tabs.

### Focus and timers

- Start, pause, resume, and finish Focus.
- Create a labeled timer and verify it remains accurate after restart.

### Windows behavior

- If autostart is enabled, restart Windows and check startup.
- Test display scaling at 100%, 125%, and 150% if possible.
- Test an external monitor if available.
- Test sleep/resume and report reminder/timer behavior.

### Performance

Please report if Nutch freezes, animates poorly, uses high CPU, or grows in
memory over time.

## Bug report format

- Nutch version: 0.5.0 beta
- Windows version/build:
- Laptop or desktop:
- Screen resolution:
- Display scaling:
- What you were doing:
- What happened:
- What should have happened:
- Can you reproduce it:
- Screenshot/video if possible:

Report issues at https://github.com/lilkasalananshortie/nutch/issues.

## Known limitations

- This build is unsigned and may show a Windows SmartScreen publisher warning.
- Portable ZIP distribution is deferred; use the installer for testing.
- Cloud calendar, AI Copilot, clipboard history, per-app audio controls, and
  automatic fullscreen detection are not part of this beta.
- WebView2 is configured through Tauri's embedded bootstrapper; Windows may
  still need internet access during installation if the runtime is absent.
