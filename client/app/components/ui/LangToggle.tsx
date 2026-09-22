"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { persistLocale, switchLabel, type Locale } from "../../lib/i18n";

export function LangToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        persistLocale(locale === "ar" ? "en" : "ar");
        startTransition(() => router.refresh());
      }}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium text-text-primary transition-colors hover:border-brand-champagne disabled:opacity-60"
    >
      <Languages className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
      {switchLabel[locale]}
    </button>
  );
}