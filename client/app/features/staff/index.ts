/**
 * Public surface of the staff feature. Routes import from here —
 * never from a file inside `features/staff/`.
 */
export { StaffView } from "./components/StaffView";
export { staffApi } from "./api";
export { staffDictionaries, type StaffDict } from "./i18n";
export { abilitiesFor, type Employee, type StaffSummary } from "./types";
