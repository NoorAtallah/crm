"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, Crown, KeyRound, Pencil, Plus, ShieldCheck, UserMinus, UserPlus, Users } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Field,
  IconButton,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  SelectField,
  Spinner,
  Switch,
  Tabs,
} from "../../../components/ui";
import { formatDate } from "../../../lib/format";
import { HttpError, problemMessage } from "../../../lib/http";
import { interpolate, type Locale } from "../../../lib/i18n";
import { officesApi } from "../api";
import type { OfficesDict } from "../i18n";
import { ACCESS_GRANTS, type AccessGrant, type Office, type OfficeGrant, type PagedResult, type PersonRef, type Team, type TeamMember } from "../types";

const isConflict = (e: unknown) => e instanceof HttpError && e.status === 409;

export function OfficesView({
  people,
  isSuperAdmin,
  canManage,
  t,
  locale,
}: {
  people: PersonRef[];
  /** Creates offices and changes grants. */
  isSuperAdmin: boolean;
  /** `employees.manage` — edit offices/teams/members (with a Manage grant). */
  canManage: boolean;
  t: OfficesDict;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResult<Office> | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Office | null>(null);
  const [tab, setTab] = useState<"teams" | "access">("teams");
  const [officeForm, setOfficeForm] = useState<{ office: Office | null } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setFailed(false);
    return officesApi
      .list({ search: search.trim(), includeInactive, page, pageSize: 50 })
      .then((r) => {
        setData(r);
        setSelected((s) => (s ? r.items.find((o) => o.id === s.id) ?? s : r.items[0] ?? null));
      })
      .catch(() => setFailed(true));
  }, [search, includeInactive, page]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  /** Fresh office (and its version) — after grant changes or a 409. */
  const refreshOffice = async (id: string) => {
    const fresh = await officesApi.get(id).catch(() => null);
    if (fresh) setSelected(fresh);
    return fresh;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          isSuperAdmin && (
            <Button onClick={() => setOfficeForm({ office: null })}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.newOffice}
            </Button>
          )
        }
      />

      <Alert tone="warning" show={!!notice}>
        {notice}
      </Alert>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit overflow-hidden">
          <div className="space-y-3 border-b border-line px-4 py-3">
            <SearchInput value={search} placeholder={t.search} onChange={(e) => (setPage(1), setSearch(e.target.value))} className="min-w-0" />
            {isSuperAdmin && (
              <label className="flex items-center gap-2 text-[12.5px] text-text-muted">
                <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="h-4 w-4 accent-brand-charcoal" />
                {t.showInactive}
              </label>
            )}
          </div>
          <Alert tone="danger" show={failed}>
            {t.loadError}
          </Alert>
          {!data && !failed && <Spinner block />}
          {data && data.items.length === 0 && <EmptyState>{t.empty}</EmptyState>}
          <ul className="divide-y divide-line">
            {data?.items.map((o, i) => (
              <motion.li key={o.id} initial={reduceMotion ? false : { opacity: 0, x: locale === "ar" ? 6 : -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.15) }}>
                <button
                  type="button"
                  onClick={() => setSelected(o)}
                  className={`relative flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-background ${selected?.id === o.id ? "bg-background" : ""}`}
                >
                  {selected?.id === o.id && <motion.span layoutId="office-active" className="absolute inset-y-0 start-0 w-0.5 bg-brand-charcoal" />}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-champagne-light">
                    <Building2 className="h-4 w-4 text-warning" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-text-primary">{o.name}</p>
                    <p className="text-[12px] tabular-nums text-text-muted" dir="ltr">
                      {o.code}
                    </p>
                  </div>
                  {!o.isActive && <Badge>{t.inactive}</Badge>}
                </button>
              </motion.li>
            ))}
          </ul>
          {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} label={interpolate(t.pageOf, { page: data.page, total: data.totalPages })} />}
        </Card>

        <Card className="min-w-0 overflow-hidden">
          {!selected ? (
            <EmptyState>{t.selectOffice}</EmptyState>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selected.id} initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="flex items-center gap-2 text-[17px] font-semibold text-text-primary">
                      {selected.name}
                      <Badge tone={selected.isActive ? "success" : "neutral"}>{selected.isActive ? t.active : t.inactive}</Badge>
                    </h2>
                    <p className="text-[12.5px] tabular-nums text-text-muted" dir="ltr">
                      {selected.code}
                    </p>
                  </div>
                  {canManage && (
                    <Button variant="secondary" className="h-9 px-3 text-[13px]" onClick={() => setOfficeForm({ office: selected })}>
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {t.edit}
                    </Button>
                  )}
                </header>
                <div className="px-2">
                  <Tabs
                    id="office-detail"
                    active={tab}
                    onChange={setTab}
                    tabs={[
                      { key: "teams", label: t.tabs.teams, icon: Users },
                      { key: "access", label: t.tabs.access, icon: KeyRound },
                    ]}
                  />
                </div>
                {tab === "teams" && <TeamsTab office={selected} people={people} canManage={canManage} t={t} locale={locale} />}
                {tab === "access" && (
                  <AccessTab
                    office={selected}
                    people={people}
                    isSuperAdmin={isSuperAdmin}
                    onOfficeChanged={setSelected}
                    onConflict={async () => {
                      setNotice(t.conflict);
                      await refreshOffice(selected.id);
                    }}
                    t={t}
                    locale={locale}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </Card>
      </div>

      <SimpleForm
        state={officeForm}
        title={officeForm?.office ? t.editOffice : t.newOffice}
        t={t}
        fields={[
          { key: "code", label: t.fields.code, hint: t.fields.codeHint, ltr: true, max: 40 },
          { key: "name", label: t.fields.name, max: 160 },
        ]}
        initial={() => ({ code: officeForm?.office?.code ?? "", name: officeForm?.office?.name ?? "", isActive: officeForm?.office?.isActive ?? true })}
        onClose={() => setOfficeForm(null)}
        onSubmit={async (v) => {
          const office = officeForm?.office;
          try {
            const saved = office ? await officesApi.update(office.id, v, office.version) : await officesApi.create(v);
            setSelected(saved);
            setNotice(null);
          } catch (e) {
            if (!isConflict(e) || !office) throw e;
            setNotice(t.conflict);
            await refreshOffice(office.id);
          }
          await load();
        }}
      />
    </div>
  );
}

/* ───────────── teams ───────────── */

function TeamsTab({ office, people, canManage, t, locale }: { office: Office; people: PersonRef[]; canManage: boolean; t: OfficesDict; locale: Locale }) {
  const [data, setData] = useState<PagedResult<Team> | null>(null);
  const [failed, setFailed] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [form, setForm] = useState<{ team: Team | null } | null>(null);
  const [openTeam, setOpenTeam] = useState<Team | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setFailed(false);
    return officesApi
      .teams(office.id, { includeInactive, pageSize: 100 })
      .then(setData)
      .catch(() => setFailed(true));
  }, [office.id, includeInactive]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
        <label className="flex items-center gap-2 text-[12.5px] text-text-muted">
          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="h-4 w-4 accent-brand-charcoal" />
          {t.showInactive}
        </label>
        {canManage && (
          <Button className="ms-auto h-9 px-3 text-[13px]" onClick={() => setForm({ team: null })}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t.teams.new}
          </Button>
        )}
      </div>
      <div className="px-5 pt-3">
        <Alert tone="danger" show={failed}>
          {t.loadError}
        </Alert>
        <Alert tone="warning" show={!!notice}>
          {notice}
        </Alert>
      </div>
      {!data && !failed && <Spinner block />}
      {data && data.items.length === 0 && <EmptyState>{t.teams.empty}</EmptyState>}
      <ul className="grid gap-3 p-5 sm:grid-cols-2">
        {data?.items.map((team) => (
          <li key={team.id}>
            <button type="button" onClick={() => setOpenTeam(team)} className={`flex w-full items-center gap-3 rounded-lg border border-line px-4 py-3 text-start transition-colors hover:border-brand-charcoal ${team.isActive ? "" : "opacity-60"}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                <Users className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-text-primary">{team.name}</p>
                <p className="text-[12px] text-text-muted" dir="ltr">
                  {team.key}
                </p>
              </div>
              {!team.isActive && <Badge>{t.inactive}</Badge>}
            </button>
          </li>
        ))}
      </ul>

      <MembersDrawer
        office={office}
        team={openTeam}
        people={people}
        canManage={canManage}
        onClose={() => setOpenTeam(null)}
        onEdit={(team) => setForm({ team })}
        onTeamChanged={(team) => {
          setOpenTeam(team);
          load();
        }}
        t={t}
        locale={locale}
      />

      <SimpleForm
        state={form}
        title={form?.team ? t.teams.edit : t.teams.new}
        t={t}
        fields={[
          { key: "key", label: t.fields.key, hint: t.fields.keyHint, ltr: true, max: 60 },
          { key: "name", label: t.fields.name, max: 160 },
        ]}
        initial={() => ({ key: form?.team?.key ?? "", name: form?.team?.name ?? "", isActive: form?.team?.isActive ?? true })}
        onClose={() => setForm(null)}
        onSubmit={async (v) => {
          const team = form?.team;
          try {
            const saved = team ? await officesApi.updateTeam(office.id, team.id, v, team.version) : await officesApi.createTeam(office.id, v);
            if (openTeam?.id === saved.id) setOpenTeam(saved);
            setNotice(null);
          } catch (e) {
            if (!isConflict(e)) throw e;
            setNotice(t.conflict);
          }
          await load();
        }}
      />
    </div>
  );
}

function MembersDrawer({ office, team, people, canManage, onClose, onEdit, onTeamChanged, t, locale }: {
  office: Office;
  team: Team | null;
  people: PersonRef[];
  canManage: boolean;
  onClose: () => void;
  onEdit: (team: Team) => void;
  onTeamChanged: (team: Team) => void;
  t: OfficesDict;
  locale: Locale;
}) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [showFormer, setShowFormer] = useState(false);
  const [adding, setAdding] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!team) return;
    officesApi
      .members(office.id, team.id, { includeInactive: showFormer, pageSize: 100 })
      .then((r) => setMembers(r.items))
      .catch(() => setMembers([]));
  }, [office.id, team, showFormer]);
  useEffect(() => {
    setMembers(null);
    setError(null);
    load();
  }, [load]);

  const set = async (userId: string, active: boolean, isLead: boolean) => {
    if (!team || busy) return;
    setBusy(true);
    setError(null);
    try {
      onTeamChanged(await officesApi.setMember(office.id, team.id, userId, active, isLead, team.version));
      setAdding("");
    } catch (e) {
      if (isConflict(e)) {
        setError(t.conflict);
        const fresh = await officesApi.teams(office.id, { pageSize: 100, includeInactive: true }).then((r) => r.items.find((x) => x.id === team.id)).catch(() => undefined);
        if (fresh) onTeamChanged(fresh);
      } else setError(problemMessage(e, t.saveError));
    } finally {
      setBusy(false);
      load();
    }
  };

  const currentIds = new Set((members ?? []).filter((m) => !m.leftAtUtc).map((m) => m.userId));
  const candidates = people.filter((p) => !p.isClient && !currentIds.has(p.id));

  return (
    <Drawer
      open={!!team}
      onClose={onClose}
      title={team?.name ?? ""}
      subtitle={<span dir="ltr">{team?.key}</span>}
      closeLabel={t.close}
      dir={locale === "ar" ? "rtl" : "ltr"}
      footer={
        canManage &&
        team && (
          <Button variant="secondary" className="h-10 px-3 text-[13px]" onClick={() => onEdit(team)}>
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
            {t.teams.edit}
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        {canManage && team?.isActive && (
          <div className="space-y-2 rounded-lg border border-line p-3">
            <div className="flex gap-2">
              <select value={adding} onChange={(e) => setAdding(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-[13.5px] text-text-primary focus:outline-none" disabled={busy}>
                <option value="">{t.teams.addMember}…</option>
                {candidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
              <Button className="h-10 px-3" disabled={!adding} loading={busy} onClick={() => set(adding, true, false)}>
                <UserPlus className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </div>
            <p className="text-[12px] text-text-muted">{t.teams.memberNeedsAccess}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-text-primary">{t.teams.members}</h3>
          <label className="flex items-center gap-2 text-[12px] text-text-muted">
            <input type="checkbox" checked={showFormer} onChange={(e) => setShowFormer(e.target.checked)} className="h-3.5 w-3.5 accent-brand-charcoal" />
            {t.teams.showFormer}
          </label>
        </div>
        {members === null ? (
          <Spinner block />
        ) : members.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-text-muted">{t.teams.noMembers}</p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.userId + m.joinedAtUtc} className={`flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 ${m.leftAtUtc ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[13.5px] font-medium text-text-primary">
                    {m.name}
                    {m.isLead && <Crown className="h-3.5 w-3.5 text-warning" strokeWidth={1.75} aria-label={t.teams.lead} />}
                  </p>
                  <p className="text-[11.5px] tabular-nums text-text-muted">
                    {formatDate(m.joinedAtUtc, locale)}
                    {m.leftAtUtc ? ` – ${formatDate(m.leftAtUtc, locale)}` : ""}
                  </p>
                </div>
                {m.leftAtUtc ? (
                  <Badge>{t.teams.former}</Badge>
                ) : (
                  canManage && (
                    <>
                      <IconButton icon={Crown} label={m.isLead ? t.teams.removeLead : t.teams.makeLead} disabled={busy} onClick={() => set(m.userId, true, !m.isLead)} className={m.isLead ? "text-warning" : ""} />
                      <IconButton icon={UserMinus} label={t.teams.remove} tone="danger" disabled={busy} onClick={() => set(m.userId, false, false)} />
                    </>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}

/* ───────────── access ───────────── */

function AccessTab({ office, people, isSuperAdmin, onOfficeChanged, onConflict, t, locale }: {
  office: Office;
  people: PersonRef[];
  isSuperAdmin: boolean;
  onOfficeChanged: (o: Office) => void;
  onConflict: () => Promise<void>;
  t: OfficesDict;
  locale: Locale;
}) {
  const [data, setData] = useState<PagedResult<OfficeGrant> | null>(null);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState("");
  const [newGrant, setNewGrant] = useState<AccessGrant>("Read");
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const load = useCallback(() => {
    setFailed(false);
    return officesApi
      .access(office.id, { page, pageSize: 50 })
      .then(setData)
      .catch(() => setFailed(true));
  }, [office.id, page]);
  useEffect(() => {
    load();
  }, [load]);

  const change = async (userId: string, grant: AccessGrant | null) => {
    setBusyUser(userId);
    setError(null);
    try {
      onOfficeChanged(await officesApi.setAccess(office.id, userId, grant, office.version));
      setNewUser("");
      await load();
    } catch (e) {
      if (isConflict(e)) await onConflict();
      else setError(problemMessage(e, t.saveError));
    } finally {
      setBusyUser(null);
    }
  };

  const granted = new Set((data?.items ?? []).map((g) => g.userId));
  const candidates = people.filter((p) => !granted.has(p.id));
  const newIsClient = byId.get(newUser)?.isClient;

  return (
    <div className="space-y-4 p-5">
      <Alert tone="info">
        {t.access.hint} {!isSuperAdmin && t.access.superAdminOnly}
      </Alert>
      <Alert tone="danger" show={!!error || failed}>
        {error ?? t.loadError}
      </Alert>

      {isSuperAdmin && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-line p-3">
          <div className="min-w-[200px] flex-1">
            <SelectField id="grant-user" label={t.fields.person} value={newUser} placeholder="—" onChange={(e) => (setNewUser(e.target.value), setNewGrant("Read"))} options={candidates.map((p) => ({ value: p.id, label: p.fullName }))} />
          </div>
          <div className="w-40">
            <SelectField
              id="grant-level"
              label={t.fields.grant}
              value={newGrant}
              onChange={(e) => setNewGrant(e.target.value as AccessGrant)}
              options={ACCESS_GRANTS.map((g) => ({ value: g, label: t.access.grants[g], disabled: newIsClient && g !== "Read" }))}
            />
          </div>
          <Button className="h-11 px-4" disabled={!newUser} loading={busyUser === newUser && !!newUser} onClick={() => change(newUser, newGrant)}>
            <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
            {t.access.add}
          </Button>
          {newIsClient && <p className="w-full text-[12px] text-text-muted">{t.access.clientReadOnly}</p>}
        </div>
      )}

      {!data && !failed && <Spinner block />}
      {data && data.items.length === 0 && <EmptyState>{t.access.empty}</EmptyState>}
      {data && data.items.length > 0 && (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {data.items.map((g) => {
            const p = byId.get(g.userId);
            return (
              <li key={g.userId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-text-primary">{p?.fullName ?? g.userId}</p>
                  <p className="text-[11.5px] tabular-nums text-text-muted">{formatDate(g.grantedAtUtc, locale)}</p>
                </div>
                {isSuperAdmin ? (
                  <>
                    <select
                      value={g.grant}
                      disabled={busyUser === g.userId}
                      onChange={(e) => change(g.userId, e.target.value as AccessGrant)}
                      className="h-9 rounded-lg border border-line bg-surface px-2.5 text-[13px] text-text-primary focus:outline-none"
                    >
                      {ACCESS_GRANTS.map((x) => (
                        <option key={x} value={x} disabled={p?.isClient && x !== "Read"}>
                          {t.access.grants[x]}
                        </option>
                      ))}
                    </select>
                    <Button variant="secondary" className="h-9 px-3 text-[13px]" disabled={busyUser === g.userId} onClick={() => change(g.userId, null)}>
                      {t.access.revoke}
                    </Button>
                  </>
                ) : (
                  <Badge tone="info">{t.access.grants[g.grant]}</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} label={interpolate(t.pageOf, { page: data.page, total: data.totalPages })} />}
    </div>
  );
}

/* ───────────── small form ───────────── */

function SimpleForm<S>({ state, title, t, fields, initial, onClose, onSubmit }: {
  state: S | null;
  title: string;
  t: OfficesDict;
  fields: { key: "code" | "name" | "key"; label: string; hint?: string; ltr?: boolean; max: number }[];
  initial: () => Record<string, string | boolean>;
  onClose: () => void;
  onSubmit: (v: { code: string; name: string; key: string; isActive: boolean }) => Promise<void>;
}) {
  const [v, setV] = useState<Record<string, string | boolean>>(initial);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state) {
      setV(initial());
      setTouched(false);
      setError(null);
    }
  }
  const text = (k: string) => String(v[k] ?? "").trim();
  const save = async () => {
    setTouched(true);
    if (fields.some((f) => !text(f.key)) || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ code: text("code"), name: text("name"), key: text("key"), isActive: !!v.isActive });
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
      title={title}
      closeLabel={t.close}
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
        {fields.map((f) => (
          <div key={f.key}>
            <Field id={`f-${f.key}`} label={f.label} dir={f.ltr ? "ltr" : undefined} maxLength={f.max} value={String(v[f.key] ?? "")} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} error={touched && !text(f.key) ? t.required : undefined} disabled={busy} />
            {f.hint && <p className="mt-1 text-[12px] text-text-muted">{f.hint}</p>}
          </div>
        ))}
        <Switch checked={!!v.isActive} onChange={(x) => setV({ ...v, isActive: x })} label={t.fields.isActive} disabled={busy} />
      </div>
    </Modal>
  );
}
