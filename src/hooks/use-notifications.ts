import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "~/api-services/notifications.service";
import {
  getNotificationsQuery,
  getUnreadNotificationsQuery,
  notificationsKeys,
} from "~/queries/notifications";

export const useNotifications = () => useQuery(getNotificationsQuery());

export const useUnreadNotificationCount = () =>
  useQuery(getUnreadNotificationsQuery());

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
};
