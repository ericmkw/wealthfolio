import type { Metadata } from "next";
import "@/app/globals.css";
import { getCurrentUser } from "@/lib/auth/server";
import { getResolvedPreferences } from "@/lib/preferences";

export const metadata: Metadata = {
  title: "Wealthfolio Investor Portal",
  description: "Read-only investor reporting portal for Wealthfolio-managed funds.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const preferences = await getResolvedPreferences(user?.id);

  return (
    <html lang={preferences.locale} data-theme={preferences.theme}>
      <body>{children}</body>
    </html>
  );
}
