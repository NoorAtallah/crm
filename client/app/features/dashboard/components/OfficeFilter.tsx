"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Building2 } from "lucide-react";
import type { OfficePerformance } from "../types";
import type { DashboardDict } from "../i18n";

/**
 * Filter state lives in the URL, not React state — a manager reviewing Irbid
 * can send that link to someone else and they'll see the same thing.
 */
export function OfficeFilter({
  offices,
  selected,
  t,
}: {
  offices: Pick<OfficePerformance, "id" | "name">[];
  selected: string | null;
  t: DashboardDict;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function select(officeId: string) {
    const params = new URLSearchParams(searchParams);
    if (officeId) params.set("office", officeId);
    else params.delete("office");

    startTransition(() => {
      router.replace(`${pathname}?${params}`, { scroll: false });
    });
  }

  return (
    <label className="relative inline-flex items-center">
      <Building2
        className="pointer-events-none absolute start-3 h-4 w-4 text-text-muted"
        strokeWidth={1.75}
      />
      <span className="sr-only">{t.officeFilter}</span>
      <select
        value={selected ?? ""}
        disabled={pending}
        onChange={(event) => select(event.target.value)}
        className="h-10 appearance-none rounded-lg border border-line bg-surface ps-9 pe-8 text-[14px] text-text-primary outline-none transition-colors hover:border-brand-charcoal focus:border-brand-charcoal disabled:opacity-60"
      >
        <option value="">{t.allOffices}</option>
        {offices.map((office) => (
          <option key={office.id} value={office.id}>
            {office.name}
          </option>
        ))}
      </select>
    </label>
  );
}