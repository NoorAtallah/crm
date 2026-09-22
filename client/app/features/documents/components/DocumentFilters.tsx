"use client";

import { Search } from "lucide-react";
import type {
  CaseRef,
  DocumentsQuery,
  StatusFilter,
  VisibilityFilter,
} from "../types";
import type { DocumentsDict } from "../i18n";

const selectClass =
  "h-10 appearance-none rounded-lg border border-line bg-surface px-3 pe-8 text-[14px] text-text-primary outline-none transition-colors hover:border-brand-charcoal focus:border-brand-charcoal";

export function DocumentFilters({
  cases,
  query,
  onChange,
  t,
}: {
  cases: CaseRef[];
  query: DocumentsQuery;
  onChange: (next: DocumentsQuery) => void;
  t: DocumentsDict;
}) {
  const patch = (partial: Partial<DocumentsQuery>) =>
    onChange({ ...query, ...partial });

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <label className="relative flex min-w-0 flex-1 items-center sm:max-w-xs">
        <Search
          className="pointer-events-none absolute start-3 h-4 w-4 text-text-muted"
          strokeWidth={1.75}
        />
        <span className="sr-only">{t.search}</span>
        <input
          type="search"
          value={query.search}
          onChange={(event) => patch({ search: event.target.value })}
          placeholder={t.search}
          className="h-10 w-full rounded-lg border border-line bg-surface ps-9 pe-3 text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-charcoal"
        />
      </label>

      <label>
        <span className="sr-only">{t.columns.case}</span>
        <select
          value={query.caseId ?? ""}
          onChange={(event) => patch({ caseId: event.target.value || null })}
          className={selectClass}
        >
          <option value="">{t.allCases}</option>
          {cases.map((item) => (
            <option key={item.id} value={item.id}>
              {item.caseNumber} · {item.title}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="sr-only">{t.columns.status}</span>
        <select
          value={query.status}
          onChange={(event) =>
            patch({ status: event.target.value as StatusFilter })
          }
          className={selectClass}
        >
          <option value="all">{t.allStatuses}</option>
          <option value="Uploaded">{t.status.Uploaded}</option>
          <option value="Reviewed">{t.status.Reviewed}</option>
        </select>
      </label>

      <label>
        <span className="sr-only">{t.columns.visibility}</span>
        <select
          value={query.visibility}
          onChange={(event) =>
            patch({ visibility: event.target.value as VisibilityFilter })
          }
          className={selectClass}
        >
          <option value="all">{t.allVisibility}</option>
          <option value="client">{t.visibleToClient}</option>
          <option value="internal">{t.internalOnly}</option>
        </select>
      </label>
    </div>
  );
}
