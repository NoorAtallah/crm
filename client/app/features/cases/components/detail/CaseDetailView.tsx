"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  FileSignature,
  FileText,
  FolderOpen,
  Gavel,
  GitBranch,
  History,
  ListChecks,
  Mail,
  Receipt,
  Lock,
  Pencil,
  RotateCcw,
  UserCog,
  Users,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  ExportButton,
  Field,
  Modal,
  PageHeader,
  SelectField,
  Tabs,
  TextArea,
} from "../../../../components/ui";
import { AppointmentsBoard, type AppointmentsDict } from "../../../appointments";
import { CaseDocumentsBoard, type CaseDocumentsDict } from "../../../case-documents";
import { DecisionReportsBoard, type DecisionReportsDict } from "../../../decision-reports";
import { TasksBoard, type TasksDict } from "../../../tasks";
import { CommunicationsLog, type CommunicationsDict } from "../../../communications";
import { FinanceBoard, type FinanceDict } from "../../../finance";
import { formatDate } from "../../../../lib/format";
import { problemMessage } from "../../../../lib/http";
import type { Locale } from "../../../../lib/i18n";
import { casesApi } from "../../api";
import type { CasesDict } from "../../i18n";
import { CASE_STAGES, type CaseFile, type CaseStage, type PersonOption } from "../../types";
import { OverviewTab } from "./OverviewTab";
import { PartiesTab } from "./PartiesTab";
import { TimelineTab } from "./TimelineTab";
import { isConflict, stageTone } from "./shared";

type TabKey = "overview" | "parties" | "hearings" | "documents" | "reports" | "tasks" | "correspondence" | "billing" | "timeline";
type Dialog = null | "edit" | "reassign" | "stage" | "status";

