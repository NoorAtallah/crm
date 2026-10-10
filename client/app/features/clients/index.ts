/**
 * Public surface of the clients feature. Routes import from here —
 * never from a file inside `features/clients/`.
 */
export { ClientsView } from "./components/ClientsView";
export { clientsApi } from "./api";
export { clientsDictionaries, type ClientsDict } from "./i18n";
export { clientAbilitiesFor, type Client, type ClientCase } from "./types";
