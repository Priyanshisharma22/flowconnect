import { NotificationProvider } from "./context/NotificationContext";
import ToastHandler from "./components/notifications/ToastHandler";

function App() {
  return (
    <NotificationProvider>
      <ToastHandler />
      {/* app routes */}
    </NotificationProvider>
  );
}