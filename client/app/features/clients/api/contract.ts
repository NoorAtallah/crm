import type { Client, ClientCase, ClientCasePortal, CreateClientInput } from "../types";

export interface ClientsApi {
  list(): Promise<Client[]>;
  get(clientId: string): Promise<Client>;
  create(input: CreateClientInput): Promise<Client>;
  cases(clientId: string): Promise<ClientCase[]>;
  /** Signed-in client: their own cases. */
  myCases(): Promise<ClientCase[]>;
  /** Signed-in client: client-visible documents + approved reports for one case. */
  myCasePortal(caseId: string): Promise<ClientCasePortal>;
}
