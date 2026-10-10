/**
 * Public surface of the roles feature. Routes import from here —
 * never from a file inside `features/roles/`.
 */
export { RolesView } from "./components/RolesView";
export { rolesApi } from "./api";
export { rolesDictionaries, type RolesDict } from "./i18n";
export { rolesAbilitiesFor, type RolesSummary } from "./types";
