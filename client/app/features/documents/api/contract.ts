import type { FileEntry, Folder, FolderContents } from "../types";

export interface DocumentsApi {
  contents(folderId: string | null, page?: number): Promise<FolderContents>;
  createFolder(name: string, parentFolderId: string | null): Promise<Folder>;
  moveFolder(folderId: string, parentFolderId: string | null): Promise<Folder>;
  deleteFolder(folderId: string, recursive: boolean): Promise<void>;
  upload(
    file: File,
    folderId: string | null,
    onProgress?: (share: number) => void,
    signal?: AbortSignal
  ): Promise<FileEntry>;
  getFile(fileId: string): Promise<FileEntry>;
  moveFile(fileId: string, folderId: string | null): Promise<FileEntry>;
  deleteFile(fileId: string): Promise<void>;
  /** File bytes, fetched with the Bearer token. */
  content(fileId: string): Promise<Blob>;
}
