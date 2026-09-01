import { hrisApi } from "~/lib/hris-api-client";

export interface PayrollNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string | null;
  body: string | null;
  link: string | null;
  relatedId: string | null;
  relatedType: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface ApiDataResponse<T> {
  data: T;
  message?: string;
}

const BASE = "/employee201/notifications";

export const notificationsService = {
  list: (limit = 10, offset = 0) =>
    hrisApi.get<ApiDataResponse<PayrollNotification[]>>(
      `${BASE}?limit=${limit}&offset=${offset}`,
    ),
  unreadCount: () =>
    hrisApi.get<ApiDataResponse<{ count: number }>>(`${BASE}/unread-count`),
  markRead: (id: string) =>
    hrisApi.post<ApiDataResponse<PayrollNotification>>(
      `${BASE}/${encodeURIComponent(id)}/read`,
    ),
  markAllRead: () =>
    hrisApi.post<ApiDataResponse<{ updated: number }>>(`${BASE}/read-all`),
};
