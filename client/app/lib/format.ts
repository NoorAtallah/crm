import type { Locale } from "../lib/i18n";

/** Arabic UI uses Western digits — legal case numbers and money read better. */
const NUMERIC_LOCALE: Record<Locale, string> = {
  ar: "ar-JO-u-nu-latn",
  en: "en-JO",
};

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMERIC_LOCALE[locale]).format(value);
}

export function formatCurrency(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMERIC_LOCALE[locale], {
    style: "currency",
    currency: "JOD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMERIC_LOCALE[locale], {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(NUMERIC_LOCALE[locale], {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(NUMERIC_LOCALE[locale], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatWeekday(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(NUMERIC_LOCALE[locale], {
    weekday: "long",
  }).format(new Date(iso));
}

/** Whole days from today. Negative means overdue. */
export function daysFromToday(iso: string): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 864e5);
}
/** Human file size. Western digits in both locales, like the rest of the UI. */
export function formatFileSize(bytes: number, locale: Locale): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = new Intl.NumberFormat(NUMERIC_LOCALE[locale], {
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
  return `${rounded} ${units[unit]}`;
}
