import { http, httpBlob } from "../../../lib/http";
import { toQuery } from "../../../lib/query";
import type {
  CreateInvoiceInput,
  Expense,
  ExpenseInput,
  FeeAgreement,
  FeeAgreementInput,
  FinanceQuery,
  Invoice,
  PagedResult,
  Payment,
  PaymentInput,
} from "../types";

const BASE = "/api/finance";
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export interface FinanceApi {
  agreements(query: FinanceQuery): Promise<PagedResult<FeeAgreement>>;
  createAgreement(input: FeeAgreementInput): Promise<FeeAgreement>;

  invoices(query: FinanceQuery): Promise<PagedResult<Invoice>>;
  invoice(id: string): Promise<Invoice>;
  createInvoice(input: CreateInvoiceInput): Promise<Invoice>;
  issueInvoice(id: string, version: string): Promise<Invoice>;
  voidInvoice(id: string, reason: string, version: string): Promise<Invoice>;
  invoicePdf(id: string): Promise<Blob>;

  payments(invoiceId: string, page?: number): Promise<PagedResult<Payment>>;
  recordPayment(invoiceId: string, input: PaymentInput, version: string): Promise<{ payment: Payment; invoice: Invoice }>;
  reversePayment(invoiceId: string, paymentId: string, reason: string, version: string): Promise<{ payment: Payment; invoice: Invoice }>;

  expenses(query: FinanceQuery): Promise<PagedResult<Expense>>;
  createExpense(input: ExpenseInput): Promise<Expense>;
  voidExpense(id: string, reason: string, version: string): Promise<Expense>;

  /** Excel export of a list: "invoices" | "fee-agreements" | "expenses". */
  exportList(kind: "invoices" | "fee-agreements" | "expenses", query: FinanceQuery): Promise<Blob>;
}

export const financeApi: FinanceApi = {
  agreements: (q) => http<PagedResult<FeeAgreement>>(`${BASE}/agreements${toQuery(q)}`),
  createAgreement: (input) => http<FeeAgreement>(`${BASE}/agreements`, json("POST", input)),

  invoices: (q) => http<PagedResult<Invoice>>(`${BASE}/invoices${toQuery(q)}`),
  invoice: (id) => http<Invoice>(`${BASE}/invoices/${id}`),
  createInvoice: (input) => http<Invoice>(`${BASE}/invoices`, json("POST", input)),
  issueInvoice: (id, version) => http<Invoice>(`${BASE}/invoices/${id}/issue`, json("POST", { version })),
  voidInvoice: (id, reason, version) => http<Invoice>(`${BASE}/invoices/${id}/void`, json("POST", { reason, version })),
  invoicePdf: (id) => httpBlob(`/api/exports/invoices/${id}/document?format=Pdf`),

  payments: (id, page = 1) => http<PagedResult<Payment>>(`${BASE}/invoices/${id}/payments${toQuery({ page, pageSize: 100 })}`),
  recordPayment: (id, input, version) =>
    http<{ payment: Payment; invoice: Invoice }>(`${BASE}/invoices/${id}/payments`, json("POST", { ...input, version })),
  reversePayment: (id, paymentId, reason, version) =>
    http<{ payment: Payment; invoice: Invoice }>(`${BASE}/invoices/${id}/payments/${paymentId}/reverse`, json("POST", { reason, version })),

  expenses: (q) => http<PagedResult<Expense>>(`${BASE}/expenses${toQuery(q)}`),
  createExpense: (input) => http<Expense>(`${BASE}/expenses`, json("POST", input)),
  voidExpense: (id, reason, version) => http<Expense>(`${BASE}/expenses/${id}/void`, json("POST", { reason, version })),

  exportList: (kind, q) => httpBlob(`/api/exports/${kind}${toQuery({ ...q, page: undefined, pageSize: undefined, format: "Xlsx" })}`),
};
