/**
 * Roles domain. Shapes follow the Legal CRM API (Identity):
 *
 *   GET  /api/identity/roles                       → RoleResponse[]            (roles.read)
 *   POST /api/identity/roles                       ← CreateRoleRequest         (roles.manage)
 *   POST /api/identity/roles/{roleId}/permissions  ← SetRolePermissionRequest  (Super Admin)
 *   GET  /api/identity/permissions/catalog         → PermissionGroupResponse[] (roles.read)
 */

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

export interface CreateRoleInput {
  key: string;
  name: string;
}

export interface SetRolePermissionInput {
  permission: string;
  granted: boolean;
}

export interface RolesSummary {
  roles: Role[];
  catalog: PermissionGroup[];
}

export interface RolesAbilities {
  canRead: boolean; // roles.read
  canCreate: boolean; // roles.manage
  canGrant: boolean; // Super Admin
}

export function rolesAbilitiesFor(user: {
  permissions: string[];
  isSuperAdmin: boolean;
}): RolesAbilities {
  const has = (key: string) => user.isSuperAdmin || user.permissions.includes(key);
  return {
    canRead: has("roles.read"),
    canCreate: has("roles.manage"),
    canGrant: user.isSuperAdmin,
  };
}
