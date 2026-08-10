import { useEffect, useState, type CSSProperties } from "react";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { open, save } from "@tauri-apps/plugin-dialog";
import { DEFAULT_SETTINGS, native, type DisplayInfo } from "../lib/native";
import { useSettings } from "../stores/settings";
import { useNotifications } from "../stores/notifications";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}><span /></button>;
}

export function SettingsPanel({ onBack, onSetup, onDiagnostics }: { onBack: () => void; onSetup: () => void; onDiagnostics: () => void }) {
  const { settings, update, error } = useSettings();
  const { addNotification } = useNotifications();
  const interactionWarning = !settings.hoverToExpand || !settings.clickToExpand;
  const [topOffset, setTopOffset] = useState(settings.topOffset);
  const [monitors, setMonitors] = useState<DisplayInfo[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  useEffect(() => setTopOffset(settings.topOffset), [settings.topOffset]);
  useEffect(() => { void native.monitors().then(setMonitors).catch(() => setMonitors([])); }, []);
  const commitTopOffset = () => {
    if (topOffset !== settings.topOffset) void update({ topOffset });
  };
  const changeNotifications = async (enabled: boolean) => {
    setNotificationMessage(null);
    if (enabled) {
      let granted = await isPermissionGranted();
      if (!granted) granted = await requestPermission() === "granted";
      if (!granted) {
        setNotificationMessage("Windows notification permission was not granted.");
        return;
      }
    }
    await update({ notificationsEnabled: enabled });
  };
  const testNotification = async () => {
    try {
      sendNotification({ title: "Nutch", body: "Native Windows notifications are ready." });
      addNotification("Test notification", "Native Windows notifications are ready.");
      setNotificationMessage("Test notification sent.");
    } catch {
      setNotificationMessage("Install Nutch before testing notifications.");
    }
  };
  const resetAppearance = () => void update({ displayStyle: DEFAULT_SETTINGS.displayStyle, topOffset: DEFAULT_SETTINGS.topOffset, minimalIdleMode: DEFAULT_SETTINGS.minimalIdleMode, fullscreenBehavior: DEFAULT_SETTINGS.fullscreenBehavior });
  const applyProfile = (profile: typeof settings.profile) => {
    const policy = profile === "presentation" ? { doNotDisturb: true, presentationMode: true } : profile === "study" || profile === "gaming" ? { doNotDisturb: true, presentationMode: false } : { doNotDisturb: false, presentationMode: false };
    void update({ profile, ...policy });
  };
  const resetAllSettings = () => { if (window.confirm("Reset Nutch settings? Notes and Planner data will be preserved.")) void update({ ...DEFAULT_SETTINGS, onboardingCompleted: true }); };
  const exportBackup = async () => {
    setDataMessage(null);
    const destination = await save({ defaultPath: "Nutch-backup.json", filters: [{ name: "Nutch backup", extensions: ["json"] }] });
    if (!destination || Array.isArray(destination)) return;
    try { await native.exportBackup(destination); setDataMessage("Backup exported successfully."); } catch (reason) { setDataMessage(reason instanceof Error ? reason.message : String(reason)); }
  };
  const restoreBackup = async () => {
    setDataMessage(null);
    if (!window.confirm("Restore this backup? Current Settings, Notes, and Planner data will be replaced.")) return;
    const source = await open({ multiple: false, directory: false, filters: [{ name: "Nutch backup", extensions: ["json"] }] });
    if (!source || Array.isArray(source)) return;
    try { await native.restoreBackup(source); setDataMessage("Backup restored. Restart Nutch to reload the restored data."); } catch (reason) { setDataMessage(reason instanceof Error ? reason.message : String(reason)); }
  };
  return (
    <div className="settings-panel">
      <header className="panel-header">
        <button className="back-button" onClick={onBack} aria-label="Back to system controls">←</button>
        <div><h1>Settings</h1><p>Personalize Nutch</p></div>
      </header>
      <div className="settings-list">
        <div className="setting-row"><span><strong>Launch with Windows</strong><small>Start quietly after sign-in</small></span><Toggle label="Launch Nutch with Windows" checked={settings.launchAtStartup} onChange={(value) => void update({ launchAtStartup: value })} /></div>
        <div className="setting-row"><span><strong>Time format</strong><small>Local system time</small></span><div className="segmented" role="group" aria-label="Time format"><button className={settings.timeFormat === "12h" ? "selected" : ""} onClick={() => void update({ timeFormat: "12h" })}>12H</button><button className={settings.timeFormat === "24h" ? "selected" : ""} onClick={() => void update({ timeFormat: "24h" })}>24H</button></div></div>
        <div className="setting-row"><span><strong>Display style</strong><small>Top-connected notch or floating island</small></span><div className="segmented" role="group" aria-label="Display style"><button className={settings.displayStyle === "notch" ? "selected" : ""} onClick={() => void update({ displayStyle: "notch" })}>Notch</button><button className={settings.displayStyle === "island" ? "selected" : ""} onClick={() => void update({ displayStyle: "island" })}>Island</button></div></div>
        <div className="setting-row"><span><strong>Hover to expand</strong><small>Open when pointer enters</small></span><Toggle label="Hover to expand" checked={settings.hoverToExpand} onChange={(value) => { if (value || settings.clickToExpand) void update({ hoverToExpand: value }); }} /></div>
        <div className="setting-row"><span><strong>Click to expand</strong><small>Open with a click</small></span><Toggle label="Click to expand" checked={settings.clickToExpand} onChange={(value) => { if (value || settings.hoverToExpand) void update({ clickToExpand: value }); }} /></div>
        <div className="setting-row"><span><strong>Wheel volume</strong><small>Scroll over collapsed Nutch</small></span><Toggle label="Mouse wheel volume" checked={settings.mouseWheelVolume} onChange={(value) => void update({ mouseWheelVolume: value })} /></div>
        <div className="setting-row"><span><strong>Minimal idle</strong><small>Keep only the clock when idle</small></span><Toggle label="Minimal idle mode" checked={settings.minimalIdleMode} onChange={(value) => void update({ minimalIdleMode: value })} /></div>
        <div className="setting-row"><span><strong>Do not disturb</strong><small>Suppress routine live activity feedback</small></span><Toggle label="Do not disturb" checked={settings.doNotDisturb} onChange={(value) => void update({ doNotDisturb: value })} /></div>
      <div className="setting-row"><span><strong>Presentation mode</strong><small>Keep routine alerts quiet while presenting</small></span><Toggle label="Presentation mode" checked={settings.presentationMode} onChange={(value) => void update({ presentationMode: value })} /></div>
        <div className="setting-row"><span><strong>Privacy mode</strong><small>Hide song and activity titles on the surface</small></span><Toggle label="Privacy mode" checked={settings.privacyMode} onChange={(value) => void update({ privacyMode: value })} /></div>
        <div className="setting-row"><span><strong>Profile</strong><small>Apply a quiet, work, study, gaming, or presentation policy</small></span><div className="segmented profile-segmented" role="group" aria-label="Nutch profile"><button className={settings.profile === "default" ? "selected" : ""} onClick={() => applyProfile("default")}>Default</button><button className={settings.profile === "work" ? "selected" : ""} onClick={() => applyProfile("work")}>Work</button><button className={settings.profile === "study" ? "selected" : ""} onClick={() => applyProfile("study")}>Study</button><button className={settings.profile === "gaming" ? "selected" : ""} onClick={() => applyProfile("gaming")}>Gaming</button><button className={settings.profile === "presentation" ? "selected" : ""} onClick={() => applyProfile("presentation")}>Present</button></div></div>
        <div className="setting-row"><span><strong>Fullscreen behavior</strong><small>Choose the future fullscreen policy</small></span><div className="segmented" role="group" aria-label="Fullscreen behavior"><button className={settings.fullscreenBehavior === "show" ? "selected" : ""} onClick={() => void update({ fullscreenBehavior: "show" })}>Show</button><button className={settings.fullscreenBehavior === "minimal" ? "selected" : ""} onClick={() => void update({ fullscreenBehavior: "minimal" })}>Minimal</button><button className={settings.fullscreenBehavior === "hide" ? "selected" : ""} onClick={() => void update({ fullscreenBehavior: "hide" })}>Hide</button></div></div>
        <label className="setting-row"><span><strong>Display</strong><small>Choose where Nutch appears</small></span><select className="monitor-select" value={settings.monitorId} onChange={(event) => void update({ monitorId: event.target.value })}><option value="primary">Primary display</option>{monitors.filter((monitor) => !monitor.primary).map((monitor) => <option key={monitor.id} value={monitor.id}>{monitor.name} · {monitor.width}×{monitor.height}</option>)}</select></label>
        <div className="setting-row"><span><strong>Media controls</strong><small>Windows playback and artwork</small></span><Toggle label="Show media controls" checked={settings.showMedia} onChange={(value) => void update({ showMedia: value })} /></div>
        <div className="setting-row"><span><strong>System widgets</strong><small>CPU and memory meters</small></span><Toggle label="Show system widgets" checked={settings.showSystemStats} onChange={(value) => void update({ showSystemStats: value })} /></div>
        <div className="setting-row"><span><strong>Notifications</strong><small>Low-battery and Nutch alerts</small></span><div className="notification-actions"><Toggle label="Enable Nutch notifications" checked={settings.notificationsEnabled} onChange={(value) => void changeNotifications(value)} />{settings.notificationsEnabled && <button className="test-button" onClick={() => void testNotification()}>Test</button>}</div></div>
        <label className="offset-row"><span><strong>Top offset</strong><output>{Math.round(topOffset)} px</output></span><input aria-label="Top offset" type="range" min="0" max="30" value={topOffset} style={{ "--volume": `${topOffset / 30 * 100}%` } as CSSProperties} onChange={(event) => { const value = Number(event.target.value); setTopOffset(value); void native.reposition(value, settings.monitorId); }} onPointerUp={commitTopOffset} onKeyUp={commitTopOffset} onBlur={commitTopOffset} /></label>
      </div>
      {interactionWarning && <p className="settings-note">At least one expand method stays enabled so settings remain reachable.</p>}
      {error && <p className="inline-error">{error}</p>}
      {notificationMessage && <p className="settings-note">{notificationMessage}</p>}
      <button className="secondary-button" onClick={onSetup}>Run setup again</button>
      <button className="secondary-button" onClick={onDiagnostics}>About & diagnostics</button>
      <button className="secondary-button" onClick={resetAppearance}>Reset appearance</button>
      <button className="secondary-button" onClick={resetAllSettings}>Reset all settings</button>
      <div className="settings-data"><strong>Data</strong><small>Versioned local backup for Settings, Notes, and Planner</small><div><button className="secondary-button" onClick={() => void exportBackup()}>Export backup</button><button className="secondary-button" onClick={() => void restoreBackup()}>Restore backup</button></div>{dataMessage && <p className="settings-note">{dataMessage}</p>}</div>
      <button className="quit-button" onClick={() => void native.quit()}>Quit Nutch</button>
    </div>
  );
}
