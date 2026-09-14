export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  category: string;
  severity: "info" | "success" | "warning" | "danger" | string;
  event_type: string;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
  dismissed_at: string | null;
};

export type NotificationList = {
  items: NotificationItem[];
  total: number;
  unread: number;
};
