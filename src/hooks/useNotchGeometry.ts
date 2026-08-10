import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { native } from "../lib/native";

export type NotchView = "main" | "settings" | "notes" | "notifications" | "planner" | "search" | "focus" | "onboarding" | "diagnostics";

const COLLAPSED_IDLE = { width: 220, height: 52 };
const SETTINGS = { width: 440, height: 600 };
const NOTES = { width: 430, height: 560 };
const NOTIFICATIONS = { width: 420, height: 480 };
const PLANNER = { width: 440, height: 560 };
const SEARCH = { width: 440, height: 500 };
const FOCUS = { width: 420, height: 420 };
const ONBOARDING = { width: 420, height: 460 };
const DIAGNOSTICS = { width: 440, height: 620 };

export function useNotchGeometry(expanded: boolean, view: NotchView, topOffset: number, monitorId: string, displayStyle: "notch" | "island", collapsedWidth: number, showMedia: boolean, showSystemStats: boolean) {
  const current = useRef(COLLAPSED_IDLE);
  const generation = useRef(0);

  useEffect(() => {
    const expandedHeight = 220 + (showMedia ? 120 : 0) + (showSystemStats ? 82 : 0);
    const target = !expanded ? { width: collapsedWidth, height: 52 } : view === "settings" ? SETTINGS : view === "notes" ? NOTES : view === "notifications" ? NOTIFICATIONS : view === "planner" ? PLANNER : view === "search" ? SEARCH : view === "focus" ? FOCUS : view === "onboarding" ? ONBOARDING : view === "diagnostics" ? DIAGNOSTICS : { width: 420, height: expandedHeight };
    const start = current.current;
    const startedAt = performance.now();
    const myGeneration = ++generation.current;
    const duration = start.width === target.width && start.height === target.height ? 0 : 260;
    let frame = 0;

    const step = (now: number) => {
      if (myGeneration !== generation.current) return;
      const progress = duration === 0 ? 1 : Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const width = start.width + (target.width - start.width) * eased;
      const height = start.height + (target.height - start.height) * eased;
      current.current = { width, height };
      void native.setGeometry(width, height, displayStyle === "notch" ? 0 : topOffset, monitorId);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [expanded, view, topOffset, monitorId, displayStyle, collapsedWidth, showMedia, showSystemStats]);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    let unlistenScale: (() => void) | undefined;
    const offset = displayStyle === "notch" ? 0 : topOffset;
    void appWindow.onScaleChanged(() => void native.reposition(offset, monitorId)).then((fn) => { unlistenScale = fn; });
    const displayTimer = window.setInterval(() => void native.reposition(offset, monitorId), 30_000);
    return () => {
      unlistenScale?.();
      window.clearInterval(displayTimer);
    };
  }, [topOffset, monitorId, displayStyle]);
}
