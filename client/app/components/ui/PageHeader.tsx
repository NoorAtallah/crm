import type { ReactNode } from "react";

/** Title row at the top of every screen. */
export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Slot above the title, e.g. a back link. */
  back?: ReactNode;
}) {
  return (
    <header className="space-y-2">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold text-text-primary">{title}</h1>
          {subtitle && <div className="mt-1 text-[13.5px] text-text-muted">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
