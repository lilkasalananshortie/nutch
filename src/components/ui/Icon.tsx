import type { ReactNode } from "react";

export type IconName = "music" | "notes" | "planner" | "search" | "focus" | "notifications" | "settings" | "battery" | "bolt" | "back" | "plus" | "volume";

const paths: Record<IconName, ReactNode> = {
  music: <path d="M9 4v11.2a3 3 0 1 1-1.2-2.4V6.2L18 4v8.2a3 3 0 1 1-1.2-2.4V2.6L9 4Z" />,
  notes: <path d="M5 3.5h10l2 2v15H5v-17Zm2 3h7M7 10h7M7 13h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  planner: <path d="M5 4h14v15H5zM8 2v4M16 2v4M5 8h14M8 12h3M13 12h3M8 15h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
  search: <path d="m15.5 15.5 4 4M10.8 17a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  focus: <><circle cx="12" cy="12" r="7.8" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="2.1" /></>,
  notifications: <path d="M6.5 16.5h11l-1.2-1.8V10a4.3 4.3 0 0 0-8.6 0v4.7l-1.2 1.8ZM10 19h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  settings: <path d="m12 3 1 1.8 2 .5 1.8-1 1.9 1.9-1 1.8.5 2L20 11v2l-1.8 1-.5 2 1 1.8-1.9 1.9-1.8-1-2 .5-1 1.8h-2l-1-1.8-2-.5-1.8 1L3.3 18l1-1.8-.5-2L2 13v-2l1.8-1 .5-2-1-1.8L5.2 4.3l1.8 1 2-.5L10 3h2Zm0 12.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />,
  battery: <path d="M3.5 7.5h14v9h-14zM19 10h1.5v4H19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  bolt: <path d="m13 2-7 10h5l-1 6 7-10h-5l1-6Z" />,
  back: <path d="m14.5 5.5-6.5 6.5 6.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  plus: <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  volume: <path d="M4 10h3l4-3.5v11L7 14H4v-4Zm9 1.5a3 3 0 0 1 0 1M15 8.5a5.5 5.5 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
};

export function Icon({ name, size = "normal" }: { name: IconName; size?: "small" | "normal" | "large" }) {
  return <svg className={`nutch-icon nutch-icon-${size}`} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
