import type { Locale } from "../../../lib/i18n";

export const notificationsDictionaries = {
  ar: {
    title: "الإشعارات",
    empty: "لا توجد إشعارات.",
    unreadOnly: "غير المقروءة",
    markAll: "تعليم الكل كمقروء",
    loadError: "تعذّر تحميل الإشعارات.",
    kinds: {
      "task.assigned": "أُسندت إليك مهمة",
      "task.created": "مهمة جديدة",
      "task.updated": "تم تعديل مهمة",
      "task.status.changed": "تغيّرت حالة مهمة",
      "task.reminder": "تذكير: موعد استحقاق مهمة",
      "appointment.scheduled": "موعد جديد",
      "appointment.changed": "تغيّر موعد",
      "appointment.updated": "تم تعديل موعد",
      "appointment.cancelled": "أُلغي موعد",
      "appointment.completed": "أُنجز موعد",
      "appointment.reminder": "تذكير: موعد بعد ساعة",
    } as Record<string, string>,
    other: "إشعار",
  },
  en: {
    title: "Notifications",
    empty: "No notifications.",
    unreadOnly: "Unread",
    markAll: "Mark all read",
    loadError: "Couldn't load notifications.",
    kinds: {
      "task.assigned": "A task was assigned to you",
      "task.created": "New task",
      "task.updated": "A task was updated",
      "task.status.changed": "A task changed status",
      "task.reminder": "Reminder: a task is due",
      "appointment.scheduled": "New appointment",
      "appointment.changed": "An appointment changed",
      "appointment.updated": "An appointment was updated",
      "appointment.cancelled": "An appointment was cancelled",
      "appointment.completed": "An appointment was completed",
      "appointment.reminder": "Reminder: appointment in an hour",
    } as Record<string, string>,
    other: "Notification",
  },
} satisfies Record<Locale, unknown>;

export type NotificationsDict = (typeof notificationsDictionaries)["en"];
