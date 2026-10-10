import { http } from "../../../lib/http";
import type { Employee, PermissionGroup, Role, StaffSummary } from "../types";
import type { StaffApi } from "./contract";

const EMPLOYEES = "/api/identity/employees";

export const httpStaffApi: StaffApi = {
  async summary(): Promise<StaffSummary> {
    const [employees, roles, catalog] = await Promise.all([
      http<Employee[]>(EMPLOYEES),
      // Both need `roles.read`. Without it the page still lists people,
      // it just can't offer role or permission pickers.
      http<Role[]>("/api/identity/roles").catch(() => [] as Role[]),
      http<PermissionGroup[]>("/api/identity/permissions/catalog").catch(
        () => [] as PermissionGroup[]
      ),
    ]);
    return { employees, roles, catalog };
  },

  create(input) {
    return http<Employee>(EMPLOYEES, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  assignRole(employeeId, input) {
    return http<Employee>(`${EMPLOYEES}/${employeeId}/role`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  setPermission(employeeId, input) {
    return http<Employee>(`${EMPLOYEES}/${employeeId}/permissions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
