import type { AppointmentsDict } from "../i18n";
import type { AppointmentDetails, AppointmentKind, CaseAppointment } from "../types";

/** Form state: dates as `datetime-local` strings in the viewer's time zone. */
export interface AppointmentForm {
  kind: AppointmentKind;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  lawyerId: string;
  internalNotes: string;
  visibleToClient: boolean;
}

export type FormErrors = Partial<Record<keyof AppointmentForm, string>>;

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO (UTC) → "YYYY-MM-DDTHH:mm" in local time. */
export function toLocalInput(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "YYYY-MM-DDTHH:mm" local → ISO UTC. */
export const fromLocalInput = (value: string) => new Date(value).toISOString();

/** Next whole hour, one hour long. */
export function blankForm(lawyerId = "", after?: string): AppointmentForm {
  const start = after ? new Date(after) : new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + (after ? 24 : 1));
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    kind: "Hearing",
    title: "",
    startsAt: toLocalInput(start),
    endsAt: toLocalInput(end),
    location: "",
    lawyerId,
    internalNotes: "",
    visibleToClient: true,
  };
}

export function formFrom(item: CaseAppointment): AppointmentForm {
  return {
    kind: item.kind,
    title: item.title ?? "",
    startsAt: toLocalInput(item.startsAtUtc),
    endsAt: toLocalInput(item.endsAtUtc),
    location: item.location ?? "",
    lawyerId: item.assignedLawyerEmployeeId ?? "",
    internalNotes: item.internalNotes ?? "",
    visibleToClient: item.visibleToClient,
  };
}

export function toDetails(form: AppointmentForm): AppointmentDetails {
  return {
    kind: form.kind,
    title: form.title.trim(),
    startsAtUtc: fromLocalInput(form.startsAt),
    endsAtUtc: fromLocalInput(form.endsAt),
    location: form.location.trim() || null,
    assignedLawyerEmployeeId: form.lawyerId,
    internalNotes: form.internalNotes.trim() || null,
    visibleToClient: form.visibleToClient,
  };
}

/** Mirrors the API's rules so most mistakes are caught before a round trip. */
export function validate(form: AppointmentForm, t: AppointmentsDict, mustStartAfter?: string): FormErrors {
  const e: FormErrors = {};
  if (!form.title.trim()) e.title = t.required;
  if (!form.location.trim()) e.location = t.required;
  if (!form.lawyerId) e.lawyerId = t.required;
  if (!form.startsAt) e.startsAt = t.required;
  if (!form.endsAt) e.endsAt = t.required;
  if (form.startsAt && form.endsAt) {
    const start = new Date(form.startsAt).getTime();
    const end = new Date(form.endsAt).getTime();
    if (end <= start) e.endsAt = t.errors.endBeforeStart;
    else if (end - start > 7 * 864e5) e.endsAt = t.errors.tooLong;
    if (mustStartAfter && start <= new Date(mustStartAfter).getTime()) e.startsAt = t.fields.followUpHint;
  }
  return e;
}
