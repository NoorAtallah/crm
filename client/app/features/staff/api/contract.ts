import type {
  AssignRoleInput,
  CreateEmployeeInput,
  Employee,
  SetPermissionInput,
  StaffSummary,
} from "../types";

export interface StaffApi {
  summary(): Promise<StaffSummary>;
  create(input: CreateEmployeeInput): Promise<Employee>;
  assignRole(employeeId: string, input: AssignRoleInput): Promise<Employee>;
  setPermission(employeeId: string, input: SetPermissionInput): Promise<Employee>;
}
