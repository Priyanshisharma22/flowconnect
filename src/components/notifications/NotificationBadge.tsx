import { useContext } from "react";
import { NotificationContext } from "../../context/NotificationContext";

export default function NotificationBadge() {
  const { notifications } = useContext(NotificationContext);

  const unread = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="relative cursor-pointer">
      🔔
      {unread > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full">
          {unread}
        </span>
      )}
    </div>
  );
}