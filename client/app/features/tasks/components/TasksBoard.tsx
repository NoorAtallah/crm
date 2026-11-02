"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Ban, Briefcase, CheckCircle2, Circle, CircleDot, Clock, Pencil, Play, Plus, User } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  DescriptionList,
  Drawer,
  EmptyState,

  ExportButton,  Field,
  Modal,
  Pagination,
  SearchInput,
  SegmentedControl,
  SelectField,
  Spinner,
  TextArea,
  type BadgeTone,
} from "../../../components/ui";
import { formatDate, formatTime } from "../../../lib/format";
import { HttpError, problemMessage } from "../../../lib/http";
import { interpolate, type Locale } from "../../../lib/i18n";
import { tasksApi } from "../api";
import type { TasksDict } from "../i18n";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type AssigneeOption,
  type CaseTask,
  type PagedResult,
  type TaskCaseOption,
  type TaskDetails,
  type TaskPriority,
  type TaskStatus,
} from "../types";

const priorityTone: Record<TaskPriority, BadgeTone> = { Low: "neutral", Normal: "info", High: "warning", Urgent: "danger" };
const statusTone: Record<TaskStatus, BadgeTone> = { Open: "neutral", InProgress: "info", Completed: "success", Cancelled: "neutral" };
const isConflict = (e: unknown) => e instanceof HttpError && e.status === 409;
const isFinal = (s: TaskStatus) => s === "Completed" || s === "Cancelled";

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

type Resolve = { task: CaseTask; status: "Completed" | "Cancelled" } | null;

/**
 * Task list + details + actions.
 *  - page mode: every task the viewer can see, optionally "mine".
 *  - case mode (`caseId`): one case's tasks.
 */
