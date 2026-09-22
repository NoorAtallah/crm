import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { directionOf, getLocale } from "@/app/lib/i18n";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Legal CRM",
  description: "Legal practice management",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={directionOf[locale]}>
      <body className={`${plex.variable} font-sans`}>{children}</body>
    </html>
  );
}