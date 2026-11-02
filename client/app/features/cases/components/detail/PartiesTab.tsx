"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Archive, Building2, EyeOff, Mail, Pencil, Phone, Plus, User } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Modal,
  Pagination,
  SearchInput,
  SelectField,
  Spinner,
  Switch,
  TextArea,
} from "../../../../components/ui";
import { problemMessage } from "../../../../lib/http";
import { interpolate } from "../../../../lib/i18n";
import { casesApi } from "../../api";
import type { CasesDict } from "../../i18n";
import { PARTY_ROLES, type CaseParty, type CasePartyInput, type CasePartyRole, type PagedResult } from "../../types";
import { isConflict, orNull } from "./shared";

const blank: CasePartyInput = {
  role: "Claimant",
  name: "",
  isOrganization: false,
  representativeName: null,
  identifier: null,
  phone: null,
  email: null,
  address: null,
  internalNotes: null,
  visibleToClient: false,
};

export function PartiesTab({
  caseId,
  version,
  onVersion,
  canManage,
  onConflict,
  t: dict,
}: {
  caseId: string;
  version: string;
  onVersion: (v: string) => void;
  canManage: boolean;
  onConflict: () => Promise<void>;
  t: CasesDict;
}) {
  const t = dict.detail;
  const tp = t.parties;
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<PagedResult<CaseParty> | null>(null);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<CasePartyRole | "">("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<CaseParty | "new" | null>(null);
  const [archiving, setArchiving] = useState<CaseParty | null>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    return casesApi
      .parties(caseId, { page, pageSize: 25, search: search.trim(), role: role || undefined, includeArchived })
      .then(setData)
      .catch(() => setFailed(true));
  }, [caseId, page, search, role, includeArchived]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  async function archive() {
    if (!archiving) return;
    setArchiveBusy(true);
    try {
      const res = await casesApi.archiveParty(caseId, archiving.id, version);
      onVersion(res.version);
      setArchiving(null);
      await load();
    } catch (e) {
      setArchiving(null);
      if (isConflict(e)) await onConflict();
    } finally {
      setArchiveBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <SearchInput
          value={search}
          placeholder={tp.search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value as CasePartyRole | "");
          }}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-text-primary focus:outline-none"
        >
          <option value="">{tp.allRoles}</option>
          {PARTY_ROLES.map((r) => (
            <option key={r} value={r}>
              {tp.roles[r]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[13px] text-text-muted">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => {
              setPage(1);
              setIncludeArchived(e.target.checked);
            }}
            className="h-4 w-4 accent-brand-charcoal"
          />
          {tp.showArchived}
        </label>
        {canManage && (
          <Button className="ms-auto h-9 px-3 text-[13px]" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            {tp.add}
          </Button>
        )}
      </div>

      <div className="px-5 pt-4">
        <Alert tone="danger" show={failed}>
          {t.loadError}
        </Alert>
      </div>

      {!data && !failed && <Spinner block />}

      {data &&
        (data.items.length === 0 ? (
          <EmptyState>{tp.empty}</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {data.items.map((party, index) => (
              <motion.li
                key={party.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.18) }}
                className={`flex items-start gap-3 px-5 py-4 ${party.isActive ? "" : "opacity-60"}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                  {party.isOrganization ? (
                    <Building2 className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                  ) : (
                    <User className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-medium text-text-primary">{party.name}</p>
                    <Badge tone="info">{tp.roles[party.role]}</Badge>
                    {!party.visibleToClient && (
                      <Badge>
                        <EyeOff className="me-1 h-3 w-3" strokeWidth={1.75} />
                        {tp.hidden}
                      </Badge>
                    )}
                    {!party.isActive && <Badge tone="warning">{tp.archived}</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-text-muted">
                    {party.representativeName && <span>{party.representativeName}</span>}
                    {party.phone && (
                      <span className="inline-flex items-center gap-1" dir="ltr">
                        <Phone className="h-3 w-3" strokeWidth={1.75} />
                        {party.phone}
                      </span>
                    )}
                    {party.email && (
                      <span className="inline-flex items-center gap-1" dir="ltr">
                        <Mail className="h-3 w-3" strokeWidth={1.75} />
                        {party.email}
                      </span>
                    )}
                  </div>
                </div>
                {canManage && party.isActive && (
                  <div className="flex gap-1">
                    <IconButton icon={Pencil} label={tp.edit} onClick={() => setEditing(party)} />
                    <IconButton icon={Archive} label={tp.archive} tone="danger" onClick={() => setArchiving(party)} />
                  </div>
                )}
              </motion.li>
            ))}
          </ul>
        ))}

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onChange={setPage}
          label={interpolate(t.pageOf, { page: data.page, total: data.totalPages })}
        />
      )}

      <PartyDialog
        party={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (input) => {
          try {
            const res =
              editing === "new" || editing === null
                ? await casesApi.addParty(caseId, input, version)
                : await casesApi.updateParty(caseId, editing.id, input, version);
            onVersion(res.version);
            await load();
          } catch (e) {
            if (isConflict(e)) {
              setEditing(null);
              await onConflict();
              return false;
            }
            throw e;
          }
          return true;
        }}
        t={dict}
      />

      <ConfirmDialog
        open={!!archiving}
        onClose={() => setArchiving(null)}
        onConfirm={archive}
        busy={archiveBusy}
        title={tp.archiveTitle}
        confirmLabel={tp.archive}
        cancelLabel={dict.cancel}
        closeLabel={dict.close}
      >
        <p className="font-medium">{archiving?.name}</p>
        <p className="mt-1 text-text-muted">{tp.archiveConfirm}</p>
      </ConfirmDialog>
    </div>
  );
}

function PartyDialog({
  party,
  onClose,
  onSubmit,
  t: dict,
}: {
  party: CaseParty | "new" | null;
  onClose: () => void;
  /** Resolves true when saved; false when it closed itself on a conflict. */
  onSubmit: (input: CasePartyInput) => Promise<boolean>;
  t: CasesDict;
}) {
  const tp = dict.detail.parties;
  const open = party !== null;
  const [values, setValues] = useState<CasePartyInput>(blank);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openedFor, setOpenedFor] = useState<typeof party>(null);
  if (party !== openedFor) {
    setOpenedFor(party);
    if (party) {
      const { id: _id, isActive: _a, archivedAtUtc: _d, ...rest } = party === "new" ? { ...blank, id: "", isActive: true, archivedAtUtc: null } : party;
      setValues(rest);
      setTouched(false);
      setError(null);
    }
  }

  const set = <K extends keyof CasePartyInput>(key: K, value: CasePartyInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const text = (key: "representativeName" | "identifier" | "phone" | "email" | "address", label: string, max: number, ltr = false) => (
    <Field
      id={`party-${key}`}
      label={label}
      maxLength={max}
      dir={ltr ? "ltr" : undefined}
      type={key === "email" ? "email" : "text"}
      value={values[key] ?? ""}
      onChange={(e) => set(key, e.target.value)}
      disabled={busy}
    />
  );

  async function save() {
    setTouched(true);
    if (!values.name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await onSubmit({
        ...values,
        name: values.name.trim(),
        representativeName: orNull(values.representativeName ?? ""),
        identifier: orNull(values.identifier ?? ""),
        phone: orNull(values.phone ?? ""),
        email: orNull(values.email ?? ""),
        address: orNull(values.address ?? ""),
        internalNotes: orNull(values.internalNotes ?? ""),
      });
      if (ok) onClose();
    } catch (e) {
      setError(problemMessage(e, dict.detail.saveError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title={party === "new" ? tp.add : tp.edit}
      closeLabel={dict.close}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {dict.cancel}
          </Button>
          <Button loading={busy} loadingLabel={dict.detail.saving} onClick={save}>
            {dict.detail.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="danger" show={!!error}>
          {error}
        </Alert>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="party-role"
            label={tp.role}
            value={values.role}
            onChange={(e) => set("role", e.target.value as CasePartyRole)}
            options={PARTY_ROLES.map((r) => ({ value: r, label: tp.roles[r] }))}
            disabled={busy}
          />
          <Field
            id="party-name"
            label={tp.name}
            maxLength={200}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={touched && !values.name.trim() ? dict.required : undefined}
            disabled={busy}
          />
          {text("representativeName", tp.representative, 200)}
          {text("identifier", tp.identifier, 100, true)}
          {text("phone", tp.phone, 50, true)}
          {text("email", tp.email, 256, true)}
        </div>
        {text("address", tp.address, 1000)}
        <TextArea
          id="party-notes"
          label={tp.notes}
          rows={3}
          maxLength={4000}
          value={values.internalNotes ?? ""}
          onChange={(e) => set("internalNotes", e.target.value)}
          disabled={busy}
        />
        <div className="space-y-3 rounded-lg border border-line px-4 py-3">
          <Switch checked={values.isOrganization} onChange={(v) => set("isOrganization", v)} label={tp.isOrganization} disabled={busy} />
          <Switch
            checked={values.visibleToClient}
            onChange={(v) => set("visibleToClient", v)}
            label={tp.visibleToClient}
            hint={tp.visibleHint}
            disabled={busy}
          />
        </div>
      </div>
    </Modal>
  );
}
