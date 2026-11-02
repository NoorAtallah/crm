import { http, httpBlob } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import { uploadForm } from "../../../lib/upload";
import type { CaseDocument, DocumentVersion, PagedResult } from "../types";
import type { CaseDocumentsApi } from "./contract";

const BASE = "/api/documents";
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const httpCaseDocumentsApi: CaseDocumentsApi = {
  search: (query) => http<PagedResult<CaseDocument>>(`${BASE}/search${toQuery(query)}`),
  list: () => http<CaseDocument[]>(BASE),
  get: (id) => http<CaseDocument>(`${BASE}/${id}`),

  upload(caseId, file, visibleToClient, onProgress, signal) {
    const form = new FormData();
    form.append("caseId", caseId);
    form.append("visibleToClient", String(visibleToClient));
    form.append("file", file);
    return uploadForm<CaseDocument>(`${BASE}/upload`, form, onProgress, signal);
  },
  download: (id) => httpBlob(`${BASE}/${id}/content`),

  updateMetadata: (id, input, version) => http<CaseDocument>(`${BASE}/${id}/metadata`, json("PUT", { ...input, version })),
  setArchived: (id, isArchived, reason, version) =>
    http<CaseDocument>(`${BASE}/${id}/archive`, json("PUT", { isArchived, reason, version })),
  review: (id, internalNotes, version) => http<CaseDocument>(`${BASE}/${id}/review`, json("POST", { internalNotes, version })),

  versions: (id) => http<DocumentVersion[]>(`${BASE}/${id}/versions`),
  uploadVersion(id, file, version, onProgress) {
    const form = new FormData();
    form.append("version", version);
    form.append("file", file);
    return uploadForm<CaseDocument>(`${BASE}/${id}/versions`, form, onProgress);
  },
  downloadVersion: (id, n) => httpBlob(`${BASE}/${id}/versions/${n}/content`),

  createRecord: (caseId, fileName, visibleToClient) =>
    http<CaseDocument>(BASE, json("POST", { caseId, fileName, visibleToClient })),
};
