import { http } from "../../../lib/http";
import type { AccountProfile, AccountResponse, ContactInput, ProfessionalInput } from "../types";

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export interface AccountsApi {
  updateEmployee(id: string, fullName: string, email: string): Promise<unknown>;
  updateClient(id: string, fullName: string, email: string, clientType: string): Promise<unknown>;
  setStatus(id: string, isActive: boolean): Promise<AccountResponse>;
  resetPassword(id: string, newPassword: string): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;

  myProfile(): Promise<AccountProfile>;
  profile(userId: string): Promise<AccountProfile>;
  updateContact(userId: string, input: ContactInput, version: string | null): Promise<AccountProfile>;
  updateProfessional(userId: string, input: ProfessionalInput, version: string | null): Promise<AccountProfile>;
  setClientOffice(userId: string, officeId: string, version: string | null): Promise<AccountProfile>;
}

export const accountsApi: AccountsApi = {
  updateEmployee: (id, fullName, email) => http(`/api/identity/employees/${id}`, json("PUT", { fullName, email })),
  updateClient: (id, fullName, email, clientType) => http(`/api/clients/${id}`, json("PUT", { fullName, email, clientType })),
  setStatus: (id, isActive) => http<AccountResponse>(`/api/accounts/${id}/status`, json("PUT", { isActive })),
  async resetPassword(id, newPassword) {
    await http(`/api/accounts/${id}/reset-password`, json("POST", { newPassword }));
  },
  async changePassword(currentPassword, newPassword) {
    await http("/api/auth/change-password", json("POST", { currentPassword, newPassword }));
  },

  myProfile: () => http<AccountProfile>("/api/profiles/me"),
  profile: (id) => http<AccountProfile>(`/api/profiles/${id}`),
  // A version is omitted only when that record doesn't exist yet.
  updateContact: (id, input, version) => http<AccountProfile>(`/api/profiles/${id}/contact`, json("PUT", { ...input, version: version ?? undefined })),
  updateProfessional: (id, input, version) =>
    http<AccountProfile>(`/api/profiles/${id}/professional`, json("PUT", { ...input, version: version ?? undefined })),
  setClientOffice: (id, officeId, version) => http<AccountProfile>(`/api/profiles/${id}/client-office`, json("PUT", { officeId, version: version ?? undefined })),
};