export function CaseDetailView({
  initialFile,
  people,
  canManage,
  canReassign,
  t: dict,
  appointmentsT,
  documentsT,
  reportsT,
  tasksT,
  commsT,
  financeT,
  canReadFinance,
  canManageFinance,
  viewerId,
  canReviewReports,
  canUploadDocuments,
  canReviewDocuments,
  locale,
}: {
  initialFile: CaseFile;
  people: PersonOption[];
  /** `cases.manage.all`, or `cases.manage.own` when assigned. */
  canManage: boolean;
  /** Reassigning needs `cases.manage.all`. */
  canReassign: boolean;
  t: CasesDict;
  appointmentsT: AppointmentsDict;
  documentsT: CaseDocumentsDict;
  reportsT: DecisionReportsDict;
  tasksT: TasksDict;
  commsT: CommunicationsDict;
  financeT: FinanceDict;
  canReadFinance: boolean;
  canManageFinance: boolean;
  viewerId: string;
  canReviewReports: boolean;
  canUploadDocuments: boolean;
  canReviewDocuments: boolean;
  locale: Locale;
}) {
  const t = dict.detail;
  const reduceMotion = useReducedMotion();
  const [file, setFile] = useState(initialFile);
  const [version, setVersion] = useState(initialFile.version);
  const [tab, setTab] = useState<TabKey>("overview");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "warning"; text: string } | null>(null);

  const kase = file.case;
  const caseId = kase.id;
  const names = useMemo(() => new Map(people.map((p) => [p.id, p.fullName])), [people]);
  const lawyers = people.filter((p) => p.type === "Lawyer");

  /** Re-reads the file — after writes that don't return a version, or on 409. */
  const refresh = useCallback(async () => {
    const next = await casesApi.file(caseId);
    setFile(next);
    setVersion(next.version);
    return next;
  }, [caseId]);

  const onConflict = useCallback(async () => {
    await refresh().catch(() => undefined);
    setNotice({ tone: "warning", text: t.conflict });
  }, [refresh, t.conflict]);

  const onSaved = useCallback(() => setNotice({ tone: "success", text: t.saved }), [t.saved]);

  return (
    <div className="space-y-5">
      <PageHeader
        back={
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 text-[13px] text-text-muted transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
            {t.back}
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="tabular-nums">{kase.caseNumber}</span>
            <Badge tone={stageTone[kase.stage]}>{t.stages[kase.stage]}</Badge>
            <Badge tone={kase.isActive ? "success" : "neutral"}>{kase.isActive ? dict.active : dict.closed}</Badge>
          </span>
        }
        subtitle={kase.title}
        actions={
          <>
            <ExportButton path={`cases/${caseId}/file`} fileName={`case-${kase.caseNumber}`} locale={locale} />
            {canManage && (
            <>
              <Button variant="secondary" onClick={() => setDialog("edit")}>
                <Pencil className="h-4 w-4" strokeWidth={1.75} />
                {t.edit}
              </Button>
              <Button variant="secondary" onClick={() => setDialog("stage")}>
                <GitBranch className="h-4 w-4" strokeWidth={1.75} />
                {t.changeStage}
              </Button>
              {canReassign && (
                <Button variant="secondary" onClick={() => setDialog("reassign")}>
                  <UserCog className="h-4 w-4" strokeWidth={1.75} />
                  {t.reassign}
                </Button>
              )}
              <Button variant={kase.isActive ? "danger" : "primary"} onClick={() => setDialog("status")}>
                {kase.isActive ? (
                  <Lock className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
                )}
                {kase.isActive ? t.closeCase : t.reopenCase}
              </Button>
            </>
            )}
          </>
        }
      />

      <Alert tone={notice?.tone ?? "success"} show={!!notice}>
        {notice?.text}
      </Alert>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Card>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: t.lawyer, value: names.get(kase.assignedLawyerEmployeeId) ?? "—" },
              { label: t.client, value: names.get(kase.clientEmployeeId) ?? "—" },
              { label: t.court.name, value: kase.courtName ?? "—" },
              {
                label: t.createdAt,
                value: (
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <CalendarDays className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />
                    {formatDate(kase.createdAtUtc, locale)}
                  </span>
                ),
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[12px] text-text-muted">{item.label}</p>
                <p className="mt-1 truncate text-[13.5px] font-medium text-text-primary">{item.value}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </motion.div>

      <Card>
        <div className="px-2">
          <Tabs
            id="case-detail"
            active={tab}
            onChange={(key) => {
              setNotice(null);
              setTab(key);
            }}
            tabs={[
              { key: "overview", label: t.tabs.overview, icon: FileText },
              { key: "parties", label: t.tabs.parties, icon: Users },
              { key: "hearings", label: appointmentsT.caseTab, icon: Gavel },
              { key: "documents", label: documentsT.tab, icon: FolderOpen },
              { key: "reports", label: reportsT.tab, icon: FileSignature },
              { key: "tasks", label: tasksT.caseTab, icon: ListChecks },
              { key: "correspondence", label: commsT.tab, icon: Mail },
              ...(canReadFinance ? [{ key: "billing" as const, label: financeT.caseTab, icon: Receipt }] : []),
              { key: "timeline", label: t.tabs.timeline, icon: History },
            ]}
          />
        </div>

        {tab === "overview" && (
          <OverviewTab
            file={file}
            version={version}
            canManage={canManage}
            onSaved={(next) => {
              setFile(next);
              setVersion(next.version);
              onSaved();
            }}
            onConflict={onConflict}
            t={dict}
            locale={locale}
          />
        )}
        {tab === "parties" && (
          <PartiesTab
            caseId={caseId}
            version={version}
            onVersion={setVersion}
            canManage={canManage}
            onConflict={onConflict}
            t={dict}
          />
        )}
        {tab === "hearings" && (
          <div className="p-4">
            <AppointmentsBoard
              caseId={caseId}
              caseIsActive={kase.isActive}
              version={version}
              onVersion={setVersion}
              onConflict={async () => {
                await refresh().catch(() => undefined);
              }}
              cases={[
                {
                  id: caseId,
                  caseNumber: kase.caseNumber,
                  title: kase.title,
                  assignedLawyerEmployeeId: kase.assignedLawyerEmployeeId,
                  isActive: kase.isActive,
                },
              ]}
              lawyers={lawyers.map((l) => ({ id: l.id, fullName: l.fullName }))}
              canManage={() => canManage}
              t={appointmentsT}
              locale={locale}
            />
          </div>
        )}
        {tab === "documents" && (
          <div className="p-4">
            <CaseDocumentsBoard
              caseId={caseId}
              canUpload={canUploadDocuments}
              canReview={canReviewDocuments}
              names={names}
              t={documentsT}
              locale={locale}
            />
          </div>
        )}
        {tab === "reports" && (
          <div className="p-4">
            <DecisionReportsBoard
              caseId={caseId}
              canWrite={canManage}
              canReview={canReviewReports}
              names={names}
              t={reportsT}
              locale={locale}
            />
          </div>
        )}
        {tab === "tasks" && (
          <div className="p-4">
            <TasksBoard
              caseId={caseId}
              cases={[
                {
                  id: caseId,
                  caseNumber: kase.caseNumber,
                  title: kase.title,
                  isActive: kase.isActive,
                  assignedLawyerEmployeeId: kase.assignedLawyerEmployeeId,
                },
              ]}
              assignees={people.filter((p) => p.type !== "Client").map((p) => ({ id: p.id, fullName: p.fullName }))}
              viewerId={viewerId}
              canManage={() => canManage}
              t={tasksT}
              locale={locale}
            />
          </div>
        )}
        {tab === "correspondence" && (
          <div className="p-4">
            <CommunicationsLog
              clientId={kase.clientEmployeeId}
              caseId={caseId}
              canLog={canManage}
              names={names}
              t={commsT}
              locale={locale}
            />
          </div>
        )}
        {tab === "billing" && (
          <div className="p-4">
            <FinanceBoard
              scope={{ clientId: kase.clientEmployeeId, caseId }}
              clients={people.filter((p) => p.type === "Client").map((p) => ({ id: p.id, fullName: p.fullName }))}
              cases={[{ id: caseId, caseNumber: kase.caseNumber, title: kase.title, clientId: kase.clientEmployeeId }]}
              canRead={canReadFinance}
              canManage={canManageFinance}
              t={financeT}
              locale={locale}
            />
          </div>
        )}
        {tab === "timeline" && (
          <TimelineTab
            caseId={caseId}
            version={version}
            onVersion={setVersion}
            canManage={canManage}
            names={names}
            onConflict={onConflict}
            t={dict}
            locale={locale}
          />
        )}
      </Card>

      <EditCaseDialog
        open={dialog === "edit"}
        onClose={() => setDialog(null)}
        initial={{ caseNumber: kase.caseNumber, title: kase.title }}
        onSubmit={async (input) => {
          await casesApi.update(caseId, input);
          await refresh();
          onSaved();
        }}
        t={dict}
      />
      <StageDialog
        open={dialog === "stage"}
        onClose={() => setDialog(null)}
        current={kase.stage}
        onSubmit={async (stage, reason) => {
          try {
            const next = await casesApi.changeStage(caseId, stage, reason, version);
            setFile(next);
            setVersion(next.version);
            onSaved();
          } catch (error) {
            if (isConflict(error)) {
              setDialog(null);
              await onConflict();
              return;
            }
            throw error;
          }
        }}
        t={dict}
      />
      <ReassignDialog
        open={dialog === "reassign"}
        onClose={() => setDialog(null)}
        current={kase.assignedLawyerEmployeeId}
        lawyers={lawyers}
        onSubmit={async (lawyerId) => {
          await casesApi.assignLawyer(caseId, lawyerId);
          await refresh();
          onSaved();
        }}
        t={dict}
      />
      <StatusDialog
        open={dialog === "status"}
        onClose={() => setDialog(null)}
        isActive={kase.isActive}
        onSubmit={async () => {
          await casesApi.setStatus(caseId, !kase.isActive);
          await refresh();
          onSaved();
        }}
        t={dict}
      />
    </div>
  );
}

