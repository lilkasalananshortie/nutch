use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettings {
    time_format: String,
    hover_to_expand: bool,
    click_to_expand: bool,
    top_offset: f64,
    launch_at_startup: bool,
    monitor_id: String,
    show_media: bool,
    show_system_stats: bool,
    notifications_enabled: bool,
    display_style: String,
    mouse_wheel_volume: bool,
    minimal_idle_mode: bool,
    do_not_disturb: bool,
    presentation_mode: bool,
    fullscreen_behavior: String,
    onboarding_completed: bool,
    privacy_mode: bool,
    profile: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            time_format: "12h".into(),
            hover_to_expand: true,
            click_to_expand: true,
            top_offset: 6.0,
            launch_at_startup: false,
            monitor_id: "primary".into(),
            show_media: true,
            show_system_stats: false,
            notifications_enabled: false,
            display_style: "island".into(),
            mouse_wheel_volume: true,
            minimal_idle_mode: false,
            do_not_disturb: false,
            presentation_mode: false,
            fullscreen_behavior: "show".into(),
            onboarding_completed: false,
            privacy_mode: false,
            profile: "default".into(),
        }
    }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .config_dir()
        .map(|directory| directory.join("Nutch").join("settings.json"))
        .map_err(|error| format!("Unable to resolve Nutch config directory: {error}"))
}

#[tauri::command]
pub fn load_settings(app: AppHandle) -> AppSettings {
    let Ok(path) = settings_path(&app) else {
        return AppSettings::default();
    };
    let Ok(contents) = fs::read_to_string(&path) else {
        return AppSettings::default();
    };
    match serde_json::from_str::<AppSettings>(&contents) {
        Ok(mut settings) => {
            // Existing Nutch installs predate onboarding. Treat a valid legacy
            // settings file as already configured so upgrades never interrupt use.
            if serde_json::from_str::<serde_json::Value>(&contents)
                .ok()
                .and_then(|value| value.get("onboardingCompleted").cloned())
                .is_none()
            {
                settings.onboarding_completed = true;
            }
            settings
        }
        Err(_) => {
            let stamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|value| value.as_secs())
                .unwrap_or_default();
            let backup = path.with_file_name(format!("settings.json.corrupt-{stamp}"));
            let _ = fs::rename(&path, backup);
            AppSettings::default()
        }
    }
}

#[tauri::command]
pub fn save_settings(app: AppHandle, mut settings: AppSettings) -> Result<(), String> {
    if settings.time_format != "12h" && settings.time_format != "24h" {
        return Err("Time format must be 12h or 24h".into());
    }
    if settings.display_style != "notch" && settings.display_style != "island" {
        return Err("Display style must be notch or island".into());
    }
    if !matches!(
        settings.fullscreen_behavior.as_str(),
        "show" | "minimal" | "hide"
    ) {
        return Err("Fullscreen behavior must be show, minimal, or hide".into());
    }
    if !matches!(
        settings.profile.as_str(),
        "default" | "work" | "study" | "gaming" | "presentation"
    ) {
        return Err("Profile must be default, work, study, gaming, or presentation".into());
    }
    settings.top_offset = settings.top_offset.clamp(0.0, 30.0);
    let path = settings_path(&app)?;
    let parent = path.parent().ok_or("Invalid Nutch settings path")?;
    fs::create_dir_all(parent)
        .map_err(|error| format!("Unable to create Nutch config directory: {error}"))?;
    let temporary = path.with_extension("json.tmp");
    let json = serde_json::to_string_pretty(&settings).map_err(|error| error.to_string())?;
    fs::write(&temporary, json)
        .map_err(|error| format!("Unable to write Nutch settings: {error}"))?;
    fs::rename(&temporary, &path)
        .map_err(|error| format!("Unable to commit Nutch settings: {error}"))
}
