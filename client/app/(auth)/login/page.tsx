import { Suspense } from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/app/lib/i18n";
import { LoginForm, authDictionaries } from "@/app/features/auth";

export const metadata: Metadata = { title: "Sign in · Legal CRM" };

export default async function LoginPage() {
  const t = await getDictionary(authDictionaries);

  // useSearchParams (for the `?next=` redirect) needs a Suspense boundary.
  return (
    <Suspense fallback={<div className="h-[420px] w-full max-w-[420px]" />}>
      <LoginForm t={t} />
    </Suspense>
  );
}