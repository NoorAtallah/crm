/**
 * In-app notifications for the signed-in user.
 *   GET  /api/notifications?unreadOnly&page&pageSize&search → PagedResult<AppNotification>
 *   POST /api/notifications/{id}/read
 * Payloads are generic (kind + resource id); details stay behind their own endpoints.
 */
export interface AppNotification {
  id: string;
  resourceId: string;
  /** e.g. "task.assigned", "appointment.reminder". */
  kind: string | null;
  availableAtUtc: string;
  deliveredAtUtc: string | null;
  readAtUtc: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
