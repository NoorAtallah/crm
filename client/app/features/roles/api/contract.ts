import type { CreateRoleInput, Role, RolesSummary, SetRolePermissionInput } from "../types";

export interface RolesApi {
  summary(): Promise<RolesSummary>;
  create(input: CreateRoleInput): Promise<Role>;
  setPermission(roleId: string, input: SetRolePermissionInput): Promise<Role>;
}
