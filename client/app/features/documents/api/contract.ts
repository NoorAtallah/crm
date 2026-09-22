import type {
  DocumentRow,
  DocumentsQuery,
  DocumentsSummary,
  ReviewDocumentInput,
  UploadDocumentInput,
} from "../types";

export interface DocumentsApi {
  list(query: DocumentsQuery): Promise<DocumentsSummary>;
  upload(input: UploadDocumentInput): Promise<DocumentRow>;
  review(documentId: string, input: ReviewDocumentInput): Promise<DocumentRow>;
}
