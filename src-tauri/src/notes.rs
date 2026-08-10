use serde::{Deserialize, Serialize};
use std::{cmp::Reverse, fs, path::PathBuf};
use tauri::{AppHandle, Manager};

const MAX_NOTES: usize = 100;
const MAX_TITLE_LENGTH: usize = 120;
const MAX_BODY_LENGTH: usize = 20_000;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuickNote {
    id: String,
    title: String,
    body: String,
    updated_at: u64,
    #[serde(default)]
    private: bool,
}

fn notes_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .config_dir()
        .map(|directory| directory.join("Nutch").join("notes.json"))
        .map_err(|error| format!("Unable to resolve Nutch notes directory: {error}"))
}

fn read_notes(app: &AppHandle) -> Vec<QuickNote> {
    let Ok(path) = notes_path(app) else {
        return Vec::new();
    };
    let Ok(contents) = fs::read_to_string(path) else {
        return Vec::new();
    };
    serde_json::from_str(&contents).unwrap_or_default()
}

fn write_notes(app: &AppHandle, notes: &[QuickNote]) -> Result<(), String> {
    let path = notes_path(app)?;
    let parent = path.parent().ok_or("Invalid Nutch notes path")?;
    fs::create_dir_all(parent)
        .map_err(|error| format!("Unable to create Nutch notes directory: {error}"))?;
    let json = serde_json::to_string_pretty(notes).map_err(|error| error.to_string())?;
    fs::write(path, json).map_err(|error| format!("Unable to save Nutch notes: {error}"))
}

fn validate_note(note: &QuickNote) -> Result<(), String> {
    if note.id.trim().is_empty() || note.id.len() > 80 {
        return Err("Note id is invalid".into());
    }
    if note.title.chars().count() > MAX_TITLE_LENGTH {
        return Err(format!(
            "Note titles may contain up to {MAX_TITLE_LENGTH} characters"
        ));
    }
    if note.body.chars().count() > MAX_BODY_LENGTH {
        return Err(format!(
            "Notes may contain up to {MAX_BODY_LENGTH} characters"
        ));
    }
    Ok(())
}

#[tauri::command]
pub fn list_notes(app: AppHandle) -> Vec<QuickNote> {
    let mut notes = read_notes(&app);
    notes.sort_by_key(|note| Reverse(note.updated_at));
    notes
}

#[tauri::command]
pub fn save_note(app: AppHandle, note: QuickNote) -> Result<QuickNote, String> {
    validate_note(&note)?;
    let mut notes = read_notes(&app);
    if let Some(existing) = notes.iter_mut().find(|existing| existing.id == note.id) {
        *existing = note.clone();
    } else {
        if notes.len() >= MAX_NOTES {
            return Err(format!("Nutch supports up to {MAX_NOTES} quick notes"));
        }
        notes.push(note.clone());
    }
    notes.sort_by_key(|note| Reverse(note.updated_at));
    write_notes(&app, &notes)?;
    Ok(note)
}

#[tauri::command]
pub fn delete_note(app: AppHandle, id: String) -> Result<(), String> {
    let mut notes = read_notes(&app);
    notes.retain(|note| note.id != id);
    write_notes(&app, &notes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_note_limits() {
        let note = QuickNote {
            id: "note-1".into(),
            title: "Quick thought".into(),
            body: "Remember this".into(),
            updated_at: 1,
            private: false,
        };
        assert!(validate_note(&note).is_ok());
    }
}
