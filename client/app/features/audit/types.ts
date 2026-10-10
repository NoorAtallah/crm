/**
 * Audit domain. GET /api/identity/audit-log → AuditLogResponse[] (audit.read).
 * Newest first, straight from the API.
 */
export interface AuditEntry {
  id: string;
  actorEmployeeId: string;
  actorName: string;
  /** Dotted verb, e.g. "role.permission.granted". */
  action: string;
  /** "Role", "Employee", "LegalCase", … */
  resourceType: string;
  resourceId: string | null;
  details: string;
  createdAtUtc: string;
}

export function canReadAudit(user: { permissions: string[]; isSuperAdmin: boolean }) {
  return user.isSuperAdmin || user.permissions.includes("audit.read");
}
