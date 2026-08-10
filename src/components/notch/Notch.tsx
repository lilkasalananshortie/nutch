import { useCallback, useEffect, useRef, useState, type MouseEvent, type WheelEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { useBattery } from "../../hooks/useBattery";
import { useMediaSession } from "../../hooks/useMediaSession";
import { useNotchGeometry, type NotchView } from "../../hooks/useNotchGeometry";
import { usePlanner } from "../../hooks/usePlanner";
import { native } from "../../lib/native";
import { useFocus } from "../../stores/focus";
import { useLiveActivity } from "../../stores/liveActivity";
import { useNotifications } from "../../stores/notifications";
import { useSettings } from "../../stores/settings";
import { FocusPanel } from "../FocusPanel";
import { NotificationPanel } from "../NotificationPanel";
import { PlannerPanel } from "../PlannerPanel";
import { QuickNotesPanel } from "../QuickNotesPanel";
import { SearchPanel } from "../SearchPanel";
import { SettingsPanel } from "../SettingsPanel";
import { CollapsedNotch } from "./CollapsedNotch";
import { ExpandedNotch } from "./ExpandedNotch";

export function Notch() {
  const { settings, ready } = useSettings();
  const { battery } = useBattery();
  const media = useMediaSession(settings.showMedia);
  const planner = usePlanner();
  const focus = useFocus();
  const { current: activity, push, upsert, remove } = useLiveActivity();
  const { unreadCount, addNotification } = useNotifications();
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<NotchView>("main");
  const collapseTimer = useRef(0);
  const lowBatteryAlerted = useRef(false);
  const reminded = useRef(new Set<string>());

  const collapsedWidth = media.media?.available ? 344 : battery?.available || unreadCount > 0 || activity ? 248 : 220;
  useNotchGeometry(expanded, view, settings.topOffset, settings.monitorId, settings.displayStyle, collapsedWidth, settings.showMedia && (media.media?.available || media.error), settings.showSystemStats);

  const cancelCollapse = useCallback(() => window.clearTimeout(collapseTimer.current), []);
  const collapseSoon = useCallback((delay = 650) => {
    cancelCollapse();
    collapseTimer.current = window.setTimeout(() => { setView("main"); setExpanded(false); }, delay);
  }, [cancelCollapse]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void getCurrentWindow().onFocusChanged(({ payload }) => { if (!payload && expanded) collapseSoon(180); }).then((fn) => { unlisten = fn; });
    return () => unlisten?.();
  }, [expanded, collapseSoon]);
  useEffect(() => () => cancelCollapse(), [cancelCollapse]);

  useEffect(() => {
    if (media.media?.available && media.media.playing) upsert({ id: "media", kind: "media", title: media.media.title, detail: media.media.artist || "Now Playing", priority: 30 });
    else remove("media");
  }, [media.media, upsert, remove]);

  useEffect(() => {
    if (focus.session) upsert({ id: "focus", kind: "focus", title: "Focus", detail: `${Math.ceil(focus.session.remainingMs / 60_000)} min`, priority: 40 });
    else remove("focus");
  }, [focus.session, upsert, remove]);

  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      for (const item of planner.items) {
        if (!item.completed && item.reminderAt && item.reminderAt <= now && item.reminderAt > now - 90_000 && !reminded.current.has(item.id)) {
          reminded.current.add(item.id);
          const body = item.scheduledAt ? `Due ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(item.scheduledAt)}.` : "Reminder is due now.";
          addNotification(item.title, body);
          push({ id: `reminder-${item.id}`, kind: "reminder", title: item.title, detail: "Planner reminder", priority: 90, expiresAt: now + 8_000 });
        }
      }
    };
    checkReminders();
    const timer = window.setInterval(checkReminders, 30_000);
    return () => window.clearInterval(timer);
  }, [planner.items, addNotification, push]);

  useEffect(() => {
    const percentage = battery?.percentage;
    if (!settings.notificationsEnabled || percentage === null || percentage === undefined || battery?.pluggedIn) { lowBatteryAlerted.current = false; return; }
    if (percentage <= 15 && !lowBatteryAlerted.current) {
      lowBatteryAlerted.current = true;
      const body = `${percentage}% remaining. Connect a charger soon.`;
      addNotification("Low battery", body);
      push({ id: "battery-low", kind: "battery", title: "Battery low", detail: `${percentage}% remaining`, priority: 90, expiresAt: Date.now() + 7_000 });
      try { sendNotification({ title: "Nutch · Low battery", body }); } catch { /* Native notification is best-effort. */ }
    } else if (percentage > 20) lowBatteryAlerted.current = false;
  }, [battery, settings.notificationsEnabled, addNotification, push]);

  const onVolumeActivity = useCallback((status: { volume: number; muted: boolean }) => {
    if (settings.doNotDisturb || settings.presentationMode) return;
    push({ id: "volume", kind: "volume", title: status.muted ? "Muted" : "Volume", detail: status.muted ? "System audio muted" : `${status.volume}%`, priority: 70, expiresAt: Date.now() + 2_000 });
  }, [push, settings.doNotDisturb, settings.presentationMode]);
  const onWheel = useCallback((event: WheelEvent<HTMLElement>) => {
    if (!settings.mouseWheelVolume || expanded || view !== "main") return;
    event.preventDefault();
    void native.volume().then((status) => native.setVolume(status.volume + (event.deltaY < 0 ? 3 : -3))).then(onVolumeActivity).catch(() => undefined);
  }, [expanded, onVolumeActivity, settings.mouseWheelVolume, view]);
  const handleEnter = () => { cancelCollapse(); if (!ready) return; if (settings.hoverToExpand) setExpanded(true); };
  const handleClick = (event: MouseEvent) => { if (!ready || !settings.clickToExpand || view !== "main") return; if (!expanded) setExpanded(true); else if (event.currentTarget === event.target) setExpanded(false); };
  const openView = (next: NotchView) => { cancelCollapse(); setView(next); setExpanded(true); };

  return <main className={`notch-shell ${expanded ? "expanded" : "collapsed"} view-${view} display-${settings.displayStyle} ${ready ? "ready" : ""}`} onMouseEnter={() => { cancelCollapse(); handleEnter(); }} onMouseLeave={() => { if (view === "main") collapseSoon(); }} onClick={handleClick} onWheel={onWheel} aria-label="Nutch system controls">
    {!expanded && <CollapsedNotch format={settings.timeFormat} battery={battery} unreadCount={unreadCount} activity={activity} media={media.media} minimalIdle={settings.minimalIdleMode} />}
    {expanded && view === "main" && <ExpandedNotch format={settings.timeFormat} battery={battery} media={media.media} mediaError={media.error} unreadCount={unreadCount} onVolumeActivity={onVolumeActivity} onMediaControl={(action) => void media.control(action)} onSettings={() => openView("settings")} onNotes={() => openView("notes")} onNotifications={() => openView("notifications")} onPlanner={() => openView("planner")} onSearch={() => openView("search")} onFocus={() => openView("focus")} />}
    {expanded && view === "settings" && <SettingsPanel onBack={() => setView("main")} />}
    {expanded && view === "notes" && <QuickNotesPanel onBack={() => setView("main")} />}
    {expanded && view === "notifications" && <NotificationPanel onBack={() => setView("main")} />}
    {expanded && view === "planner" && <PlannerPanel onBack={() => setView("main")} />}
    {expanded && view === "search" && <SearchPanel onBack={() => setView("main")} onNotes={() => setView("notes")} onPlanner={() => setView("planner")} onSettings={() => setView("settings")} onFocus={() => setView("focus")} />}
    {expanded && view === "focus" && <FocusPanel onBack={() => setView("main")} />}
  </main>;
}
