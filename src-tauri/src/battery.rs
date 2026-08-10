use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatteryStatus {
    available: bool,
    percentage: Option<u8>,
    charging: bool,
    plugged_in: bool,
}

#[cfg(windows)]
#[tauri::command]
pub fn get_battery_status() -> Result<BatteryStatus, String> {
    use windows::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};

    let mut status = SYSTEM_POWER_STATUS::default();
    unsafe { GetSystemPowerStatus(&mut status) }
        .map_err(|error| format!("Unable to read Windows power status: {error}"))?;

    let available = status.BatteryFlag != 128 && status.BatteryLifePercent != 255;
    let plugged_in = status.ACLineStatus == 1;
    let charging = available && status.BatteryFlag & 8 != 0;

    Ok(BatteryStatus {
        available,
        percentage: available.then_some(status.BatteryLifePercent.min(100)),
        charging,
        plugged_in,
    })
}

#[cfg(all(test, windows))]
mod tests {
    use super::get_battery_status;

    #[test]
    fn windows_power_status_is_bounded_or_unavailable() {
        let status = get_battery_status().expect("Windows power status should be readable");
        if status.available {
            assert!(
                status
                    .percentage
                    .is_some_and(|percentage| percentage <= 100)
            );
        } else {
            assert!(status.percentage.is_none());
        }
    }
}

#[cfg(not(windows))]
#[tauri::command]
pub fn get_battery_status() -> Result<BatteryStatus, String> {
    Ok(BatteryStatus {
        available: false,
        percentage: None,
        charging: false,
        plugged_in: true,
    })
}
