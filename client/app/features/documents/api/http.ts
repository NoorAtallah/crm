import { apiUrl, http, httpBlob, HttpError, readToken } from "../../../lib/http";
import { PAGE_SIZE, type FileEntry, type Folder, type FolderContents } from "../types";
import type { DocumentsApi } from "./contract";

const BASE = "/api/file-manager";

/**
 * Upload goes through XHR, not fetch — fetch still can't report upload
 * progress. Errors come back as the same HttpError `http()` throws.
 */
async function upload(
  file: File,
  folderId: string | null,
  onProgress?: (share: number) => void,
  signal?: AbortSignal
): Promise<FileEntry> {
  const token = await readToken();
  const form = new FormData();
  form.append("file", file);
  if (folderId) form.append("folderId", folderId);

  return new Promise<FileEntry>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl(`${BASE}/files`));
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = xhr.responseText;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as FileEntry);
      else reject(new HttpError(xhr.status, body));
    };
    xhr.onerror = () => reject(new HttpError(0, null));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}

export const httpDocumentsApi: DocumentsApi = {
  contents(folderId, page = 1) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (folderId) params.set("folderId", folderId);
    return http<FolderContents>(`${BASE}/contents?${params}`);
  },

  createFolder(name, parentFolderId) {
    return http<Folder>(`${BASE}/folders`, {
      method: "POST",
      body: JSON.stringify({ name, parentFolderId }),
    });
  },

  moveFolder(folderId, parentFolderId) {
    return http<Folder>(`${BASE}/folders/${folderId}/location`, {
      method: "PUT",
      body: JSON.stringify({ parentFolderId }),
    });
  },

  async deleteFolder(folderId, recursive) {
    await http<null>(`${BASE}/folders/${folderId}?recursive=${recursive}`, { method: "DELETE" });
  },

  upload,

  getFile(fileId) {
    return http<FileEntry>(`${BASE}/files/${fileId}`);
  },

  moveFile(fileId, folderId) {
    return http<FileEntry>(`${BASE}/files/${fileId}/location`, {
      method: "PUT",
      body: JSON.stringify({ folderId }),
    });
  },

  async deleteFile(fileId) {
    await http<null>(`${BASE}/files/${fileId}`, { method: "DELETE" });
  },

  content(fileId) {
    return httpBlob(`${BASE}/files/${fileId}/content`);
  },
};
