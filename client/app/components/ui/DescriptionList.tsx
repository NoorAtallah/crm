import type { ReactNode } from "react";

/** Label/value pairs in a responsive grid. Empty values show an em dash. */
export function DescriptionList({
  items,
  columns = 2,
}: {
  items: { label: string; value: ReactNode; full?: boolean }[];
  columns?: 1 | 2 | 3;
}) {
  const grid = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }[columns];
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${grid}`}>
      {items.map((item) => (
        <div key={item.label} className={item.full ? "sm:col-span-full" : ""}>
          <dt className="text-[12px] font-medium text-text-muted">{item.label}</dt>
          <dd className="mt-1 whitespace-pre-wrap text-[13.5px] text-text-primary">
            {item.value === null || item.value === undefined || item.value === "" ? "—" : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
