"use client";

import { PageHeader } from "../../../components/ui";
import type { Locale } from "../../../lib/i18n";
import type { AppointmentsDict } from "../i18n";
import type { CaseOption, LawyerOption } from "../types";
import { AppointmentsBoard } from "./AppointmentsBoard";

export function CalendarView({
  cases,
  lawyers,
  manageAll,
  viewerId,
  canManageOwn,
  t,
  locale,
}: {
  cases: CaseOption[];
  lawyers: LawyerOption[];
  manageAll: boolean;
  viewerId: string;
  canManageOwn: boolean;
  t: AppointmentsDict;
  locale: Locale;
}) {
  const lawyerOf = new Map(cases.map((c) => [c.id, c.assignedLawyerEmployeeId]));
  return (
    <div className="space-y-5">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <AppointmentsBoard
        cases={cases}
        lawyers={lawyers}
        canManage={(caseId) => manageAll || (canManageOwn && lawyerOf.get(caseId) === viewerId)}
        showLawyerFilter={manageAll}
        t={t}
        locale={locale}
      />
    </div>
  );
}
