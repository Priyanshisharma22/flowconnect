export const fetchNotifications = async (userId: string) => {
  const res = await fetch(`/api/notifications/${userId}`);
  return res.json();
};

export const markAsRead = async (id: string) => {
  await fetch(`/api/notifications/${id}/read`, {
    method: "PUT",
  });
};