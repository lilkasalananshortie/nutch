# Contributing to Nutch

## Development

Install Node.js, Rust, the Windows WebView2 runtime, and the Tauri Windows
build prerequisites. From the project root:

```powershell
npm install
npm run tauri dev
```

Before a meaningful change is committed, run:

```powershell
npm run build
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo test
```

## Commits and releases

Use conventional commit messages such as `feat(search): add calculator
commands`, `fix(window): preserve top-center alignment`, or
`docs: update architecture`. Keep commits coherent and do not include
`node_modules`, Rust targets, local databases, credentials, or generated
installers. Release tags use semantic versions such as `v0.4.0` and are only
created after a verified Windows build.

## Privacy

Nutch is local-first. Do not commit application settings, Notes, Planner data,
clipboard history, API keys, or personal screenshots. New integrations must
use typed allowlists rather than arbitrary shell execution.
