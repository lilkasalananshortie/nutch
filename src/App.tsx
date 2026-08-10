import { Notch } from "./components/notch/Notch";
import { SettingsProvider } from "./stores/settings";
import { NotificationProvider } from "./stores/notifications";
import { LiveActivityProvider } from "./stores/liveActivity";
import { FocusProvider } from "./stores/focus";
import "./App.css";

export default function App() {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <LiveActivityProvider>
          <FocusProvider>
            <Notch />
          </FocusProvider>
        </LiveActivityProvider>
      </NotificationProvider>
    </SettingsProvider>
  );
}
