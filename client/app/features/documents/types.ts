/**
 * Documents = the personal file manager. Shapes follow the Legal CRM API:
 *
 *   GET    /api/file-manager/contents?folderId=&page=&pageSize=   → FolderContentsResponse
 *   POST   /api/file-manager/folders                  ← { name, parentFolderId }
 *   PUT    /api/file-manager/folders/{id}/location    ← { parentFolderId }
 *   DELETE /api/file-manager/folders/{id}?recursive=
 *   POST   /api/file-manager/files                    ← multipart: file, folderId?   (≤ 50 MiB)
 *   GET    /api/file-manager/files/{id}               → FileEntryResponse
 *   GET    /api/file-manager/files/{id}/content       → bytes
 *   PUT    /api/file-manager/files/{id}/location      ← { folderId }
 *   DELETE /api/file-manager/files/{id}
 *
 * Everything is scoped to the signed-in user by the API — no permission
 * checks needed here.
 */

export interface Folder {
  id: string;
  parentFolderId: string | null;
  name: string;
  createdAtUtc: string;
}

export interface FileEntry {
  id: string;
  folderId: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  contentUrl: string;
  createdAtUtc: string;
}

export interface FolderContents {
  folderId: string | null;
  folders: Folder[];
  files: FileEntry[];
  totalFolders: number;
  totalFiles: number;
  page: number;
  pageSize: number;
}

/** One step of the breadcrumb. `id: null` is the root ("My files"). */
export interface Crumb {
  id: string | null;
  name: string;
}

export const PAGE_SIZE = 50;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

/** An upload in flight or finished, shown in the upload queue. */
export interface UploadItem {
  key: string;
  name: string;
  size: number;
  progress: number; // 0..1
  state: "uploading" | "done" | "error";
  error?: string;
}

export const emptyContents: FolderContents = {
  folderId: null,
  folders: [],
  files: [],
  totalFolders: 0,
  totalFiles: 0,
  page: 1,
  pageSize: PAGE_SIZE,
};
