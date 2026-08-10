import { useEffect } from "react";
import { useNotifications } from "../stores/notifications";
import { Icon } from "./ui/Icon";

function relativeTime(timestamp: number) { const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000)); if (minutes < 1) return "Now"; if (minutes < 60) return `${minutes}m`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h`; return `${Math.floor(hours / 24)}d`; }

export function NotificationPanel({ onBack }: { onBack: () => void }) {
  const { notifications, markAllRead, clearAll } = useNotifications();
  useEffect(() => markAllRead(), [markAllRead]);
  return <section className="notification-panel"><header className="panel-header notification-header"><button className="back-button" onClick={onBack} aria-label="Back to system controls"><Icon name="back" size="small" /></button><div><h1>Notifications</h1><p>Nutch alerts</p></div>{notifications.length > 0 && <button className="clear-button" onClick={clearAll}>Clear</button>}</header><div className="notification-list">{notifications.length === 0 && <div className="notifications-empty"><span><Icon name="notifications" size="normal" /></span><strong>All caught up</strong><small>Nutch alerts will appear here.</small></div>}{notifications.map((item) => <article className="notification-card" key={item.id}><span className="notification-icon">N</span><div><header><strong>{item.title}</strong><time>{relativeTime(item.createdAt)}</time></header><p>{item.body}</p></div></article>)}</div><p className="notification-caption">Windows respects your notification permission. This inbox only contains alerts created by Nutch.</p></section>;
}
