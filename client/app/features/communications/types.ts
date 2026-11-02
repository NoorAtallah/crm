/**
 * Correspondence & call log. Entries are immutable — corrections are new entries.
 * This only records communication; it never sends anything.
 *   GET  /api/communications/search?clientId&caseId&consultationId&channel → PagedResult<Communication>
 *   GET  /api/communications/{id}
 *   POST /api/communications ← CreateCommunicationInput
 */
export const CHANNELS = ["Email", "Phone", "Sms", "WhatsApp", "Meeting", "Other"] as const;
export type Channel = (typeof CHANNELS)[number];
export type Direction = "Inbound" | "Outbound";

export interface Communication {
  id: string;
  clientId: string;
  caseId: string | null;
  consultationId: string | null;
  channel: Channel;
  direction: Direction;
  participant: string | null;
  subject: string | null;
  body: string | null;
  internalNotes: string | null;
  visibleToClient: boolean;
  occurredAtUtc: string;
  actorId: string | null;
}

export interface CreateCommunicationInput {
  clientId: string;
  caseId: string | null;
  consultationId: string | null;
  channel: Channel;
  direction: Direction;
  participant: string | null;
  subject: string;
  body: string | null;
  internalNotes: string | null;
  visibleToClient: boolean;
  occurredAtUtc: string;
}

export interface CommunicationQuery {
  clientId?: string;
  caseId?: string;
  consultationId?: string;
  channel?: Channel;
  search?: string;
  page?: number;
  pageSize?: number;
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
