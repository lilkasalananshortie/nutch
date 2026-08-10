use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemStats {
    cpu_percent: f64,
    memory_percent: f64,
    memory_used_gb: f64,
    memory_total_gb: f64,
}

#[cfg(windows)]
fn filetime_value(value: windows::Win32::Foundation::FILETIME) -> u64 {
    (u64::from(value.dwHighDateTime) << 32) | u64::from(value.dwLowDateTime)
}

#[cfg(windows)]
#[tauri::command]
pub fn get_system_stats() -> Result<SystemStats, String> {
    use std::mem::size_of;
    use std::sync::{LazyLock, Mutex};
    use windows::Win32::Foundation::FILETIME;
    use windows::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};
    use windows::Win32::System::Threading::GetSystemTimes;

    static PREVIOUS: LazyLock<Mutex<Option<(u64, u64, u64)>>> = LazyLock::new(|| Mutex::new(None));

    unsafe {
        let mut idle = FILETIME::default();
        let mut kernel = FILETIME::default();
        let mut user = FILETIME::default();
        GetSystemTimes(Some(&mut idle), Some(&mut kernel), Some(&mut user))
            .map_err(|error| format!("Unable to read Windows CPU usage: {error}"))?;
        let current = (
            filetime_value(idle),
            filetime_value(kernel),
            filetime_value(user),
        );
        let mut previous = PREVIOUS.lock().map_err(|_| "CPU statistics lock failed")?;
        let cpu_percent = previous
            .map(|old| {
                let idle_delta = current.0.saturating_sub(old.0);
                let total_delta = current.1.saturating_sub(old.1) + current.2.saturating_sub(old.2);
                if total_delta == 0 {
                    0.0
                } else {
                    (100.0 * (1.0 - idle_delta as f64 / total_delta as f64)).clamp(0.0, 100.0)
                }
            })
            .unwrap_or(0.0);
        *previous = Some(current);

        let mut memory = MEMORYSTATUSEX {
            dwLength: size_of::<MEMORYSTATUSEX>() as u32,
            ..Default::default()
        };
        GlobalMemoryStatusEx(&mut memory)
            .map_err(|error| format!("Unable to read Windows memory usage: {error}"))?;
        let total = memory.ullTotalPhys as f64;
        let used = total - memory.ullAvailPhys as f64;
        Ok(SystemStats {
            cpu_percent,
            memory_percent: if total == 0.0 {
                0.0
            } else {
                used / total * 100.0
            },
            memory_used_gb: used / 1_073_741_824.0,
            memory_total_gb: total / 1_073_741_824.0,
        })
    }
}

#[cfg(not(windows))]
#[tauri::command]
pub fn get_system_stats() -> Result<SystemStats, String> {
    Err("Windows system statistics are only available on Windows".into())
}

#[cfg(all(test, windows))]
mod tests {
    use super::get_system_stats;

    #[test]
    fn system_stats_are_bounded() {
        let _ = get_system_stats().expect("First system-statistics sample should succeed");
        let stats = get_system_stats().expect("Second system-statistics sample should succeed");
        assert!((0.0..=100.0).contains(&stats.cpu_percent));
        assert!((0.0..=100.0).contains(&stats.memory_percent));
        assert!(stats.memory_total_gb > 0.0);
    }
}
