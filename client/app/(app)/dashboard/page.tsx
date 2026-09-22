import { Suspense } from "react";
import type { Metadata } from "next";
import { authApi } from "../../features/auth";
import {
  CaseStatusChart,
  MetricCards,
  OfficeFilter,
  OfficePerformance,
  PendingDecisions,
  UpcomingHearings,
  dashboardApi,
  dashboardDictionaries,
} from "../../features/dashboard";
import { getDictionary, getLocale, interpolate } from "../../lib/i18n";

export const metadata: Metadata = { title: "Dashboard · Legal CRM" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ office?: string }>;
}) {
  const { office } = await searchParams;
  const officeId = office ?? null;

  const [locale, t, session, summary] = await Promise.all([
    getLocale(),
    getDictionary(dashboardDictionaries),
    authApi.currentSession(),
    dashboardApi.getSummary({ officeId }),
  ]);

  // A branch manager sees only their own office; the filter is theirs to use.
  const firstName = session?.user.fullName.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">
            {interpolate(t.greeting, { name: firstName })}
          </h1>
          <p className="mt-1 text-[14px] text-text-muted">{t.subtitle}</p>
        </div>

        <Suspense fallback={<div className="h-10 w-44" />}>
          <OfficeFilter
            offices={summary.offices}
            selected={officeId}
            t={t}
          />
        </Suspense>
      </header>

      <MetricCards metrics={summary.metrics} t={t} locale={locale} />

      {/* Hearings lead: time-bound and the most perishable information here */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <UpcomingHearings
            hearings={summary.upcomingHearings}
            t={t}
            locale={locale}
          />
          <OfficePerformance
            offices={summary.officePerformance}
            t={t}
            locale={locale}
          />
        </div>

        <div className="space-y-5">
          <PendingDecisions
            decisions={summary.pendingDecisions}
            t={t}
            locale={locale}
          />
          <CaseStatusChart
            counts={summary.caseStatusCounts}
            t={t}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}