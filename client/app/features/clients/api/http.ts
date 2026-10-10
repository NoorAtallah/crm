import { http } from "../../../lib/http";
import type { ClientsApi } from "./contract";
import type { Client, ClientCase, ClientCasePortal } from "../types";

const CLIENTS = "/api/clients";

export const httpClientsApi: ClientsApi = {
  list: () => http<Client[]>(CLIENTS),

  get: (clientId) => http<Client>(`${CLIENTS}/${clientId}`),

  create: (input) =>
    http<Client>(CLIENTS, { method: "POST", body: JSON.stringify(input) }),

  cases: (clientId) => http<ClientCase[]>(`${CLIENTS}/${clientId}/cases`),

  myCases: () => http<ClientCase[]>(`${CLIENTS}/me/cases`),

  myCasePortal: (caseId) =>
    http<ClientCasePortal>(`${CLIENTS}/me/cases/${caseId}/portal`),
};
