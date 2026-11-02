import { http } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type { Communication, CommunicationQuery, CreateCommunicationInput, PagedResult } from "../types";

export interface CommunicationsApi {
  search(query: CommunicationQuery): Promise<PagedResult<Communication>>;
  get(id: string): Promise<Communication>;
  create(input: CreateCommunicationInput): Promise<Communication>;
}

export const communicationsApi: CommunicationsApi = {
  search: (query) => http<PagedResult<Communication>>(`/api/communications/search${toQuery(query)}`),
  get: (id) => http<Communication>(`/api/communications/${id}`),
  create: (input) => http<Communication>("/api/communications", { method: "POST", body: JSON.stringify(input) }),
};
