use serde::Serialize;
use tauri::{Monitor, PhysicalPosition, PhysicalSize, WebviewWindow};

#[cfg(windows)]
use std::sync::Once;

const MIN_WIDTH: f64 = 200.0;
const MAX_WIDTH: f64 = 460.0;
const MIN_HEIGHT: f64 = 48.0;
const MAX_HEIGHT: f64 = 640.0;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DisplayInfo {
    id: String,
    name: String,
    width: u32,
    height: u32,
    scale_factor: f64,
    primary: bool,
}

fn monitor_id(monitor: &Monitor) -> String {
    let position = monitor.position();
    format!("{}:{}", position.x, position.y)
}

fn select_monitor(window: &WebviewWindow, selected_id: &str) -> Result<Monitor, String> {
    if selected_id == "primary" {
        return window
            .primary_monitor()
            .map_err(|error| format!("Unable to read the primary monitor: {error}"))?
            .or_else(|| window.current_monitor().ok().flatten())
            .ok_or_else(|| "No display is available".into());
    }
    let monitors = window
        .available_monitors()
        .map_err(|error| format!("Unable to enumerate displays: {error}"))?;
    monitors
        .into_iter()
        .find(|monitor| monitor_id(monitor) == selected_id)
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or_else(|| "No display is available".into())
}

#[cfg(windows)]
static OVERLAY_STYLE: Once = Once::new();

#[cfg(windows)]
fn ensure_overlay_style(window: &WebviewWindow) {
    use windows::Win32::UI::WindowsAndMessaging::{
        GWL_EXSTYLE, GWL_STYLE, GetWindowLongPtrW, SWP_FRAMECHANGED, SWP_NOACTIVATE, SWP_NOMOVE,
        SWP_NOSIZE, SetWindowLongPtrW, SetWindowPos, WS_CAPTION, WS_EX_APPWINDOW, WS_EX_TOOLWINDOW,
        WS_MAXIMIZEBOX, WS_MINIMIZEBOX, WS_SYSMENU, WS_THICKFRAME,
    };

    OVERLAY_STYLE.call_once(|| unsafe {
        let Ok(hwnd) = window.hwnd() else {
            return;
        };
        let style = GetWindowLongPtrW(hwnd, GWL_STYLE) as u32
            & !(WS_CAPTION.0
                | WS_THICKFRAME.0
                | WS_MINIMIZEBOX.0
                | WS_MAXIMIZEBOX.0
                | WS_SYSMENU.0);
        let extended =
            (GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32 & !WS_EX_APPWINDOW.0) | WS_EX_TOOLWINDOW.0;
        SetWindowLongPtrW(hwnd, GWL_STYLE, style as isize);
        SetWindowLongPtrW(hwnd, GWL_EXSTYLE, extended as isize);
        let _ = SetWindowPos(
            hwnd,
            None,
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_FRAMECHANGED,
        );
    });
}

#[cfg(not(windows))]
fn ensure_overlay_style(_window: &WebviewWindow) {}

#[cfg(windows)]
fn work_area(monitor_position: &PhysicalPosition<i32>, monitor_width: u32) -> (i32, i32, u32) {
    use std::mem::size_of;
    use windows::Win32::Foundation::POINT;
    use windows::Win32::Graphics::Gdi::{
        GetMonitorInfoW, MONITOR_DEFAULTTONEAREST, MONITORINFO, MonitorFromPoint,
    };

    unsafe {
        let monitor = MonitorFromPoint(
            POINT {
                x: monitor_position.x,
                y: monitor_position.y,
            },
            MONITOR_DEFAULTTONEAREST,
        );
        let mut info = MONITORINFO {
            cbSize: size_of::<MONITORINFO>() as u32,
            ..Default::default()
        };
        if GetMonitorInfoW(monitor, &mut info).as_bool() {
            return (
                info.rcWork.left,
                info.rcWork.top,
                (info.rcWork.right - info.rcWork.left).max(1) as u32,
            );
        }
    }
    (monitor_position.x, monitor_position.y, monitor_width)
}

#[cfg(not(windows))]
fn work_area(monitor_position: &PhysicalPosition<i32>, monitor_width: u32) -> (i32, i32, u32) {
    (monitor_position.x, monitor_position.y, monitor_width)
}

fn apply_geometry(
    window: &WebviewWindow,
    width: f64,
    height: f64,
    top_offset: f64,
    monitor_id: &str,
) -> Result<(), String> {
    ensure_overlay_style(window);
    if !(MIN_WIDTH..=MAX_WIDTH).contains(&width) || !(MIN_HEIGHT..=MAX_HEIGHT).contains(&height) {
        return Err("Notch geometry is outside the allowed bounds".into());
    }
    let monitor = select_monitor(window, monitor_id)?;
    let scale = monitor.scale_factor();
    let physical_width = (width * scale).round().max(1.0) as u32;
    let physical_height = (height * scale).round().max(1.0) as u32;
    let monitor_size = monitor.size();
    let monitor_position = monitor.position();
    let (work_left, work_top, work_width) = work_area(monitor_position, monitor_size.width);
    let x = work_left + (work_width as i32 - physical_width as i32) / 2;
    let y = work_top + (top_offset.clamp(0.0, 30.0) * scale).round() as i32;

    window
        .set_size(PhysicalSize::new(physical_width, physical_height))
        .map_err(|error| format!("Unable to resize Nutch: {error}"))?;
    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|error| format!("Unable to position Nutch: {error}"))?;
    Ok(())
}

#[tauri::command]
pub fn set_notch_geometry(
    window: WebviewWindow,
    width: f64,
    height: f64,
    top_offset: f64,
    monitor_id: String,
) -> Result<(), String> {
    apply_geometry(&window, width, height, top_offset, &monitor_id)
}

#[tauri::command]
pub fn reposition_notch(
    window: WebviewWindow,
    top_offset: f64,
    monitor_id: String,
) -> Result<(), String> {
    let size = window
        .inner_size()
        .map_err(|error| format!("Unable to read Nutch size: {error}"))?;
    let scale = window
        .scale_factor()
        .map_err(|error| format!("Unable to read display scale: {error}"))?;
    apply_geometry(
        &window,
        f64::from(size.width) / scale,
        f64::from(size.height) / scale,
        top_offset,
        &monitor_id,
    )
}

#[tauri::command]
pub fn list_monitors(window: WebviewWindow) -> Result<Vec<DisplayInfo>, String> {
    let primary = window
        .primary_monitor()
        .map_err(|error| format!("Unable to read the primary monitor: {error}"))?;
    let primary_id = primary.as_ref().map(monitor_id);
    let monitors = window
        .available_monitors()
        .map_err(|error| format!("Unable to enumerate displays: {error}"))?;
    Ok(monitors
        .into_iter()
        .enumerate()
        .map(|(index, monitor)| {
            let size = monitor.size();
            let id = monitor_id(&monitor);
            DisplayInfo {
                primary: primary_id.as_deref() == Some(id.as_str()),
                name: monitor
                    .name()
                    .cloned()
                    .unwrap_or_else(|| format!("Display {}", index + 1)),
                id,
                width: size.width,
                height: size.height,
                scale_factor: monitor.scale_factor(),
            }
        })
        .collect())
}
