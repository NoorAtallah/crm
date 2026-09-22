import { Scale } from "lucide-react";
import type { AuthDict } from "../i18n/index";

/** Server component. The charcoal half of the auth screens. */
export function AuthBrandPanel({ t }: { t: AuthDict }) {
  return (
    <aside className="flex shrink-0 flex-col justify-between bg-brand-charcoal px-6 py-5 text-white lg:w-[44%] lg:max-w-[620px] lg:px-14 lg:py-12">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-champagne">
          <Scale className="h-5 w-5 text-brand-charcoal" strokeWidth={2} />
        </span>
        <span className="text-[15px] font-medium tracking-tight">
          {t.brandName}
        </span>
      </div>

      <div className="hidden lg:block">
        <div className="mb-7 h-px w-16 bg-brand-champagne" />
        <h1 className="max-w-[16ch] text-[34px] font-semibold leading-[1.25] tracking-tight">
          {t.panelHeadline}
        </h1>
        <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-white/60">
          {t.panelBody}
        </p>
      </div>

      <p className="hidden text-[12px] text-white/40 lg:block">
        {t.panelFooter} · {new Date().getFullYear()}
      </p>
    </aside>
  );
}