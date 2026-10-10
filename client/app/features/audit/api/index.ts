import { http } from "../../../lib/http";
import type { AuditEntry } from "../types";

export const auditApi = {
  list(): Promise<AuditEntry[]> {
    return http<AuditEntry[]>("/api/identity/audit-log");
  },
};
