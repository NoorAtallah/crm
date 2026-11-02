"use client";

import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, KeyRound, Pencil, Phone, Power, UserRound } from "lucide-react";
import { Alert, Badge, Button, ConfirmDialog, DescriptionList, Spinner } from "../../../components/ui";
import { formatDate } from "../../../lib/format";
import { http, HttpError, problemMessage } from "../../../lib/http";
import type { Locale } from "../../../lib/i18n";
import { accountsApi } from "../api";
import { accountsDictionaries } from "../i18n";
import type { AccountProfile, OfficeRef } from "../types";
import { AccountDialog, ContactDialog, ProfessionalDialog, ResetPasswordDialog } from "./forms";

const isConflict = (e: unknown) => e instanceof HttpError && e.status === 409;
type Dialog = null | "account" | "contact" | "professional" | "status" | "reset";

/**
 * Account admin block for the staff and client side panels:
 * name/email, activation, password reset, contact + professional/office profile.
 */
export function AccountPanel({
  userId,
  kind,
  fullName,
  email,
  clientType,
  isActive,
  canManage,
  isSuperAdmin,
  locale,
  onAccountChanged,
}: {
  userId: string;
  kind: "employee" | "client";
  fullName: string;
  email: string;
  clientType?: string | null;
  isActive: boolean;
  /** `employees.manage` (with office Manage access). */
  canManage: boolean;
  /** Only the Super Admin resets other people's passwords. */
  isSuperAdmin: boolean;
  locale: Locale;
  onAccountChanged: (patch: { fullName?: string; email?: string; isActive?: boolean; clientType?: string }) => void;
}) {
  const t = accountsDictionaries[locale];
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [failed, setFailed] = useState(false);
  const [offices, setOffices] = useState<OfficeRef[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null);

  const load = useCallback(() => {
    setFailed(false);
    return accountsApi
      .profile(userId)
      .then(setProfile)
      .catch(() => setFailed(true));
  }, [userId]);

  useEffect(() => {
    setProfile(null);
    setNotice(null);
    load();
  }, [load]);

  useEffect(() => {
    http<{ items: { id: string; name: string; isActive: boolean }[] }>("/api/offices?pageSize=100")
      .then((r) => setOffices(r.items.filter((o) => o.isActive).map((o) => ({ id: o.id, name: o.name }))))
      .catch(() => setOffices([]));
  }, []);

  /** Profile writes are versioned — on 409 reload and say so. */
  const saveProfile = async (fn: () => Promise<AccountProfile>) => {
    try {
      setProfile(await fn());
      setNotice({ tone: "success", text: t.saved });
    } catch (e) {
      if (!isConflict(e)) throw e;
      await load();
      setNotice({ tone: "warning", text: t.conflict });
    }
  };

  const officeName = offices.find((o) => o.id === profile?.officeId)?.name;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[14px] font-semibold text-text-primary">
          <UserRound className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
          {t.account}
        </h3>
        <Badge tone={isActive ? "success" : "danger"}>{isActive ? t.active : t.inactive}</Badge>
      </div>

      <Alert tone={notice?.tone ?? "success"} show={!!notice}>
        {notice?.text}
      </Alert>

      {canManage && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="h-9 px-3 text-[13px]" onClick={() => setDialog("account")}>
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t.editAccount}
          </Button>
          <Button variant={isActive ? "secondary" : "primary"} className="h-9 px-3 text-[13px]" onClick={() => setDialog("status")}>
            <Power className="h-3.5 w-3.5" strokeWidth={1.75} />
            {isActive ? t.deactivate : t.activate}
          </Button>
          {isSuperAdmin && (
            <Button variant="secondary" className="h-9 px-3 text-[13px]" onClick={() => setDialog("reset")}>
              <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t.resetPassword}
            </Button>
          )}
        </div>
      )}

      <Alert tone="danger" show={failed}>
        {t.loadError}
      </Alert>
      {!profile && !failed && <Spinner block />}

      {profile && (
        <>
          <div className="rounded-lg border border-line p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-text-primary">
                <Phone className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />
                {t.contact}
              </p>
              {canManage && (
                <button type="button" onClick={() => setDialog("contact")} className="text-[12.5px] font-medium text-info hover:underline">
                  {t.edit}
                </button>
              )}
            </div>
            <DescriptionList
              columns={2}
              items={[
                { label: t.fields.phone, value: profile.phone && <span dir="ltr">{profile.phone}</span> },
                { label: t.fields.alternatePhone, value: profile.alternatePhone && <span dir="ltr">{profile.alternatePhone}</span> },
                { label: t.fields.city, value: profile.city },
                { label: t.fields.country, value: profile.country },
                { label: t.fields.identifier, value: profile.identifier && <span dir="ltr">{profile.identifier}</span> },
                { label: t.fields.organizationName, value: profile.organizationName },
                { label: t.fields.address, value: profile.address, full: true },
              ]}
            />
          </div>

          {kind === "employee" ? (
            <div className="rounded-lg border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-text-primary">
                  <BriefcaseBusiness className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />
                  {t.professional}
                </p>
                {canManage && (
                  <button type="button" onClick={() => setDialog("professional")} className="text-[12.5px] font-medium text-info hover:underline">
                    {t.edit}
                  </button>
                )}
              </div>
              <DescriptionList
                columns={2}
                items={[
                  { label: t.fields.office, value: officeName },
                  { label: t.fields.jobTitle, value: profile.jobTitle },
                  { label: t.fields.barAssociationNumber, value: profile.barAssociationNumber && <span dir="ltr">{profile.barAssociationNumber}</span> },
                  { label: t.fields.licenseExpiresOn, value: profile.licenseExpiresOn ? formatDate(profile.licenseExpiresOn, locale) : null },
                  { label: t.fields.specialization, value: profile.specialization, full: true },
                ]}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-line p-4">
              <p className="mb-2 text-[13px] font-semibold text-text-primary">{t.clientOffice}</p>
              {canManage ? (
                <select
                  value={profile.officeId ?? ""}
                  onChange={async (e) => {
                    if (!e.target.value) return;
                    try {
                      await saveProfile(() => accountsApi.setClientOffice(userId, e.target.value, profile.profileVersion));
                    } catch (err) {
                      setNotice({ tone: "danger", text: problemMessage(err, t.saveError) });
                    }
                  }}
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[13.5px] text-text-primary focus:outline-none"
                >
                  <option value="">{t.noOffice}</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-[13.5px] text-text-primary">{officeName ?? "—"}</p>
              )}
            </div>
          )}
        </>
      )}

      <AccountDialog
        open={dialog === "account"}
        kind={kind}
        initial={{ fullName, email, clientType: clientType ?? undefined }}
        onClose={() => setDialog(null)}
        onSubmit={async (v) => {
          if (kind === "client") await accountsApi.updateClient(userId, v.fullName, v.email, v.clientType);
          else await accountsApi.updateEmployee(userId, v.fullName, v.email);
          onAccountChanged(kind === "client" ? v : { fullName: v.fullName, email: v.email });
          setNotice({ tone: "success", text: t.saved });
        }}
        t={t}
      />
      <ContactDialog
        open={dialog === "contact"}
        profile={profile}
        onClose={() => setDialog(null)}
        onSubmit={(input) => saveProfile(() => accountsApi.updateContact(userId, input, profile?.contactVersion ?? null))}
        t={t}
      />
      <ProfessionalDialog
        open={dialog === "professional"}
        profile={profile}
        offices={offices}
        onClose={() => setDialog(null)}
        onSubmit={(input) => saveProfile(() => accountsApi.updateProfessional(userId, input, profile?.profileVersion ?? null))}
        t={t}
      />
      <ResetPasswordDialog
        open={dialog === "reset"}
        name={fullName}
        onClose={() => setDialog(null)}
        onSubmit={async (pw) => {
          await accountsApi.resetPassword(userId, pw);
          setNotice({ tone: "success", text: t.passwordReset });
        }}
        t={t}
      />
      <ConfirmDialog
        open={dialog === "status"}
        onClose={() => setDialog(null)}
        busy={statusBusy}
        tone={isActive ? "danger" : "primary"}
        title={isActive ? t.deactivate : t.activate}
        confirmLabel={t.confirm}
        cancelLabel={t.cancel}
        closeLabel={t.close}
        onConfirm={async () => {
          setStatusBusy(true);
          try {
            const res = await accountsApi.setStatus(userId, !isActive);
            onAccountChanged({ isActive: res.isActive });
            setNotice({ tone: "success", text: t.saved });
          } catch (e) {
            setNotice({ tone: "danger", text: problemMessage(e, t.saveError) });
          } finally {
            setStatusBusy(false);
            setDialog(null);
          }
        }}
      >
        <p>{isActive ? t.deactivateConfirm : t.activateConfirm}</p>
      </ConfirmDialog>
    </section>
  );
}
