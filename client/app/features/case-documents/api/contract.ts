import type { CaseDocument, DocumentQuery, DocumentVersion, MetadataInput, PagedResult } from "../types";

export interface CaseDocumentsApi {
  search(query: DocumentQuery): Promise<PagedResult<CaseDocument>>;
  /** Legacy unpaged list of every visible document. */
  list(): Promise<CaseDocument[]>;
  get(documentId: string): Promise<CaseDocument>;
  upload(
    caseId: string,
    file: File,
    visibleToClient: boolean,
    onProgress?: (share: number) => void,
    signal?: AbortSignal
  ): Promise<CaseDocument>;
  download(documentId: string): Promise<Blob>;
  updateMetadata(documentId: string, input: MetadataInput, version: string): Promise<CaseDocument>;
  setArchived(documentId: string, isArchived: boolean, reason: string | null, version: string): Promise<CaseDocument>;
  review(documentId: string, internalNotes: string | null, version: string): Promise<CaseDocument>;
  versions(documentId: string): Promise<DocumentVersion[]>;
  uploadVersion(
    documentId: string,
    file: File,
    version: string,
    onProgress?: (share: number) => void
  ): Promise<CaseDocument>;
  downloadVersion(documentId: string, versionNumber: number): Promise<Blob>;
  /** Metadata-only record without a file (older API). Prefer `upload`. */
  createRecord(caseId: string, fileName: string, visibleToClient: boolean): Promise<CaseDocument>;
}
