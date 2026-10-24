import type { AppNotification } from "@/types/user";
import { get, getPaginated, send } from "./api-client";

export const notificationsService = {
  list: (params: { page?: number; unread?: boolean }) =>
    getPaginated<AppNotification>("/notifications", {
      ...params,
      unread: params.unread ? 1 : undefined,
    }),
  unreadCount: () => get<{ count: number }>("/notifications/unread-count"),
  markAsRead: (id: string) => send<AppNotification>("post", `/notifications/${id}/read`),
  markAllAsRead: () => send<{ updated: number }>("post", "/notifications/read-all"),
};
