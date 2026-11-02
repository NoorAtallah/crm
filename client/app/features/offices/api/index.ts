import { http } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type { AccessGrant, Office, OfficeGrant, PagedResult, Team, TeamMember } from "../types";

const BASE = "/api/offices";
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
type Paging = { page?: number; pageSize?: number; search?: string; includeInactive?: boolean };

export interface OfficesApi {
  list(q?: Paging): Promise<PagedResult<Office>>;
  get(id: string): Promise<Office>;
  create(input: { code: string; name: string; isActive: boolean }): Promise<Office>;
  update(id: string, input: { code: string; name: string; isActive: boolean }, version: string): Promise<Office>;

  access(id: string, q?: Paging): Promise<PagedResult<OfficeGrant>>;
  /** `grant: null` revokes. Uses the OFFICE version. */
  setAccess(id: string, userId: string, grant: AccessGrant | null, officeVersion: string): Promise<Office>;

  teams(id: string, q?: Paging): Promise<PagedResult<Team>>;
  createTeam(id: string, input: { key: string; name: string; isActive: boolean }): Promise<Team>;
  updateTeam(id: string, teamId: string, input: { key: string; name: string; isActive: boolean }, version: string): Promise<Team>;
  members(id: string, teamId: string, q?: Paging): Promise<PagedResult<TeamMember>>;
  /** Add/reactivate (`active: true`) or remove. Uses the TEAM version. */
  setMember(id: string, teamId: string, userId: string, active: boolean, isLead: boolean, teamVersion: string): Promise<Team>;
}

export const officesApi: OfficesApi = {
  list: (q = {}) => http<PagedResult<Office>>(`${BASE}${toQuery(q)}`),
  get: (id) => http<Office>(`${BASE}/${id}`),
  create: (input) => http<Office>(BASE, json("POST", input)),
  update: (id, input, version) => http<Office>(`${BASE}/${id}`, json("PUT", { ...input, version })),

  access: (id, q = {}) => http<PagedResult<OfficeGrant>>(`${BASE}/${id}/access${toQuery(q)}`),
  setAccess: (id, userId, grant, version) => http<Office>(`${BASE}/${id}/access/${userId}`, json("PUT", { grant, version })),

  teams: (id, q = {}) => http<PagedResult<Team>>(`${BASE}/${id}/teams${toQuery(q)}`),
  createTeam: (id, input) => http<Team>(`${BASE}/${id}/teams`, json("POST", input)),
  updateTeam: (id, teamId, input, version) => http<Team>(`${BASE}/${id}/teams/${teamId}`, json("PUT", { ...input, version })),
  members: (id, teamId, q = {}) => http<PagedResult<TeamMember>>(`${BASE}/${id}/teams/${teamId}/members${toQuery(q)}`),
  setMember: (id, teamId, userId, active, isLead, version) =>
    http<Team>(`${BASE}/${id}/teams/${teamId}/members/${userId}`, json("PUT", { active, isLead, version })),
};
