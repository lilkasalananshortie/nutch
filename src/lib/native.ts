import { invoke } from "@tauri-apps/api/core";

export interface BatteryStatus {
  available: boolean;
  percentage: number | null;
  charging: boolean;
  pluggedIn: boolean;
}

export interface VolumeStatus {
  volume: number;
  muted: boolean;
}

export interface DisplayInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  scaleFactor: number;
  primary: boolean;
}

export interface MediaStatus {
  available: boolean;
  title: string;
  artist: string;
  album: string;
  source: string;
  playing: boolean;
  positionSeconds: number;
  durationSeconds: number;
  artworkDataUrl: string | null;
  canToggle: boolean;
  canNext: boolean;
  canPrevious: boolean;
}

export interface SystemStats {
  cpuPercent: number;
  memoryPercent: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
}

export interface QuickNote {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
  private: boolean;
}

export interface PlannerItem {
  id: string;
  title: string;
  description: string;
  scheduledAt: number | null;
  reminderAt: number | null;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  timeFormat: "12h" | "24h";
  hoverToExpand: boolean;
  clickToExpand: boolean;
  topOffset: number;
  launchAtStartup: boolean;
  monitorId: string;
  showMedia: boolean;
  showSystemStats: boolean;
  notificationsEnabled: boolean;
  displayStyle: "notch" | "island";
  mouseWheelVolume: boolean;
  minimalIdleMode: boolean;
  doNotDisturb: boolean;
  presentationMode: boolean;
  fullscreenBehavior: "show" | "minimal" | "hide";
  onboardingCompleted: boolean;
  privacyMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  timeFormat: "12h",
  hoverToExpand: true,
  clickToExpand: true,
  topOffset: 6,
  launchAtStartup: false,
  monitorId: "primary",
  showMedia: true,
  showSystemStats: false,
  notificationsEnabled: false,
  displayStyle: "island",
  mouseWheelVolume: true,
  minimalIdleMode: false,
  doNotDisturb: false,
  presentationMode: false,
  fullscreenBehavior: "show",
  onboardingCompleted: false,
  privacyMode: false,
};

export const native = {
  battery: () => invoke<BatteryStatus>("get_battery_status"),
  volume: () => invoke<VolumeStatus>("get_master_volume"),
  setVolume: (value: number) => invoke<VolumeStatus>("set_master_volume", { value: Math.round(Math.max(0, Math.min(100, value))) }),
  setMuted: (muted: boolean) => invoke<VolumeStatus>("set_mute_state", { muted }),
  startAudioEvents: () => invoke<void>("start_audio_events"),
  media: () => invoke<MediaStatus>("get_media_status"),
  controlMedia: (action: "toggle" | "next" | "previous") => invoke<boolean>("control_media", { action }),
  systemStats: () => invoke<SystemStats>("get_system_stats"),
  notes: () => invoke<QuickNote[]>("list_notes"),
  saveNote: (note: QuickNote) => invoke<QuickNote>("save_note", { note }),
  deleteNote: (id: string) => invoke<void>("delete_note", { id }),
  planner: () => invoke<PlannerItem[]>("list_planner_items"),
  savePlannerItem: (item: PlannerItem) => invoke<PlannerItem>("save_planner_item", { item }),
  deletePlannerItem: (id: string) => invoke<void>("delete_planner_item", { id }),
  monitors: () => invoke<DisplayInfo[]>("list_monitors"),
  loadSettings: () => invoke<AppSettings>("load_settings"),
  saveSettings: (settings: AppSettings) => invoke<void>("save_settings", { settings }),
  setGeometry: (width: number, height: number, topOffset: number, monitorId: string) => invoke<void>("set_notch_geometry", { width, height, topOffset, monitorId }),
  reposition: (topOffset: number, monitorId: string) => invoke<void>("reposition_notch", { topOffset, monitorId }),
  quit: () => invoke<void>("quit_nutch"),
  exportBackup: (destination: string) => invoke<void>("export_backup", { destination }),
  restoreBackup: (source: string) => invoke<void>("restore_backup", { source }),
};
