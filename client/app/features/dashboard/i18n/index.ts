import type { Locale } from "../../../lib/i18n";

/** Serializable values only — placeholders, never functions. */
export const dashboardDictionaries = {
  ar: {
    greeting: "أهلاً، {name}",
    subtitle: "ملخّص العمل عبر مكاتب المكتب اليوم.",
    officeFilter: "المكتب",
    allOffices: "جميع المكاتب",

    metrics: {
      totalCases: "إجمالي القضايا",
      openCases: "القضايا المفتوحة",
      hearingsThisWeek: "جلسات هذا الأسبوع",
      averageProgress: "معدّل التقدّم",
      overdueInvoices: "فواتير متأخرة",
      uncollected: "مبالغ غير محصّلة",
    },
    vsLastMonth: "مقارنة بالشهر الماضي",

    caseStatusTitle: "القضايا حسب الحالة",
    caseStatus: {
      new: "جديدة",
      in_progress: "قيد المتابعة",
      hearings: "جلسات",
      awaiting_documents: "بانتظار مستندات",
      awaiting_decision: "بانتظار قرار إداري",
      closed: "مغلقة",
    },
    casesUnit: "قضية",

    hearingsTitle: "الجلسات القادمة",
    hearingsEmpty: "لا توجد جلسات مجدولة لهذا المكتب.",
    conflict: "تعارض مواعيد",
    today: "اليوم",
    tomorrow: "غداً",

    decisionsTitle: "بانتظار القرار النهائي",
    decisionsEmpty: "لا توجد استشارات بانتظار اعتمادك.",
    waitingDays: "منذ {count} أيام",
    waitingOneDay: "منذ يوم واحد",
    recommendation: "توصية الفريق",
    review: "مراجعة",
    priority: { high: "أولوية عالية", medium: "أولوية متوسطة", low: "أولوية منخفضة" },

    officesTitle: "أداء المكاتب",
    openCasesShort: "قضايا مفتوحة",
    progressShort: "نسبة الإنجاز",
    overdueShort: "متأخرة",

    viewAll: "عرض الكل",
  },

  en: {
    greeting: "Welcome back, {name}",
    subtitle: "Today's picture across the firm.",
    officeFilter: "Office",
    allOffices: "All offices",

    metrics: {
      totalCases: "Total cases",
      openCases: "Open cases",
      hearingsThisWeek: "Hearings this week",
      averageProgress: "Average progress",
      overdueInvoices: "Overdue invoices",
      uncollected: "Uncollected",
    },
    vsLastMonth: "vs last month",

    caseStatusTitle: "Cases by status",
    caseStatus: {
      new: "New",
      in_progress: "In progress",
      hearings: "In hearings",
      awaiting_documents: "Awaiting documents",
      awaiting_decision: "Awaiting decision",
      closed: "Closed",
    },
    casesUnit: "cases",

    hearingsTitle: "Upcoming hearings",
    hearingsEmpty: "No hearings scheduled for this office.",
    conflict: "Schedule conflict",
    today: "Today",
    tomorrow: "Tomorrow",

    decisionsTitle: "Awaiting your decision",
    decisionsEmpty: "Nothing is waiting on your approval.",
    waitingDays: "Waiting {count} days",
    waitingOneDay: "Waiting 1 day",
    recommendation: "Team recommends",
    review: "Review",
    priority: { high: "High priority", medium: "Medium priority", low: "Low priority" },

    officesTitle: "Office performance",
    openCasesShort: "Open cases",
    progressShort: "Progress",
    overdueShort: "Overdue",

    viewAll: "View all",
  },
} satisfies Record<Locale, unknown>;

export type DashboardDict = (typeof dashboardDictionaries)["en"];