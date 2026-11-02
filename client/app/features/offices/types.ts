/**
 * Offices, teams and office access. Staff only.
 *   GET|POST /api/offices                         · GET|PUT /api/offices/{id}  ({code,name,isActive,version})
 *   GET      /api/offices/{id}/access             · PUT .../access/{userId}    ({grant|null, version: OFFICE version})
 *   GET|POST /api/offices/{id}/teams              · GET|PUT .../teams/{teamId} ({key,name,isActive,version})
 *   GET      .../teams/{teamId}/members           · PUT .../members/{userId}   ({active,isLead, version: TEAM version})
 * Records are deactivated, never deleted.
 */
export type AccessGrant = "Read" | "Contribute" | "Manage" | "Approve";
export const ACCESS_GRANTS: AccessGrant[] = ["Read", "Contribute", "Manage", "Approve"];

export interface Office {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  version: string;
}

export interface OfficeGrant {
  userId: string;
  officeId: string;
  grant: AccessGrant;
  grantedAtUtc: string;
}

export interface Team {
  id: string;
  officeId: string;
  key: string;
  name: string;
  isActive: boolean;
  version: string;
}

export interface TeamMember {
  userId: string;
  name: string | null;
  isLead: boolean;
  joinedAtUtc: string;
  leftAtUtc: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PersonRef {
  id: string;
  fullName: string;
  isClient: boolean;
}
