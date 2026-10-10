import { http } from "../../../lib/http";
import type { PermissionGroup, Role, RolesSummary } from "../types";
import type { RolesApi } from "./contract";

const ROLES = "/api/identity/roles";

export const httpRolesApi: RolesApi = {
  async summary(): Promise<RolesSummary> {
    const [roles, catalog] = await Promise.all([
      http<Role[]>(ROLES),
      http<PermissionGroup[]>("/api/identity/permissions/catalog"),
    ]);
    return { roles, catalog };
  },

  create(input) {
    return http<Role>(ROLES, { method: "POST", body: JSON.stringify(input) });
  },

  setPermission(roleId, input) {
    return http<Role>(`${ROLES}/${roleId}/permissions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
