/**
 * Staff domain. Shapes follow the Legal CRM API (Identity):
 *
 *   GET  /api/identity/employees                        → EmployeeResponse[]
 *   POST /api/identity/employees                        ← CreateEmployeeRequest
 *   PUT  /api/identity/employees/{id}/role              ← AssignRoleRequest       (Super Admin)
 *   POST /api/identity/employees/{id}/permissions       ← SetEmployeePermissionRequest
 *   GET  /api/identity/roles                            → RoleResponse[]           (roles.read)
 *   GET  /api/identity/permissions/catalog              → PermissionGroupResponse[] (roles.read)
 */

/** EmployeeType enum, serialized as a string by the API. */
export type EmployeeType =
  | "SuperAdmin"
  | "OfficeManager"
  | "Lawyer"
  | "Secretary"
  | "Client";

export const EMPLOYEE_TYPES: EmployeeType[] = [
  "SuperAdmin",
  "OfficeManager",
  "Lawyer",
  "Secretary",
  "Client",
];

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  type: EmployeeType;
  isActive: boolean;
  roleId: string;
  roleName: string;
  /** Granted to this person on top of their role. */
  directPermissions: string[];
  /** Role permissions + direct permissions — what they can actually do. */
  effectivePermissions: string[];
}

export interface Role {
  id: string;
  key: string;
  name: string;
  isSystemRole: boolean;
  permissions: string[];
}

export interface Permission {
  key: string;
  category: string;
  displayName: string;
  description: string;
  systemOnly: boolean;
}

export interface PermissionGroup {
  category: string;
  permissions: Permission[];
}

export interface CreateEmployeeInput {
  fullName: string;
  email: string;
  password: string;
  roleId: string;
  type: EmployeeType;
}

export interface AssignRoleInput {
  roleId: string;
  type: EmployeeType;
}

export interface SetPermissionInput {
  permission: string;
  granted: boolean;
}

/** Everything the page needs, loaded once on the server. */
export interface StaffSummary {
  employees: Employee[];
  roles: Role[];
  catalog: PermissionGroup[];
}

/** What the viewer may do here, from their permission keys. */
export interface StaffAbilities {
  canRead: boolean; // employees.read
  canManage: boolean; // employees.manage
  /** Super Admin only: assign roles, create Super Admins. */
  isSuperAdmin: boolean;
  /** Direct permission grants — same rule as role grants. */
  canGrant: boolean;
}

export function abilitiesFor(user: {
  permissions: string[];
  isSuperAdmin: boolean;
}): StaffAbilities {
  const has = (key: string) => user.isSuperAdmin || user.permissions.includes(key);
  return {
    canRead: has("employees.read"),
    canManage: has("employees.manage"),
    isSuperAdmin: user.isSuperAdmin,
    canGrant: user.isSuperAdmin || user.permissions.includes("system.permissions.manage"),
  };
}
