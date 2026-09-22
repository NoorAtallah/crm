/**
 * Locale infrastructure. Knows about languages and cookies — never about
 * auth, cases or consultations. Each feature ships its own dictionary and
 * calls `getLocale()` to pick from it.
 */

export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

export const LOCALE_COOKIE = "locale";
export const DEFAULT_LOCALE: Locale = "ar";

export const directionOf: Record<Locale, Direction> = {
  ar: "rtl",
  en: "ltr",
};

/** The label shown on the toggle: always the language you'd switch *to*. */
export const switchLabel: Record<Locale, string> = {
  ar: "English",
  en: "العربية",
};

/**
 * Fills `{name}` placeholders in a dictionary string.
 *
 *   interpolate(t.attemptsLeft, { count: 3 })
 *
 * Dictionaries are passed from server components to client components, so
 * they must hold plain serializable values — this is why strings carry
 * placeholders instead of being functions.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}

export function normalizeLocale(value?: string | null): Locale {
  return value === "en" ? "en" : DEFAULT_LOCALE;
}

/** Client-side write. Server reads it in the root layout, so no flash. */
export function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${
    60 * 60 * 24 * 365
  }; samesite=lax`;
}

/**
 * Picks a feature's dictionary for the current request.
 * Server components only.
 *
 *   const t = await getDictionary(authDictionaries);
 */
export async function getLocale(): Promise<Locale> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getDictionary<T>(
  dictionaries: Record<Locale, T>
): Promise<T> {
  return dictionaries[await getLocale()];
}