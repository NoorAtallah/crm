import { getDictionary, getLocale } from "@/app/lib/i18n";
import { LangToggle } from "../components/ui/LangToggle";
import { AuthBrandPanel, authDictionaries } from "../features/auth";

/** Routes stay thin: fetch locale, compose feature components. */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getDictionary(authDictionaries);

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AuthBrandPanel t={t} />

      <main className="relative flex flex-1 items-center justify-center bg-background px-5 py-12 sm:px-8">
        <div className="absolute top-5 end-5">
          <LangToggle locale={locale} />
        </div>
        {children}
      </main>
    </div>
  );
}