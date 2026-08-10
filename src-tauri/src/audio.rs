use serde::Serialize;

#[cfg(windows)]
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};

#[cfg(windows)]
use tauri::{AppHandle, Emitter};

#[cfg(windows)]
use windows::Win32::Media::Audio::Endpoints::{
    IAudioEndpointVolumeCallback, IAudioEndpointVolumeCallback_Impl,
};

#[cfg(windows)]
use windows::Win32::Media::Audio::{IMMNotificationClient, IMMNotificationClient_Impl};

#[cfg(windows)]
use windows::core::implement;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VolumeStatus {
    volume: u8,
    muted: bool,
}

#[cfg(windows)]
#[implement(IAudioEndpointVolumeCallback)]
struct VolumeNotification(std::sync::mpsc::SyncSender<VolumeStatus>);

#[cfg(windows)]
impl IAudioEndpointVolumeCallback_Impl for VolumeNotification_Impl {
    fn OnNotify(
        &self,
        notification: *mut windows::Win32::Media::Audio::AUDIO_VOLUME_NOTIFICATION_DATA,
    ) -> windows::core::Result<()> {
        if notification.is_null() {
            return Ok(());
        }
        let notification = unsafe { &*notification };
        let _ = self.0.try_send(VolumeStatus {
            volume: (notification.fMasterVolume.clamp(0.0, 1.0) * 100.0).round() as u8,
            muted: notification.bMuted.as_bool(),
        });
        Ok(())
    }
}

#[cfg(windows)]
#[implement(IMMNotificationClient)]
struct DeviceNotification(Arc<AtomicBool>);

#[cfg(windows)]
impl IMMNotificationClient_Impl for DeviceNotification_Impl {
    fn OnDeviceStateChanged(
        &self,
        _device_id: &windows::core::PCWSTR,
        _new_state: windows::Win32::Media::Audio::DEVICE_STATE,
    ) -> windows::core::Result<()> {
        self.0.store(true, Ordering::Release);
        Ok(())
    }

    fn OnDeviceAdded(&self, _device_id: &windows::core::PCWSTR) -> windows::core::Result<()> {
        self.0.store(true, Ordering::Release);
        Ok(())
    }

    fn OnDeviceRemoved(&self, _device_id: &windows::core::PCWSTR) -> windows::core::Result<()> {
        self.0.store(true, Ordering::Release);
        Ok(())
    }

    fn OnDefaultDeviceChanged(
        &self,
        flow: windows::Win32::Media::Audio::EDataFlow,
        _role: windows::Win32::Media::Audio::ERole,
        _device_id: &windows::core::PCWSTR,
    ) -> windows::core::Result<()> {
        if flow == windows::Win32::Media::Audio::eRender {
            self.0.store(true, Ordering::Release);
        }
        Ok(())
    }

    fn OnPropertyValueChanged(
        &self,
        _device_id: &windows::core::PCWSTR,
        _key: &windows::Win32::Foundation::PROPERTYKEY,
    ) -> windows::core::Result<()> {
        Ok(())
    }
}

#[cfg(windows)]
pub fn start_audio_listener(app: AppHandle) {
    static START: std::sync::Once = std::sync::Once::new();
    START.call_once(|| {
        let _ = std::thread::spawn(move || unsafe {
            use std::time::Duration;
            use windows::Win32::Media::Audio::{
                IMMDeviceEnumerator, MMDeviceEnumerator, eMultimedia, eRender,
            };
            use windows::Win32::System::Com::{
                CLSCTX_ALL, COINIT_MULTITHREADED, CoCreateInstance, CoInitializeEx,
            };

            if CoInitializeEx(None, COINIT_MULTITHREADED).is_err() {
                return;
            }
            let Ok(enumerator): windows::core::Result<IMMDeviceEnumerator> =
                CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)
            else {
                return;
            };
            let endpoint_changed = Arc::new(AtomicBool::new(true));
            let (volume_sender, volume_receiver) = std::sync::mpsc::sync_channel(8);
            let device_callback: IMMNotificationClient =
                DeviceNotification(endpoint_changed.clone()).into();
            if enumerator
                .RegisterEndpointNotificationCallback(&device_callback)
                .is_err()
            {
                return;
            }

            loop {
                endpoint_changed.store(false, Ordering::Release);
                let Ok(device) = enumerator.GetDefaultAudioEndpoint(eRender, eMultimedia) else {
                    std::thread::sleep(Duration::from_secs(2));
                    continue;
                };
                let Ok(endpoint) = device
                    .Activate::<windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume>(
                    CLSCTX_ALL, None,
                ) else {
                    std::thread::sleep(Duration::from_secs(2));
                    continue;
                };
                let volume_callback: IAudioEndpointVolumeCallback =
                    VolumeNotification(volume_sender.clone()).into();
                if endpoint
                    .RegisterControlChangeNotify(&volume_callback)
                    .is_err()
                {
                    std::thread::sleep(Duration::from_secs(2));
                    continue;
                }
                if let (Ok(scalar), Ok(muted)) =
                    (endpoint.GetMasterVolumeLevelScalar(), endpoint.GetMute())
                {
                    let _ = app.emit(
                        "system-volume-changed",
                        VolumeStatus {
                            volume: (scalar.clamp(0.0, 1.0) * 100.0).round() as u8,
                            muted: muted.as_bool(),
                        },
                    );
                }
                while !endpoint_changed.load(Ordering::Acquire) {
                    match volume_receiver.recv_timeout(Duration::from_millis(200)) {
                        Ok(status) => {
                            let _ = app.emit("system-volume-changed", status);
                        }
                        Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {}
                        Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => return,
                    }
                }
                let _ = endpoint.UnregisterControlChangeNotify(&volume_callback);
            }
        });
    });
}

