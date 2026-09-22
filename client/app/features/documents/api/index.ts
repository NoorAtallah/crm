import { mockDocumentsApi } from "./mock";
import { httpDocumentsApi } from "./http";

/** Swap to `httpDocumentsApi` once the list endpoint is confirmed. */
export const documentsApi = mockDocumentsApi;

void httpDocumentsApi;

export type { DocumentsApi } from "./contract";
