import { httpBlob } from "./http";
import { toQuery } from "./query";

export type ExportFormat = "Xlsx" | "Pdf";

/**
 * GET /api/exports/{path}?format=…&<filters>. Paging params are dropped — the
 * API exports every matching row up to `maxRows` (default 1000, max 5000) and
 * answers 400 if there are more, so narrow the filters in that case.
 */
export function exportFile(path: string, format: ExportFormat, filters: object = {}, maxRows?: number): Promise<Blob> {
  const { page: _p, pageSize: _s, ...rest } = filters as Record<string, unknown>;
  return httpBlob(`/api/exports/${path}${toQuery({ ...rest, format, maxRows })}`);
}
