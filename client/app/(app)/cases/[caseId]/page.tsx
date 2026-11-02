import type { Metadata } from "next";
import { appointmentsDictionaries } from "../../../features/appointments";
import { authApi } from "../../../features/auth";
import { caseDocumentsDictionaries } from "../../../features/case-documents";
import { decisionReportsDictionaries } from "../../../features/decision-reports";
import { tasksDictionaries } from "../../../features/tasks";
import { communicationsDictionaries } from "../../../features/communications";
import { financeDictionaries } from "../../../features/finance";
import { CaseDetailView, casesApi, casesDictionaries, type CaseFile } from "../../../features/cases";
import { Alert } from "../../../components/ui";
import { HttpError } from "../../../lib/http";
import { getDictionary, getLocale } from "../../../lib/i18n";

export const metadata: Metadata = { title: "Case · Legal CRM" };

export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const [locale, t, appointmentsT, documentsT, reportsT, tasksT, commsT, financeT, session, people] = await Promise.all([
    getLocale(),
    getDictionary(casesDictionaries),
    getDictionary(appointmentsDictionaries),
    getDictionary(caseDocumentsDictionaries),
    getDictionary(decisionReportsDictionaries),
    getDictionary(tasksDictionaries),
    getDictionary(communicationsDictionaries),
    getDictionary(financeDictionaries),
    authApi.currentSession(),
    casesApi.people(),
  ]);

  let file: CaseFile | null = null;
  let notFound = false;
  try {
    file = await casesApi.file(caseId);
  } catch (error) {
    notFound = error instanceof HttpError && (error.status === 404 || error.status === 403);
  }

  if (!file) {
    return <Alert tone="danger">{notFound ? t.detail.notFound : t.detail.loadError}</Alert>;
  }

  const perms = session?.user.permissions ?? [];
  const manageAll = perms.includes("cases.manage.all") || !!session?.user.isSuperAdmin;
  const isAssigned = session?.user.id === file.case.assignedLawyerEmployeeId;
  const canManage = manageAll || (isAssigned && perms.includes("cases.manage.own"));

  return (
    <CaseDetailView
      initialFile={file}
      people={people}
      canManage={canManage}
      canReassign={manageAll}
      t={t}
      appointmentsT={appointmentsT}
      documentsT={documentsT}
      reportsT={reportsT}
      tasksT={tasksT}
      commsT={commsT}
      financeT={financeT}
      canReadFinance={!!session?.user.isSuperAdmin || perms.includes("finance.read") || perms.includes("finance.manage")}
      canManageFinance={!!session?.user.isSuperAdmin || perms.includes("finance.manage")}
      viewerId={session?.user.id ?? ""}
      canReviewReports={perms.includes("legal_decisions.approve") || !!session?.user.isSuperAdmin}
      canUploadDocuments={perms.includes("documents.upload") || !!session?.user.isSuperAdmin}
      canReviewDocuments={perms.includes("documents.review") || !!session?.user.isSuperAdmin}
      locale={locale}
    />
  );
}
