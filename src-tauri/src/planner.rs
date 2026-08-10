use serde::{Deserialize, Serialize};
use std::{cmp::Reverse, fs, path::PathBuf};
use tauri::{AppHandle, Manager};

const MAX_ITEMS: usize = 500;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlannerItem {
    pub id: String,
    pub title: String,
    pub description: String,
    pub scheduled_at: Option<u64>,
    pub reminder_at: Option<u64>,
    pub completed: bool,
    pub created_at: u64,
    pub updated_at: u64,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub duration_minutes: Option<u32>,
    #[serde(default)]
    pub subtasks: Vec<PlannerSubtask>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlannerSubtask {
    pub id: String,
    pub title: String,
    pub completed: bool,
}

fn planner_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .config_dir()
        .map(|directory| directory.join("Nutch").join("planner.json"))
        .map_err(|error| format!("Unable to resolve Nutch planner directory: {error}"))
}

fn read_items(app: &AppHandle) -> Vec<PlannerItem> {
    let Ok(path) = planner_path(app) else {
        return Vec::new();
    };
    let Ok(contents) = fs::read_to_string(path) else {
        return Vec::new();
    };
    serde_json::from_str(&contents).unwrap_or_default()
}

fn write_items(app: &AppHandle, items: &[PlannerItem]) -> Result<(), String> {
    let path = planner_path(app)?;
    let parent = path.parent().ok_or("Invalid Nutch planner path")?;
    fs::create_dir_all(parent)
        .map_err(|error| format!("Unable to create Nutch planner directory: {error}"))?;
    let json = serde_json::to_string_pretty(items).map_err(|error| error.to_string())?;
    fs::write(path, json).map_err(|error| format!("Unable to save Nutch planner: {error}"))
}

fn validate(item: &PlannerItem) -> Result<(), String> {
    if item.id.trim().is_empty() || item.id.len() > 80 {
        return Err("Planner item id is invalid".into());
    }
    if item.title.trim().is_empty() || item.title.chars().count() > 180 {
        return Err("Planner titles must be 1–180 characters".into());
    }
    if item.description.chars().count() > 4_000 {
        return Err("Planner descriptions are limited to 4,000 characters".into());
    }
    if item.tags.len() > 12
        || item
            .tags
            .iter()
            .any(|tag| tag.trim().is_empty() || tag.chars().count() > 32)
    {
        return Err("Planner tags are limited to 12 short labels".into());
    }
    if item
        .duration_minutes
        .is_some_and(|minutes| !(1..=1_440).contains(&minutes))
    {
        return Err("Planner duration must be between 1 and 1,440 minutes".into());
    }
    if item.subtasks.len() > 30
        || item.subtasks.iter().any(|task| {
            task.id.trim().is_empty()
                || task.title.trim().is_empty()
                || task.title.chars().count() > 180
        })
    {
        return Err("Planner subtasks are limited to 30 short items".into());
    }
    Ok(())
}

#[tauri::command]
pub fn list_planner_items(app: AppHandle) -> Vec<PlannerItem> {
    let mut items = read_items(&app);
    items.sort_by_key(|item| Reverse(item.scheduled_at.unwrap_or(u64::MAX)));
    items
}

#[tauri::command]
pub fn save_planner_item(app: AppHandle, item: PlannerItem) -> Result<PlannerItem, String> {
    validate(&item)?;
    let mut items = read_items(&app);
    if let Some(existing) = items.iter_mut().find(|existing| existing.id == item.id) {
        *existing = item.clone();
    } else {
        if items.len() >= MAX_ITEMS {
            return Err(format!("Nutch supports up to {MAX_ITEMS} planner items"));
        }
        items.push(item.clone());
    }
    write_items(&app, &items)?;
    Ok(item)
}

#[tauri::command]
pub fn delete_planner_item(app: AppHandle, id: String) -> Result<(), String> {
    let mut items = read_items(&app);
    items.retain(|item| item.id != id);
    write_items(&app, &items)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_empty_titles() {
        let item = PlannerItem {
            id: "task-1".into(),
            title: " ".into(),
            description: String::new(),
            scheduled_at: None,
            reminder_at: None,
            completed: false,
            created_at: 1,
            updated_at: 1,
            tags: Vec::new(),
            duration_minutes: None,
            subtasks: Vec::new(),
        };
        assert!(validate(&item).is_err());
    }
}
