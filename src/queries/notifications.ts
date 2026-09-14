import { queryOptions } from "@tanstack/react-query";
import { notificationsService } from "~/api-services/notifications.service";

export const notificationsKeys = {
  all: ["payroll-notifications"] as const,
  list: () => [...notificationsKeys.all, "list"] as const,
  unread: () => [...notificationsKeys.all, "unread"] as const,
};

export const getNotificationsQuery = () =>
  queryOptions({
    queryKey: notificationsKeys.list(),
    queryFn: () => notificationsService.list(15, 0),
    refetchInterval: 60_000,
  });

export const getUnreadNotificationsQuery = () =>
  queryOptions({
    queryKey: notificationsKeys.unread(),
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 60_000,
  });