/* ─────────────── header dialogs ─────────────── */

function useSubmit(onSubmit: () => Promise<void>, onClose: () => void, fallback: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit();
      onClose();
    } catch (e) {
      setError(problemMessage(e, fallback));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, reset: () => setError(null) };
}

function EditCaseDialog({
  open,
  onClose,
  initial,
  onSubmit,
  t,
}: {
  open: boolean;
  onClose: () => void;
  initial: { caseNumber: string; title: string };
  onSubmit: (input: { caseNumber: string; title: string }) => Promise<void>;
  t: CasesDict;
}) {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useSubmit(
    () => onSubmit({ caseNumber: values.caseNumber.trim(), title: values.title.trim() }),
    onClose,
    t.detail.saveError
  );
  const [openedFor, setOpenedFor] = useState(false);
  if (open !== openedFor) {
    setOpenedFor(open);
    if (open) {
      setValues(initial);
      setTouched(false);
    }
  }
  const missing = (v: string) => (touched && !v.trim() ? t.required : undefined);

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title={t.detail.editCase}
      closeLabel={t.close}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button
            loading={busy}
            loadingLabel={t.detail.saving}
            onClick={() => {
              setTouched(true);
              if (values.caseNumber.trim() && values.title.trim()) run();
            }}
          >
            {t.detail.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <Field
          id="edit-case-number"
          label={t.caseNumberLabel}
          dir="ltr"
          value={values.caseNumber}
          onChange={(e) => setValues((v) => ({ ...v, caseNumber: e.target.value }))}
          error={missing(values.caseNumber)}
          disabled={busy}
        />
        <Field
          id="edit-case-title"
          label={t.titleLabel}
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          error={missing(values.title)}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}

function StageDialog({
  open,
  onClose,
  current,
  onSubmit,
  t,
}: {
  open: boolean;
  onClose: () => void;
  current: CaseStage;
  onSubmit: (stage: CaseStage, reason: string) => Promise<void>;
  t: CasesDict;
}) {
  const [stage, setStage] = useState<CaseStage>(current);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useSubmit(() => onSubmit(stage, reason.trim()), onClose, t.detail.saveError);
  const [openedFor, setOpenedFor] = useState(false);
  if (open !== openedFor) {
    setOpenedFor(open);
    if (open) {
      setStage(current);
      setReason("");
      setTouched(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title={t.detail.changeStage}
      closeLabel={t.close}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button
            loading={busy}
            loadingLabel={t.detail.saving}
            onClick={() => {
              setTouched(true);
              if (reason.trim()) run();
            }}
          >
            {t.detail.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CASE_STAGES.map((key) => (
            <button
              key={key}
              type="button"
              disabled={busy}
              onClick={() => setStage(key)}
              className={`relative rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                stage === key
                  ? "border-brand-charcoal text-text-primary"
                  : "border-line text-text-muted hover:border-text-muted hover:text-text-primary"
              }`}
            >
              {stage === key && (
                <motion.span
                  layoutId="stage-choice"
                  className="absolute inset-0 rounded-lg bg-background"
                  transition={{ duration: 0.18 }}
                />
              )}
              <span className="relative">{t.detail.stages[key]}</span>
            </button>
          ))}
        </div>
        <TextArea
          id="stage-reason"
          label={t.detail.stageReason}
          hint={t.detail.stageReasonHint}
          rows={3}
          maxLength={4000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={touched && !reason.trim() ? t.required : undefined}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}

function ReassignDialog({
  open,
  onClose,
  current,
  lawyers,
  onSubmit,
  t,
}: {
  open: boolean;
  onClose: () => void;
  current: string;
  lawyers: PersonOption[];
  onSubmit: (lawyerId: string) => Promise<void>;
  t: CasesDict;
}) {
  const [lawyerId, setLawyerId] = useState(current);
  const { busy, error, run } = useSubmit(() => onSubmit(lawyerId), onClose, t.detail.saveError);
  const [openedFor, setOpenedFor] = useState(false);
  if (open !== openedFor) {
    setOpenedFor(open);
    if (open) setLawyerId(current);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title={t.detail.reassign}
      hint={t.detail.reassignHint}
      closeLabel={t.close}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button loading={busy} loadingLabel={t.detail.saving} disabled={lawyerId === current} onClick={run}>
            {t.detail.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <SelectField
          id="reassign-lawyer"
          label={t.lawyerLabel}
          value={lawyerId}
          onChange={(e) => setLawyerId(e.target.value)}
          options={lawyers.map((l) => ({ value: l.id, label: l.fullName }))}
          hint={lawyers.length === 0 ? t.noPeople : undefined}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}

function StatusDialog({
  open,
  onClose,
  isActive,
  onSubmit,
  t,
}: {
  open: boolean;
  onClose: () => void;
  isActive: boolean;
  onSubmit: () => Promise<void>;
  t: CasesDict;
}) {
  const { busy, error, run } = useSubmit(onSubmit, onClose, t.detail.saveError);
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={run}
      busy={busy}
      tone={isActive ? "danger" : "primary"}
      title={isActive ? t.detail.closeCase : t.detail.reopenCase}
      confirmLabel={t.detail.confirm}
      cancelLabel={t.cancel}
      closeLabel={t.close}
    >
      <div className="space-y-3">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <p>{isActive ? t.detail.closeConfirm : t.detail.reopenConfirm}</p>
      </div>
    </ConfirmDialog>
  );
}
