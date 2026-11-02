"use client";

import { PageHeader } from "../../../components/ui";
import type { Locale } from "../../../lib/i18n";
import type { TasksDict } from "../i18n";
import type { AssigneeOption, TaskCaseOption } from "../types";
import { TasksBoard } from "./TasksBoard";

export function TasksView({
  cases,
  assignees,
  viewerId,
  manageAll,
  canManageOwn,
  t,
  locale,
}: {
  cases: TaskCaseOption[];
  assignees: AssigneeOption[];
  viewerId: string;
  manageAll: boolean;
  canManageOwn: boolean;
  t: TasksDict;
  locale: Locale;
}) {
  const lawyerOf = new Map(cases.map((c) => [c.id, c.assignedLawyerEmployeeId]));
  return (
    <div className="space-y-5">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <TasksBoard
        cases={cases}
        assignees={assignees}
        viewerId={viewerId}
        canManage={(id) => manageAll || (canManageOwn && lawyerOf.get(id) === viewerId)}
        showAssigneeFilter={manageAll}
        t={t}
        locale={locale}
      />
    </div>
  );
}
