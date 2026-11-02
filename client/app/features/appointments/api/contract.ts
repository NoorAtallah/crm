import type {
  AppointmentDetails,
  AppointmentMutation,
  AppointmentQuery,
  CaseAppointment,
  PagedResult,
} from "../types";

export interface AppointmentsApi {
  search(query: AppointmentQuery): Promise<PagedResult<CaseAppointment>>;
  /** Also returns the current case version — use it for the next write. */
  get(caseId: string, appointmentId: string): Promise<AppointmentMutation>;
  /** Current case version, for writes started outside a case page. */
  caseVersion(caseId: string): Promise<string>;
  schedule(caseId: string, details: AppointmentDetails, version: string): Promise<AppointmentMutation>;
  update(
    caseId: string,
    appointmentId: string,
    details: AppointmentDetails,
    reason: string,
    version: string
  ): Promise<AppointmentMutation>;
  cancel(caseId: string, appointmentId: string, reason: string, version: string): Promise<AppointmentMutation>;
  complete(
    caseId: string,
    appointmentId: string,
    outcome: string,
    followUp: AppointmentDetails | null,
    version: string
  ): Promise<AppointmentMutation>;
}
