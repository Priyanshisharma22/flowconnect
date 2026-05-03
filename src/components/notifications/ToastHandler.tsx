import { useEffect, useContext } from "react";
import { NotificationContext } from "../../context/NotificationContext";
import toast, { Toaster } from "react-hot-toast";

export default function ToastHandler() {
  const { notifications } = useContext(NotificationContext);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      toast.success(latest.content);
    }
  }, [notifications]);

  return <Toaster position="top-right" />;
}