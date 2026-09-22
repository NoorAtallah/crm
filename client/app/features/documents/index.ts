/**
 * Public surface of the documents feature. Routes import from here —
 * never from a file inside `features/documents/`.
 */
export { DocumentsView } from "./components/DocumentsView";
export { documentsApi } from "./api";
export { documentsDictionaries, type DocumentsDict } from "./i18n";
export {
  abilitiesForRole,
  emptyQuery,
  type CaseRef,
  type DocumentRow,
  type DocumentStatus,
  type DocumentsQuery,
  type DocumentsSummary,
} from "./types";