#[cfg(not(windows))]
pub fn start_audio_listener(_app: tauri::AppHandle) {}

#[cfg(windows)]
fn with_endpoint<T>(
    operation: impl FnOnce(
        &windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume,
    ) -> windows::core::Result<T>,
) -> Result<T, String> {
    use windows::Win32::Media::Audio::{
        IMMDeviceEnumerator, MMDeviceEnumerator, eMultimedia, eRender,
    };
    use windows::Win32::System::Com::{
        CLSCTX_ALL, COINIT_MULTITHREADED, CoCreateInstance, CoInitializeEx, CoUninitialize,
    };

    unsafe {
        let com_initialized = CoInitializeEx(None, COINIT_MULTITHREADED).is_ok();
        let result = (|| {
            let enumerator: IMMDeviceEnumerator =
                CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL).map_err(|error| {
                    format!("Unable to create Windows audio enumerator: {error}")
                })?;
            let device = enumerator
                .GetDefaultAudioEndpoint(eRender, eMultimedia)
                .map_err(|error| {
                    format!("No default Windows audio output is available: {error}")
                })?;
            let endpoint = device
                .Activate::<windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume>(
                    CLSCTX_ALL, None,
                )
                .map_err(|error| format!("Unable to access Windows master volume: {error}"))?;
            operation(&endpoint).map_err(|error| format!("Windows audio operation failed: {error}"))
        })();
        if com_initialized {
            CoUninitialize();
        }
        result
    }
}

#[cfg(windows)]
#[tauri::command]
pub fn get_master_volume() -> Result<VolumeStatus, String> {
    with_endpoint(|endpoint| unsafe {
        let scalar = endpoint.GetMasterVolumeLevelScalar()?;
        let muted = endpoint.GetMute()?.as_bool();
        Ok(VolumeStatus {
            volume: (scalar.clamp(0.0, 1.0) * 100.0).round() as u8,
            muted,
        })
    })
}

#[cfg(windows)]
#[tauri::command]
pub fn set_master_volume(value: u8) -> Result<VolumeStatus, String> {
    let bounded = value.min(100);
    with_endpoint(|endpoint| unsafe {
        endpoint.SetMasterVolumeLevelScalar(f32::from(bounded) / 100.0, std::ptr::null())?;
        Ok(VolumeStatus {
            volume: bounded,
            muted: endpoint.GetMute()?.as_bool(),
        })
    })
}

#[cfg(windows)]
#[tauri::command]
pub fn set_mute_state(muted: bool) -> Result<VolumeStatus, String> {
    with_endpoint(|endpoint| unsafe {
        endpoint.SetMute(muted, std::ptr::null())?;
        let scalar = endpoint.GetMasterVolumeLevelScalar()?;
        Ok(VolumeStatus {
            volume: (scalar.clamp(0.0, 1.0) * 100.0).round() as u8,
            muted,
        })
    })
}

#[cfg(not(windows))]
#[tauri::command]
pub fn get_master_volume() -> Result<VolumeStatus, String> {
    Err("Windows Core Audio is only available on Windows".into())
}

#[cfg(not(windows))]
#[tauri::command]
pub fn set_master_volume(_value: u8) -> Result<VolumeStatus, String> {
    get_master_volume()
}

#[cfg(not(windows))]
#[tauri::command]
pub fn set_mute_state(_muted: bool) -> Result<VolumeStatus, String> {
    get_master_volume()
}

#[cfg(all(test, windows))]
mod tests {
    use super::{get_master_volume, set_master_volume, set_mute_state};

    #[test]
    fn windows_master_volume_is_bounded_when_endpoint_exists() {
        match get_master_volume() {
            Ok(status) => {
                assert!(status.volume <= 100);
                let volume = set_master_volume(status.volume)
                    .expect("Writing the current master volume should succeed");
                assert!(volume.volume <= 100);
                let mute = set_mute_state(status.muted)
                    .expect("Writing the current mute state should succeed");
                assert_eq!(mute.muted, status.muted);
            }
            Err(error) => {
                eprintln!("No active audio endpoint was available for this test: {error}")
            }
        }
    }
}
