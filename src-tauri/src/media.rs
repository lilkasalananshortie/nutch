use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaStatus {
    available: bool,
    title: String,
    artist: String,
    album: String,
    source: String,
    playing: bool,
    position_seconds: u64,
    duration_seconds: u64,
    artwork_data_url: Option<String>,
    can_toggle: bool,
    can_next: bool,
    can_previous: bool,
}

impl MediaStatus {
    fn unavailable() -> Self {
        Self {
            available: false,
            title: String::new(),
            artist: String::new(),
            album: String::new(),
            source: String::new(),
            playing: false,
            position_seconds: 0,
            duration_seconds: 0,
            artwork_data_url: None,
            can_toggle: false,
            can_next: false,
            can_previous: false,
        }
    }
}

#[cfg(windows)]
struct ComGuard(bool);

#[cfg(windows)]
impl Drop for ComGuard {
    fn drop(&mut self) {
        if self.0 {
            unsafe { windows::Win32::System::Com::CoUninitialize() };
        }
    }
}

#[cfg(windows)]
fn initialize_com() -> ComGuard {
    use windows::Win32::System::Com::{COINIT_MULTITHREADED, CoInitializeEx};
    ComGuard(unsafe { CoInitializeEx(None, COINIT_MULTITHREADED).is_ok() })
}

#[cfg(windows)]
fn current_session()
-> Result<windows::Media::Control::GlobalSystemMediaTransportControlsSession, String> {
    use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;

    let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
        .and_then(|operation| operation.get())
        .map_err(|error| format!("Unable to access Windows media sessions: {error}"))?;
    manager
        .GetCurrentSession()
        .map_err(|error| format!("No active Windows media session: {error}"))
}

#[cfg(windows)]
fn artwork_data_url(
    reference: &windows::Storage::Streams::IRandomAccessStreamReference,
) -> Option<String> {
    use base64::{Engine, engine::general_purpose::STANDARD};
    use windows::Storage::Streams::DataReader;

    let stream = reference.OpenReadAsync().ok()?.get().ok()?;
    let size = stream.Size().ok()?.min(2 * 1024 * 1024) as u32;
    if size == 0 {
        return None;
    }
    let input = stream.GetInputStreamAt(0).ok()?;
    let reader = DataReader::CreateDataReader(&input).ok()?;
    let loaded = reader.LoadAsync(size).ok()?.get().ok()?;
    let mut bytes = vec![0; loaded as usize];
    reader.ReadBytes(&mut bytes).ok()?;
    let content_type = stream.ContentType().ok()?.to_string_lossy();
    Some(format!(
        "data:{content_type};base64,{}",
        STANDARD.encode(bytes)
    ))
}

#[cfg(windows)]
fn get_media_status_blocking() -> MediaStatus {
    use windows::Media::Control::GlobalSystemMediaTransportControlsSessionPlaybackStatus;

    let _com = initialize_com();
    let Ok(session) = current_session() else {
        return MediaStatus::unavailable();
    };
    let Ok(properties) = session
        .TryGetMediaPropertiesAsync()
        .and_then(|operation| operation.get())
    else {
        return MediaStatus::unavailable();
    };
    let playback = session.GetPlaybackInfo().ok();
    let controls = playback.as_ref().and_then(|value| value.Controls().ok());
    let timeline = session.GetTimelineProperties().ok();
    let duration_ticks = timeline
        .as_ref()
        .and_then(|value| value.EndTime().ok())
        .map(|value| value.Duration.max(0) as u64)
        .unwrap_or(0);
    let position_ticks = timeline
        .as_ref()
        .and_then(|value| value.Position().ok())
        .map(|value| value.Duration.max(0) as u64)
        .unwrap_or(0);
    let artwork = properties
        .Thumbnail()
        .ok()
        .and_then(|reference| artwork_data_url(&reference));

    MediaStatus {
        available: true,
        title: properties
            .Title()
            .map(|v| v.to_string_lossy())
            .unwrap_or_default(),
        artist: properties
            .Artist()
            .map(|v| v.to_string_lossy())
            .unwrap_or_default(),
        album: properties
            .AlbumTitle()
            .map(|v| v.to_string_lossy())
            .unwrap_or_default(),
        source: session
            .SourceAppUserModelId()
            .map(|v| v.to_string_lossy())
            .unwrap_or_default(),
        playing: playback.and_then(|value| value.PlaybackStatus().ok())
            == Some(GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing),
        position_seconds: position_ticks / 10_000_000,
        duration_seconds: duration_ticks / 10_000_000,
        artwork_data_url: artwork,
        can_toggle: controls
            .as_ref()
            .and_then(|value| value.IsPlayPauseToggleEnabled().ok())
            .unwrap_or(false),
        can_next: controls
            .as_ref()
            .and_then(|value| value.IsNextEnabled().ok())
            .unwrap_or(false),
        can_previous: controls
            .as_ref()
            .and_then(|value| value.IsPreviousEnabled().ok())
            .unwrap_or(false),
    }
}

#[cfg(windows)]
#[tauri::command]
pub async fn get_media_status() -> MediaStatus {
    tauri::async_runtime::spawn_blocking(get_media_status_blocking)
        .await
        .unwrap_or_else(|_| MediaStatus::unavailable())
}

#[cfg(windows)]
fn control_media_blocking(action: String) -> Result<bool, String> {
    let _com = initialize_com();
    let session = current_session()?;
    let operation = match action.as_str() {
        "toggle" => session.TryTogglePlayPauseAsync(),
        "next" => session.TrySkipNextAsync(),
        "previous" => session.TrySkipPreviousAsync(),
        _ => return Err("Unsupported media action".into()),
    }
    .map_err(|error| format!("Unable to control the media session: {error}"))?;
    operation
        .get()
        .map_err(|error| format!("Windows rejected the media command: {error}"))
}

#[cfg(windows)]
#[tauri::command]
pub async fn control_media(action: String) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || control_media_blocking(action))
        .await
        .map_err(|error| format!("Media worker failed: {error}"))?
}

#[cfg(not(windows))]
#[tauri::command]
pub async fn get_media_status() -> MediaStatus {
    MediaStatus::unavailable()
}

#[cfg(not(windows))]
#[tauri::command]
pub fn control_media(_action: String) -> Result<bool, String> {
    Err("Windows media sessions are only available on Windows".into())
}

#[cfg(all(test, windows))]
mod tests {
    use super::get_media_status_blocking;

    #[test]
    fn media_status_is_safe_without_a_session() {
        let status = get_media_status_blocking();
        assert!(status.position_seconds <= status.duration_seconds || status.duration_seconds == 0);
    }
}
