import { http } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type { AppNotification, PagedResult } from "../types";

export interface NotificationsApi {
  list(query?: { unreadOnly?: boolean; page?: number; pageSize?: number; search?: string }): Promise<PagedResult<AppNotification>>;
  markRead(id: string): Promise<void>;
}

export const notificationsApi: NotificationsApi = {
  list: (query = {}) => http<PagedResult<AppNotification>>(`/api/notifications${toQuery(query)}`),
  async markRead(id) {
    await http<null>(`/api/notifications/${id}/read`, { method: "POST" });
  },
};
