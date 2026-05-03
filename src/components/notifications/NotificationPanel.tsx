import { useContext } from "react";
import { NotificationContext } from "../../context/NotificationContext";
import { markAsRead } from "../../api/notificationApi";

export default function NotificationPanel() {
  const { notifications, setNotifications } = useContext(NotificationContext);

  const handleRead = async (id: string) => {
    await markAsRead(id);

    setNotifications((prev: any) =>
      prev.map((n: any) =>
        n._id === id ? { ...n, isRead: true } : n
      )
    );
  };

  return (
    <div className="w-80 bg-white shadow-lg rounded-lg p-3">
      {notifications.map((n: any) => (
        <div
          key={n._id}
          onClick={() => handleRead(n._id)}
          className={`p-2 border-b cursor-pointer ${
            n.isRead ? "text-gray-400" : "font-bold"
          }`}
        >
          {n.content}
        </div>
      ))}
    </div>
  );
}