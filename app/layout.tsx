import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChopCheck",
  description: "Analyse de documents commerciaux chinois",
};

// Layout commun à toutes les pages de l'application.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
