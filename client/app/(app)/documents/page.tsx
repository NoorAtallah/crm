import type { Metadata } from "next";
import {
  DocumentsView,
  documentsApi,
  documentsDictionaries,
  emptyContents,
  type FolderContents,
} from "../../features/documents";
import { getDictionary, getLocale } from "../../lib/i18n";

export const metadata: Metadata = { title: "Documents · Legal CRM" };

export default async function DocumentsPage() {
  const [locale, t] = await Promise.all([getLocale(), getDictionary(documentsDictionaries)]);

  // Root of the signed-in user's file manager; folders load client-side from here.
  let contents: FolderContents = emptyContents;
  let failed = false;
  try {
    contents = await documentsApi.contents(null, 1);
  } catch {
    failed = true;
  }

  return <DocumentsView initial={contents} failed={failed} t={t} locale={locale} />;
}
