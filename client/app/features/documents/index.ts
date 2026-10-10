/**
 * Public surface of the documents feature (personal file manager).
 * Routes import from here — never from a file inside `features/documents/`.
 */
export { DocumentsView } from "./components/DocumentsView";
export { documentsApi } from "./api";
export { documentsDictionaries, type DocumentsDict } from "./i18n";
export { emptyContents, type FileEntry, type Folder, type FolderContents } from "./types";