export function TasksBoard({
  caseId,
  cases,
  assignees,
  viewerId,
  canManage,
  showAssigneeFilter = false,
  t,
  locale,
}: {
  caseId?: string;
  cases: TaskCaseOption[];
  assignees: AssigneeOption[];
  viewerId: string;
  /** Create/edit/cancel on this case (case management rights). */
  canManage: (caseId: string) => boolean;
  showAssigneeFilter?: boolean;
  t: TasksDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const pageMode = !caseId;
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [assigneeId, setAssigneeId] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [data, setData] = useState<PagedResult<CaseTask> | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [selected, setSelected] = useState<CaseTask | null>(null);
  const [form, setForm] = useState<{ task: CaseTask | null } | null>(null);
  const [resolving, setResolving] = useState<Resolve>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [startBusy, setStartBusy] = useState(false);

  const caseById = useMemo(() => new Map(cases.map((c) => [c.id, c])), [cases]);
  const nameOf = useMemo(() => new Map(assignees.map((a) => [a.id, a.fullName])), [assignees]);

  const load = useCallback(() => {
    setFailed(false);
    return tasksApi
      .search({
        caseId,
        assigneeId: scope === "mine" ? viewerId : assigneeId || undefined,
        status: status || undefined,
        priority: priority || undefined,
        overdue: overdue || undefined,
        search: search.trim(),
        page,
        pageSize: 25,
      })
      .then(setData)
      .catch(() => setFailed(true));
  }, [caseId, scope, viewerId, assigneeId, status, priority, overdue, search, page]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  /** Applies a write's result, or reloads on 409. */
  const apply = async (task: CaseTask, fn: (version: string) => Promise<CaseTask>) => {
    try {
      const next = await fn(task.version);
      setSelected((s) => (s?.id === next.id ? next : s));
      setNotice(null);
      await load();
      return true;
    } catch (e) {
      if (!isConflict(e)) throw e;
      setNotice(t.conflict);
      const fresh = await tasksApi.get(task.id).catch(() => null);
      if (fresh) setSelected(fresh);
      await load();
      return false;
    }
  };

  const manageable = cases.filter((c) => c.isActive && canManage(c.id));
  const canCreate = caseId ? canManage(caseId) && (caseById.get(caseId)?.isActive ?? true) : true;
  const isAssignee = (task: CaseTask) => task.assigneeId === viewerId;
  const canProgress = (task: CaseTask) => !isFinal(task.status) && (isAssignee(task) || canManage(task.caseId));

  const selectClass = "rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-text-primary focus:outline-none";
  const sel = selected;

  return (
    <div className="space-y-4">
      <Alert tone="warning" show={!!notice}>
        {notice}
      </Alert>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          {pageMode && (
            <SegmentedControl<"all" | "mine">
              id="task-scope"
              value={scope}
              onChange={(s) => (setPage(1), setScope(s))}
              options={[
                { key: "all", label: t.allAssignees },
                { key: "mine", label: t.mine },
              ]}
            />
          )}
          <SearchInput value={search} placeholder={t.search} onChange={(e) => (setPage(1), setSearch(e.target.value))} />
          <select value={status} onChange={(e) => (setPage(1), setStatus(e.target.value as TaskStatus | ""))} className={selectClass}>
            <option value="">{t.allStatuses}</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.statuses[s]}
              </option>
            ))}
          </select>
          <select value={priority} onChange={(e) => (setPage(1), setPriority(e.target.value as TaskPriority | ""))} className={selectClass}>
            <option value="">{t.allPriorities}</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t.priorities[p]}
              </option>
            ))}
          </select>
          {showAssigneeFilter && scope === "all" && (
            <select value={assigneeId} onChange={(e) => (setPage(1), setAssigneeId(e.target.value))} className={selectClass}>
              <option value="">{t.allAssignees}</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 text-[13px] text-text-muted">
            <input type="checkbox" checked={overdue} onChange={(e) => (setPage(1), setOverdue(e.target.checked))} className="h-4 w-4 accent-brand-charcoal" />
            {t.overdueOnly}
          </label>
          <div className="ms-auto">
            <ExportButton
              path="tasks"
              filters={{
                caseId,
                assigneeId: scope === "mine" ? viewerId : assigneeId || undefined,
                status: status || undefined,
                priority: priority || undefined,
                overdue: overdue || undefined,
                search: search.trim(),
              }}
              fileName="tasks"
              locale={locale}
              compact
            />
          </div>
          {canCreate && (
            <Button className=" h-9 px-3 text-[13px]" onClick={() => setForm({ task: null })}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.newTask}
            </Button>
          )}
        </div>

        <div className="px-5 pt-4">
          <Alert tone="danger" show={failed}>
            {t.loadError}
          </Alert>
        </div>

        {!data && !failed && <Spinner block />}
        {data && data.items.length === 0 && <EmptyState>{t.empty}</EmptyState>}

        {data && data.items.length > 0 && (
          <ul className="divide-y divide-line">
            {data.items.map((task, i) => {
              const Icon = task.status === "Completed" ? CheckCircle2 : task.status === "InProgress" ? CircleDot : task.status === "Cancelled" ? Ban : Circle;
              const c = caseById.get(task.caseId);
              return (
                <motion.li
                  key={task.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.18) }}
                >
                  <button
                    type="button"
                    onClick={() => (setActionError(null), setSelected(task))}
                    className={`flex w-full items-start gap-3 px-5 py-3.5 text-start transition-colors hover:bg-background ${isFinal(task.status) ? "opacity-60" : ""}`}
                  >
                    <Icon
                      className={`mt-0.5 h-5 w-5 shrink-0 ${task.status === "Completed" ? "text-success" : task.status === "InProgress" ? "text-info" : "text-text-muted"}`}
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-[13.5px] font-medium text-text-primary ${task.status === "Completed" ? "line-through" : ""}`}>{task.title}</p>
                        <Badge tone={priorityTone[task.priority]}>{t.priorities[task.priority]}</Badge>
                        {task.isOverdue && (
                          <Badge tone="danger">
                            <AlertTriangle className="me-1 h-3 w-3" strokeWidth={2} />
                            {t.overdue}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-text-muted">
                        <span className={`inline-flex items-center gap-1 tabular-nums ${task.isOverdue ? "text-danger" : ""}`}>
                          <Clock className="h-3 w-3" strokeWidth={1.75} />
                          {formatDate(task.dueAtUtc, locale)} {formatTime(task.dueAtUtc, locale)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" strokeWidth={1.75} />
                          {nameOf.get(task.assigneeId) ?? "—"}
                        </span>
                        {pageMode && c && (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Briefcase className="h-3 w-3" strokeWidth={1.75} />
                            {c.caseNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge tone={statusTone[task.status]}>{t.statuses[task.status]}</Badge>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}

        {data && (
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} label={interpolate(t.pageOf, { page: data.page, total: data.totalPages })} />
        )}
      </div>

      <Drawer
        open={!!sel}
        onClose={() => setSelected(null)}
        title={sel?.title ?? ""}
        subtitle={
          sel && (
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone[sel.status]}>{t.statuses[sel.status]}</Badge>
              <Badge tone={priorityTone[sel.priority]}>{t.priorities[sel.priority]}</Badge>
              {sel.isOverdue && <Badge tone="danger">{t.overdue}</Badge>}
            </span>
          )
        }
        closeLabel={t.close}
        dir={locale === "ar" ? "rtl" : "ltr"}
        footer={
          sel &&
          canProgress(sel) && (
            <div className="flex flex-wrap justify-end gap-2">
              {canManage(sel.caseId) && (
                <Button variant="secondary" className="h-10 px-3 text-[13px]" onClick={() => setResolving({ task: sel, status: "Cancelled" })}>
                  <Ban className="h-4 w-4" strokeWidth={1.75} />
                  {t.cancelTask}
                </Button>
              )}
              {canManage(sel.caseId) && (
                <Button variant="secondary" className="h-10 px-3 text-[13px]" onClick={() => setForm({ task: sel })}>
                  <Pencil className="h-4 w-4" strokeWidth={1.75} />
                  {t.editTask}
                </Button>
              )}
              {sel.status === "Open" && (
                <Button
                  variant="secondary"
                  className="h-10 px-3 text-[13px]"
                  loading={startBusy}
                  onClick={async () => {
                    setStartBusy(true);
                    setActionError(null);
                    try {
                      await apply(sel, (v) => tasksApi.setStatus(sel.id, "InProgress", null, v));
                    } catch (e) {
                      setActionError(problemMessage(e, t.saveError));
                    } finally {
                      setStartBusy(false);
                    }
                  }}
                >
                  <Play className="h-4 w-4" strokeWidth={1.75} />
                  {t.start}
                </Button>
              )}
              <Button className="h-10 px-3 text-[13px]" onClick={() => setResolving({ task: sel, status: "Completed" })}>
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                {t.complete}
              </Button>
            </div>
          )
        }
      >
        {sel && (
          <div className="space-y-5">
            <Alert tone="danger" show={!!actionError}>
              {actionError}
            </Alert>
            {isFinal(sel.status) && <Alert tone="info">{t.finalBanner}</Alert>}
            <DescriptionList
              columns={2}
              items={[
                { label: t.fields.assignee, value: nameOf.get(sel.assigneeId) },
                {
                  label: t.fields.dueAt,
                  value: (
                    <span className={`tabular-nums ${sel.isOverdue ? "text-danger" : ""}`}>
                      {formatDate(sel.dueAtUtc, locale)} {formatTime(sel.dueAtUtc, locale)}
                    </span>
                  ),
                },
                ...(pageMode
                  ? [
                      {
                        label: t.fields.case,
                        value: (
                          <Link href={`/cases/${sel.caseId}`} className="text-info hover:underline">
                            {caseById.get(sel.caseId)?.caseNumber ?? "→"}
                          </Link>
                        ),
                      },
                    ]
                  : []),
                { label: t.fields.description, value: sel.description, full: true },
                ...(sel.resolution ? [{ label: t.resolution, value: sel.resolution, full: true }] : []),
              ]}
            />
          </div>
        )}
      </Drawer>

      <TaskFormDialog
        state={form}
        fixedCaseId={caseId}
        cases={manageable}
        assignees={assignees}
        onClose={() => setForm(null)}
        onSubmit={async (forCase, details) => {
          const editing = form?.task;
          if (editing) {
            await apply(editing, (v) => tasksApi.update(editing.id, details, v));
          } else {
            await tasksApi.create(forCase, details);
            setPage(1);
            await load();
          }
        }}
        t={t}
      />

      <ResolveDialog
        state={resolving}
        onClose={() => setResolving(null)}
        onSubmit={async (resolution) => {
          if (!resolving) return;
          const { task, status: next } = resolving;
          await apply(task, (v) => tasksApi.setStatus(task.id, next, resolution, v));
        }}
        t={t}
      />
    </div>
  );
}

/* ───────────── dialogs ───────────── */

function TaskFormDialog({
  state,
  fixedCaseId,
  cases,
  assignees,
  onClose,
  onSubmit,
  t,
}: {
  state: { task: CaseTask | null } | null;
  fixedCaseId?: string;
  cases: TaskCaseOption[];
  assignees: AssigneeOption[];
  onClose: () => void;
  onSubmit: (caseId: string, details: TaskDetails) => Promise<void>;
  t: TasksDict;
}) {
  const blank = () => {
    const due = new Date();
    due.setDate(due.getDate() + 1);
    due.setHours(17, 0, 0, 0);
    return { caseId: fixedCaseId ?? "", title: "", description: "", assigneeId: "", dueAt: toLocalInput(due), priority: "Normal" as TaskPriority };
  };
  const [v, setV] = useState(blank);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state) {
      const task = state.task;
      setV(
        task
          ? {
              caseId: task.caseId,
              title: task.title,
              description: task.description ?? "",
              assigneeId: task.assigneeId,
              dueAt: toLocalInput(new Date(task.dueAtUtc)),
              priority: task.priority,
            }
          : blank()
      );
      setTouched(false);
      setError(null);
    }
  }
  const editing = !!state?.task;
  const need = (s: string) => (touched && !s.trim() ? t.required : undefined);

  const save = async () => {
    setTouched(true);
    if (!v.caseId || !v.title.trim() || !v.assigneeId || !v.dueAt || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(v.caseId, {
        title: v.title.trim(),
        description: v.description.trim() || null,
        assigneeId: v.assigneeId,
        dueAtUtc: new Date(v.dueAt).toISOString(),
        priority: v.priority,
      });
      onClose();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      busy={busy}
      title={editing ? t.editTask : t.newTask}
      closeLabel={t.close}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button loading={busy} loadingLabel={t.saving} onClick={save}>
            {t.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        {!fixedCaseId && !editing && cases.length === 0 && <Alert tone="info">{t.noCases}</Alert>}
        {!fixedCaseId && !editing && cases.length > 0 && (
          <SelectField
            id="task-case"
            label={t.fields.case}
            value={v.caseId}
            placeholder="—"
            onChange={(e) => setV({ ...v, caseId: e.target.value })}
            options={cases.map((c) => ({ value: c.id, label: `${c.caseNumber} — ${c.title}` }))}
            error={touched && !v.caseId ? t.required : undefined}
            disabled={busy}
          />
        )}
        <Field id="task-title" label={t.fields.title} maxLength={300} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} error={need(v.title)} disabled={busy} />
        <TextArea id="task-description" label={t.fields.description} rows={3} maxLength={8000} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} disabled={busy} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="task-assignee"
            label={t.fields.assignee}
            value={v.assigneeId}
            placeholder="—"
            onChange={(e) => setV({ ...v, assigneeId: e.target.value })}
            options={assignees.map((a) => ({ value: a.id, label: a.fullName }))}
            error={touched && !v.assigneeId ? t.required : undefined}
            disabled={busy}
          />
          <Field id="task-due" type="datetime-local" dir="ltr" label={t.fields.dueAt} value={v.dueAt} onChange={(e) => setV({ ...v, dueAt: e.target.value })} error={need(v.dueAt)} disabled={busy} />
        </div>
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-text-primary">{t.fields.priority}</p>
          <SegmentedControl<TaskPriority>
            id="task-priority"
            value={v.priority}
            onChange={(p) => setV({ ...v, priority: p })}
            options={TASK_PRIORITIES.map((p) => ({ key: p, label: t.priorities[p] }))}
          />
        </div>
      </div>
    </Modal>
  );
}

function ResolveDialog({
  state,
  onClose,
  onSubmit,
  t,
}: {
  state: Resolve;
  onClose: () => void;
  onSubmit: (resolution: string) => Promise<void>;
  t: TasksDict;
}) {
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state) {
      setText("");
      setTouched(false);
      setError(null);
    }
  }
  const cancelling = state?.status === "Cancelled";

  const save = async () => {
    setTouched(true);
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(text.trim());
      onClose();
    } catch (e) {
      setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      busy={busy}
      title={cancelling ? t.cancelTask : t.complete}
      hint={state?.task.title}
      closeLabel={t.close}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button variant={cancelling ? "danger" : "primary"} loading={busy} loadingLabel={t.saving} onClick={save}>
            {cancelling ? t.cancelTask : t.complete}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <TextArea
          id="task-resolution"
          label={t.resolution}
          hint={t.resolutionHint}
          rows={3}
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          error={touched && !text.trim() ? t.required : undefined}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}
