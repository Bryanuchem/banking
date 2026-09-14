import { apiClient } from "@/api/client";
import type { NotificationList } from "@/types/notifications";

export async function getNotifications(params?: { unread_only?: boolean; category?: string }) {
  const { data } = await apiClient.get<NotificationList>("/notifications", { params });
  return data;
}
export async function getUnreadNotificationCount() {
  const { data } = await apiClient.get<{ unread: number }>("/notifications/unread-count");
  return data;
}
export async function markNotificationRead(id: string) {
  await apiClient.patch(`/notifications/${id}/read`);
}
export async function markAllNotificationsRead() {
  await apiClient.post("/notifications/read-all");
}
export async function dismissNotification(id: string) {
  await apiClient.delete(`/notifications/${id}`);
}
