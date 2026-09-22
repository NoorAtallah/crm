import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessageSquareQuote,
  Receipt,
  ChartColumn,
  Users,
} from "lucide-react";
import type { Role } from "../../features/auth";
import type { Locale } from "../../lib/i18n";

export interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item (section 10 of the spec). */
  roles: Role[];
}

const STAFF: Role[] = ["owner", "branch_manager", "lawyer", "secretary"];
const MANAGERS: Role[] = ["owner", "branch_manager"];

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, roles: MANAGERS },
  { key: "cases", href: "/cases", icon: Briefcase, roles: STAFF },
  {
    key: "consultations",
    href: "/consultations",
    icon: MessageSquareQuote,
    roles: STAFF,
  },
  { key: "clients", href: "/clients", icon: Users, roles: STAFF },
  { key: "calendar", href: "/calendar", icon: CalendarDays, roles: STAFF },
  { key: "tasks", href: "/tasks", icon: ListChecks, roles: STAFF },
  { key: "documents", href: "/documents", icon: FileText, roles: STAFF },
  { key: "billing", href: "/billing", icon: Receipt, roles: MANAGERS },
  { key: "reports", href: "/reports", icon: ChartColumn, roles: MANAGERS },
  { key: "offices", href: "/offices", icon: Building2, roles: MANAGERS },
];

export const shellDictionaries = {
  ar: {
    nav: {
      dashboard: "لوحة التحكم",
      cases: "القضايا",
      consultations: "الاستشارات",
      clients: "العملاء",
      calendar: "التقويم والجلسات",
      tasks: "المهام",
      documents: "الوثائق",
      billing: "الفوترة",
      reports: "التقارير",
      offices: "المكاتب والموظفون",
    },
    roles: {
      owner: "المدير العام",
      branch_manager: "مدير الفرع",
      lawyer: "محامٍ",
      secretary: "سكرتاريا",
      client: "عميل",
    },
    search: "ابحث عن قضية أو عميل",
    notifications: "الإشعارات",
    signOut: "تسجيل الخروج",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    allOffices: "جميع المكاتب",
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      cases: "Cases",
      consultations: "Consultations",
      clients: "Clients",
      calendar: "Calendar",
      tasks: "Tasks",
      documents: "Documents",
      billing: "Billing",
      reports: "Reports",
      offices: "Offices & staff",
    },
    roles: {
      owner: "Managing partner",
      branch_manager: "Branch manager",
      lawyer: "Lawyer",
      secretary: "Secretary",
      client: "Client",
    },
    search: "Search cases or clients",
    notifications: "Notifications",
    signOut: "Sign out",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    allOffices: "All offices",
  },
} satisfies Record<Locale, unknown>;

export type ShellDict = (typeof shellDictionaries)["en"];
export type NavKey = keyof ShellDict["nav"];