import { Notch } from "./components/notch/Notch";
import { SettingsProvider } from "./stores/settings";
import { NotificationProvider } from "./stores/notifications";
import { LiveActivityProvider } from "./stores/liveActivity";
import { FocusProvider } from "./stores/focus";
import { TimerProvider } from "./stores/timer";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./App.css";

export default function App() {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <LiveActivityProvider>
          <FocusProvider>
            <TimerProvider><Notch /></TimerProvider>
          </FocusProvider>
        </LiveActivityProvider>
      </NotificationProvider>
    </SettingsProvider>
  );
}
