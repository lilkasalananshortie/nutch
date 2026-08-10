use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

const BACKUP_VERSION: u32 = 1;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupPayload {
    nutch_backup_version: u32,
    app_version: String,
    exported_at: u64,
    settings: Value,
    notes: Value,
    planner: Value,
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .config_dir()
        .map(|path| path.join("Nutch"))
        .map_err(|error| format!("Unable to resolve Nutch data directory: {error}"))
}

fn read_json(path: &Path) -> Value {
    fs::read_to_string(path)
        .ok()
        .and_then(|contents| serde_json::from_str(&contents).ok())
        .unwrap_or_else(|| json!([]))
}

fn write_atomic(path: &Path, value: &Value) -> Result<(), String> {
    let parent = path.parent().ok_or("Invalid Nutch data path")?;
    fs::create_dir_all(parent)
        .map_err(|error| format!("Unable to create Nutch data directory: {error}"))?;
    let temporary = path.with_extension("json.restore.tmp");
    let contents = serde_json::to_string_pretty(value).map_err(|error| error.to_string())?;
    fs::write(&temporary, contents)
        .map_err(|error| format!("Unable to write temporary Nutch data: {error}"))?;
    fs::rename(&temporary, path).map_err(|error| format!("Unable to commit Nutch data: {error}"))
}

fn validate_payload(payload: &BackupPayload) -> Result<(), String> {
    if payload.nutch_backup_version != BACKUP_VERSION {
        return Err(format!(
            "Unsupported Nutch backup version {}",
            payload.nutch_backup_version
        ));
    }
    if !payload.settings.is_object() {
        return Err("Backup settings are invalid".into());
    }
    if !payload.notes.is_array() || !payload.planner.is_array() {
        return Err("Backup Notes or Planner data is invalid".into());
    }
    serde_json::from_value::<crate::settings::AppSettings>(payload.settings.clone())
        .map_err(|_| "Backup settings do not match this Nutch version".to_string())?;
    for note in payload.notes.as_array().cloned().unwrap_or_default() {
        serde_json::from_value::<crate::notes::QuickNote>(note)
            .map_err(|_| "Backup contains an invalid Note".to_string())?;
    }
    for item in payload.planner.as_array().cloned().unwrap_or_default() {
        serde_json::from_value::<crate::planner::PlannerItem>(item)
            .map_err(|_| "Backup contains an invalid Planner item".to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn export_backup(app: AppHandle, destination: String) -> Result<(), String> {
    let target = PathBuf::from(destination);
    if !target.is_absolute() || target.extension().and_then(|value| value.to_str()) != Some("json")
    {
        return Err("Choose an absolute .json backup path".into());
    }
    let directory = data_dir(&app)?;
    let stored_settings = read_json(&directory.join("settings.json"));
    let settings = if stored_settings.is_object() {
        stored_settings
    } else {
        serde_json::to_value(crate::settings::AppSettings::default())
            .map_err(|error| error.to_string())?
    };
    let payload = BackupPayload {
        nutch_backup_version: BACKUP_VERSION,
        app_version: env!("CARGO_PKG_VERSION").into(),
        exported_at: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|value| value.as_secs())
            .unwrap_or_default(),
        settings,
        notes: read_json(&directory.join("notes.json")),
        planner: read_json(&directory.join("planner.json")),
    };
    let value = serde_json::to_value(payload).map_err(|error| error.to_string())?;
    let parent = target.parent().ok_or("Invalid backup destination")?;
    fs::create_dir_all(parent)
        .map_err(|error| format!("Unable to create backup folder: {error}"))?;
    let temporary = target.with_extension("json.tmp");
    fs::write(
        &temporary,
        serde_json::to_string_pretty(&value).map_err(|error| error.to_string())?,
    )
    .map_err(|error| format!("Unable to write backup: {error}"))?;
    fs::rename(&temporary, &target).map_err(|error| format!("Unable to finalize backup: {error}"))
}

#[tauri::command]
pub fn restore_backup(app: AppHandle, source: String) -> Result<(), String> {
    let path = PathBuf::from(source);
    if !path.is_absolute() || !path.is_file() {
        return Err("Backup file does not exist".into());
    }
    let contents =
        fs::read_to_string(&path).map_err(|error| format!("Unable to read backup: {error}"))?;
    let payload: BackupPayload = serde_json::from_str(&contents)
        .map_err(|error| format!("Backup is not valid JSON: {error}"))?;
    validate_payload(&payload)?;
    let directory = data_dir(&app)?;
    write_atomic(&directory.join("settings.json"), &payload.settings)?;
    write_atomic(&directory.join("notes.json"), &payload.notes)?;
    write_atomic(&directory.join("planner.json"), &payload.planner)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_unknown_backup_version() {
        let payload = BackupPayload {
            nutch_backup_version: 99,
            app_version: "0.0.0".into(),
            exported_at: 0,
            settings: json!({}),
            notes: json!([]),
            planner: json!([]),
        };
        assert!(validate_payload(&payload).is_err());
    }
}
