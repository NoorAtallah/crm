/**
 * Public surface of the cases feature. Routes import from here —
 * never from a file inside `features/cases/`.
 */
export { CasesView } from "./components/CasesView";
export { casesApi } from "./api";
export { casesDictionaries, type CasesDict } from "./i18n";
export type { CaseRow, CasesSummary, PersonOption } from "./types";
