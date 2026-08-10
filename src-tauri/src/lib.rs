mod audio;
mod backup;
mod battery;
mod media;
mod metrics;
mod notes;
mod planner;
mod settings;
mod window;

use audio::{get_master_volume, set_master_volume, set_mute_state, start_audio_listener};
use backup::{export_backup, restore_backup};
use battery::get_battery_status;
use media::{control_media, get_media_status};
use metrics::get_system_stats;
use notes::{delete_note, list_notes, save_note};
use planner::{delete_planner_item, list_planner_items, save_planner_item};
use settings::{load_settings, save_settings};
use tauri::Manager;
use window::{list_monitors, reposition_notch, set_notch_geometry};

#[tauri::command]
fn quit_nutch(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn start_audio_events(app: tauri::AppHandle) {
    start_audio_listener(app);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_always_on_top(true);
                let _ = window.set_skip_taskbar(true);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_battery_status,
            get_master_volume,
            set_master_volume,
            set_mute_state,
            start_audio_events,
            get_media_status,
            control_media,
            get_system_stats,
            list_notes,
            save_note,
            delete_note,
            list_planner_items,
            save_planner_item,
            delete_planner_item,
            load_settings,
            save_settings,
            set_notch_geometry,
            reposition_notch,
            list_monitors,
            quit_nutch,
            export_backup,
            restore_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running Nutch");
}
