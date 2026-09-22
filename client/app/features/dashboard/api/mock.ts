import type { DashboardSummary } from "../types";
import type { DashboardApi } from "./contract";

/** Development stand-in. Delete once the endpoint is live. */

const OFFICES = {
  off_amman: "مكتب عمّان",
  off_irbid: "مكتب إربد",
  off_aqaba: "مكتب العقبة",
};

const hoursFromNow = (h: number) =>
  new Date(Date.now() + h * 36e5).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString();

const SUMMARY: DashboardSummary = {
  offices: [
    { id: "off_amman", name: OFFICES.off_amman },
    { id: "off_irbid", name: OFFICES.off_irbid },
    { id: "off_aqaba", name: OFFICES.off_aqaba },
  ],

  metrics: {
    totalCases: { value: 184, delta: 6 },
    openCases: { value: 97, delta: -3 },
    hearingsThisWeek: { value: 14, delta: 12 },
    averageProgress: { value: 62, delta: 4 },
    overdueInvoices: { value: 9, delta: 2 },
    uncollected: { value: 48350, delta: -8 },
  },

  caseStatusCounts: [
    { status: "in_progress", count: 41 },
    { status: "hearings", count: 26 },
    { status: "awaiting_documents", count: 18 },
    { status: "new", count: 12 },
    { status: "awaiting_decision", count: 7 },
    { status: "closed", count: 80 },
  ],

  upcomingHearings: [
    {
      id: "h_1",
      caseNumber: "C-2401",
      caseTitle: "مطالبة مالية",
      clientName: "شركة أيمن التجارية",
      lawyerName: "دانا القيسي",
      officeName: OFFICES.off_amman,
      startsAt: hoursFromNow(3),
      conflict: true,
    },
    {
      id: "h_2",
      caseNumber: "C-2388",
      caseTitle: "نزاع عمالي",
      clientName: "مؤسسة النور",
      lawyerName: "مايا العدوان",
      officeName: OFFICES.off_amman,
      startsAt: hoursFromNow(27),
      conflict: false,
    },
    {
      id: "h_3",
      caseNumber: "C-2405",
      caseTitle: "فسخ عقد توريد",
      clientName: "شركة أيمن التجارية",
      lawyerName: "مايا العدوان",
      officeName: OFFICES.off_irbid,
      startsAt: hoursFromNow(52),
      conflict: false,
    },
    {
      id: "h_4",
      caseNumber: "C-2377",
      caseTitle: "دعوى إخلاء",
      clientName: "خالد الرواشدة",
      lawyerName: "سامر الحمود",
      officeName: OFFICES.off_aqaba,
      startsAt: hoursFromNow(75),
      conflict: false,
    },
  ],

  pendingDecisions: [
    {
      id: "cn_1",
      reference: "CN-118",
      subject: "فسخ عقد توريد",
      clientName: "شركة أيمن التجارية",
      teamName: "فريق العقود",
      lawyerName: "مايا العدوان",
      recommendation: "ننصح بإرسال إنذار قبل رفع الدعوى",
      waitingSince: daysAgo(3),
      priority: "high",
    },
    {
      id: "cn_2",
      reference: "CN-115",
      subject: "مراجعة عقد توظيف",
      clientName: "مؤسسة النور",
      teamName: "فريق العمالية",
      lawyerName: "دانا القيسي",
      recommendation: "ننصح بتعديل بند الإنهاء قبل التوقيع",
      waitingSince: daysAgo(1),
      priority: "medium",
    },
    {
      id: "cn_3",
      reference: "CN-112",
      subject: "تأسيس شركة ذات مسؤولية محدودة",
      clientName: "زياد المومني",
      teamName: "فريق الشركات",
      lawyerName: "سامر الحمود",
      recommendation: "اعتماد الرأي كما هو",
      waitingSince: daysAgo(6),
      priority: "low",
    },
  ],

  officePerformance: [
    {
      id: "off_amman",
      name: OFFICES.off_amman,
      openCases: 52,
      progress: 68,
      overdueCases: 4,
    },
    {
      id: "off_irbid",
      name: OFFICES.off_irbid,
      openCases: 31,
      progress: 54,
      overdueCases: 7,
    },
    {
      id: "off_aqaba",
      name: OFFICES.off_aqaba,
      openCases: 14,
      progress: 71,
      overdueCases: 1,
    },
  ],
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockDashboardApi: DashboardApi = {
  async getSummary({ officeId }) {
    await wait(400);
    if (!officeId) return SUMMARY;

    // Narrow the office-scoped slices so the filter visibly does something.
    const office = SUMMARY.officePerformance.find((o) => o.id === officeId);
    const officeName = office?.name;

    return {
      ...SUMMARY,
      metrics: {
        ...SUMMARY.metrics,
        openCases: { value: office?.openCases ?? 0 },
        averageProgress: { value: office?.progress ?? 0 },
      },
      upcomingHearings: SUMMARY.upcomingHearings.filter(
        (h) => h.officeName === officeName
      ),
      officePerformance: office ? [office] : [],
    };
  },
};