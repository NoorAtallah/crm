"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, Phone, UserRound } from "lucide-react";
import { Alert, Button, Card, CardBody, CardHeader, DescriptionList, PageHeader } from "../../../components/ui";
import { HttpError, problemMessage } from "../../../lib/http";
import type { Locale } from "../../../lib/i18n";
import { SESSION_COOKIE } from "../../../lib/session-cookie";
import { accountsApi } from "../api";
import { accountsDictionaries } from "../i18n";
import type { AccountProfile } from "../types";
import { ContactDialog, PasswordFields, passwordsValid } from "./forms";

/** Signed-in user's own profile: contact details and password change. */
export function ProfileView({ initial, locale }: { initial: AccountProfile | null; locale: Locale }) {
  const t = accountsDictionaries[locale];
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning"; text: string } | null>(null);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwTouched, setPwTouched] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const changePassword = async () => {
    setPwTouched(true);
    if (!passwordsValid(pw, true) || pwBusy) return;
    setPwBusy(true);
    setPwError(null);
    try {
      await accountsApi.changePassword(pw.current, pw.next);
      // The API revokes existing tokens — sign in again with the new password.
      document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
      router.push("/login");
    } catch (e) {
      setPwError(problemMessage(e, t.saveError));
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t.myProfile} subtitle={t.myProfileHint} />
      <Alert tone={notice?.tone ?? "success"} show={!!notice}>
        {notice?.text}
      </Alert>

      <Card>
        <CardHeader title={t.account} />
        <CardBody>
          {profile ? (
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-champagne-light">
                <UserRound className="h-6 w-6 text-warning" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-text-primary">{profile.fullName}</p>
                <p className="flex items-center gap-1.5 text-[13px] text-text-muted" dir="ltr">
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {profile.email}
                </p>
                {profile.jobTitle && <p className="text-[12.5px] text-text-muted">{profile.jobTitle}</p>}
              </div>
            </div>
          ) : (
            <Alert tone="danger">{t.loadError}</Alert>
          )}
        </CardBody>
      </Card>

      {profile && (
        <Card>
          <CardHeader
            title={t.contact}
            action={
              <Button variant="secondary" className="h-9 px-3 text-[13px]" onClick={() => setEditing(true)}>
                <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t.edit}
              </Button>
            }
          />
          <CardBody>
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
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title={t.changePassword} />
        <CardBody className="space-y-4">
          <Alert tone="info">{t.signsOut}</Alert>
          <Alert tone="danger" show={!!pwError}>
            {pwError}
          </Alert>
          <div className="max-w-md space-y-4">
            <PasswordFields withCurrent busy={pwBusy} touched={pwTouched} values={pw} onChange={setPw} t={t} />
            <Button loading={pwBusy} loadingLabel={t.saving} onClick={changePassword}>
              <KeyRound className="h-4 w-4" strokeWidth={1.75} />
              {t.changePassword}
            </Button>
          </div>
        </CardBody>
      </Card>

      <ContactDialog
        open={editing}
        profile={profile}
        onClose={() => setEditing(false)}
        onSubmit={async (input) => {
          if (!profile) return;
          try {
            setProfile(await accountsApi.updateContact(profile.userId, input, profile.contactVersion));
            setNotice({ tone: "success", text: t.saved });
          } catch (e) {
            if (!(e instanceof HttpError && e.status === 409)) throw e;
            setProfile(await accountsApi.myProfile().catch(() => profile));
            setNotice({ tone: "warning", text: t.conflict });
          }
        }}
        t={t}
      />
    </div>
  );
}
