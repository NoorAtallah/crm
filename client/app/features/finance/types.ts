/**
 * Finance (staff need finance.read / finance.manage). Under /api/finance:
 *   agreements          GET (paged) · POST            — immutable fee agreements
 *   invoices            GET (paged) · POST            — Draft → Issued → (Void)
 *   invoices/{id}       GET · /issue {version} · /void {reason, version}
 *   invoices/{id}/payments          GET · POST {amount, reference, method, idempotencyKey, paidOn, version}
 *   invoices/{id}/payments/{p}/reverse  {reason, version}
 *   expenses            GET (paged) · POST · {id}/void {reason, version}
 * Amounts: up to 3 decimals, one currency per record, no conversion.
 */

export type InvoiceStatus = "Draft" | "Issued" | "Void";

export interface FeeAgreement {
  id: string;
  clientId: string;
  caseId: string | null;
  consultationId: string | null;
  terms: string | null;
  amount: number;
  currency: string;
}

export interface FeeAgreementInput {
  clientId: string;
  caseId: string | null;
  consultationId: string | null;
  terms: string;
  amount: number;
  currency: string;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  caseId: string | null;
  consultationId: string | null;
  feeAgreementId: string | null;
  number: string;
  currency: string;
  issueOn: string;
  dueOn: string;
  net: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  status: InvoiceStatus;
  isOverdue: boolean;
  voidReason: string | null;
  lines: InvoiceLine[] | null;
  version: string;
}

export interface CreateInvoiceInput {
  clientId: string;
  caseId: string | null;
  consultationId: string | null;
  feeAgreementId: string | null;
  number: string;
  currency: string;
  /** Date only: YYYY-MM-DD. */
  issueOn: string;
  dueOn: string;
  tax: number;
  lines: InvoiceLine[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  reference: string | null;
  method: string | null;
  paidOn: string;
  reversedAtUtc: string | null;
  reversalReason: string | null;
}

export interface PaymentInput {
  amount: number;
  reference: string;
  method: string;
  /** Same key + same payload = same payment (safe to retry). */
  idempotencyKey: string;
  paidOn: string;
}

export interface Expense {
  id: string;
  clientId: string;
  caseId: string | null;
  consultationId: string | null;
  description: string | null;
  amount: number;
  currency: string;
  incurredOn: string;
  reimbursable: boolean;
  voidReason: string | null;
  version: string;
}

export interface ExpenseInput {
  clientId: string;
  caseId: string | null;
  consultationId: string | null;
  description: string;
  amount: number;
  currency: string;
  incurredOn: string;
  reimbursable: boolean;
}

export interface FinanceQuery {
  clientId?: string;
  caseId?: string;
  currency?: string;
  status?: string;
  overdue?: boolean;
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

export interface ClientRef {
  id: string;
  fullName: string;
}

export interface CaseRef {
  id: string;
  caseNumber: string;
  title: string;
  clientId: string;
}

/** Mirrors the API: round(quantity × unitPrice, 3, AwayFromZero). */
export function lineTotal(quantity: number, unitPrice: number): number {
  const raw = quantity * unitPrice;
  const sign = raw < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(raw) * 1000 + Number.EPSILON)) / 1000;
}
