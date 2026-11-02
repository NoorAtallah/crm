"use client";

import { useMemo, useState } from "react";
import { FileText, Handshake, Receipt } from "lucide-react";
import { Alert, Tabs } from "../../../components/ui";
import type { Locale } from "../../../lib/i18n";
import type { FinanceDict } from "../i18n";
import type { CaseRef, ClientRef } from "../types";
import { AgreementsPanel } from "./AgreementsPanel";
import { ExpensesPanel } from "./ExpensesPanel";
import { InvoicesPanel } from "./InvoicesPanel";
import type { FinanceScope } from "./shared";

type Tab = "invoices" | "agreements" | "expenses";

/**
 * Invoices, fee agreements and expenses. On /billing the scope is open;
 * on a case page `scope` fixes the client and case.
 */
export function FinanceBoard({
  scope = {},
  clients,
  cases,
  canRead,
  canManage,
  t,
  locale,
}: {
  scope?: FinanceScope;
  clients: ClientRef[];
  cases: CaseRef[];
  /** `finance.read`. */
  canRead: boolean;
  /** `finance.manage`. */
  canManage: boolean;
  t: FinanceDict;
  locale: Locale;
}) {
  const [tab, setTab] = useState<Tab>("invoices");
  const names = useMemo(() => new Map(clients.map((c) => [c.id, c.fullName])), [clients]);

  if (!canRead) return <Alert tone="info">{t.noAccess}</Alert>;

  const props = { scope, clients, cases, canManage, names, t, locale };
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="px-2">
        <Tabs<Tab>
          id={`finance-${scope.caseId ?? "all"}`}
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "invoices", label: t.tabs.invoices, icon: FileText },
            { key: "agreements", label: t.tabs.agreements, icon: Handshake },
            { key: "expenses", label: t.tabs.expenses, icon: Receipt },
          ]}
        />
      </div>
      {tab === "invoices" && <InvoicesPanel {...props} />}
      {tab === "agreements" && <AgreementsPanel {...props} />}
      {tab === "expenses" && <ExpensesPanel {...props} />}
    </div>
  );
}
