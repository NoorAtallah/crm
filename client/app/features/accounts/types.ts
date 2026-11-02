/**
 * Account administration & profiles.
 *   PUT  /api/identity/employees/{id}          ← { fullName, email }
 *   PUT  /api/clients/{id}                     ← { fullName, email, clientType }
 *   PUT  /api/accounts/{id}/status             ← { isActive }
 *   POST /api/accounts/{id}/reset-password     ← { newPassword }          (Super Admin)
 *   POST /api/auth/change-password             ← { currentPassword, newPassword }
 *   GET  /api/profiles/me · /api/profiles/{id} → AccountProfile
 *   PUT  /api/profiles/{id}/contact            ← ContactInput + version (contactVersion)
 *   PUT  /api/profiles/{id}/professional       ← ProfessionalInput + version (profileVersion)
 *   PUT  /api/profiles/{id}/client-office      ← { officeId, version (profileVersion) }
 * Changing password/email/activation signs that account out everywhere.
 */
export interface AccountProfile {
  userId: string;
  fullName: string | null;
  email: string | null;
  officeId: string | null;
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  /** Redacted unless you own it or hold employees.manage. */
  identifier: string | null;
  organizationName: string | null;
  jobTitle: string | null;
  barAssociationNumber: string | null;
  specialization: string | null;
  licenseExpiresOn: string | null;
  contactVersion: string | null;
  profileVersion: string | null;
}

export interface ContactInput {
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  identifier: string | null;
  organizationName: string | null;
}

export interface ProfessionalInput {
  officeId: string;
  jobTitle: string;
  barAssociationNumber: string | null;
  specialization: string | null;
  licenseExpiresOn: string | null;
}

export interface AccountResponse {
  id: string;
  fullName: string;
  email: string;
  type: string;
  isActive: boolean;
  deactivatedAtUtc: string | null;
  clientType: string | null;
}

export interface OfficeRef {
  id: string;
  name: string;
}

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
