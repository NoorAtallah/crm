import { apiUrl, HttpError, readToken } from "./http";

/**
 * Multipart POST with upload progress (fetch can't report it yet).
 * Rejects with the same HttpError `http()` throws.
 */
export async function uploadForm<T>(
  path: string,
  form: FormData,
  onProgress?: (share: number) => void,
  signal?: AbortSignal
): Promise<T> {
  const token = await readToken();
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl(path));
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = xhr.responseText;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as T);
      else reject(new HttpError(xhr.status, body));
    };
    xhr.onerror = () => reject(new HttpError(0, null));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}
