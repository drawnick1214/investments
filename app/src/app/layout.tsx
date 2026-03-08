import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import BottomNav from "@/components/layout/BottomNav";
import LanguageToggle from "@/components/layout/LanguageToggle";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Investment Dashboard",
  description: "Personal investment portfolio tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Investments",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
        <I18nProvider>
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur-sm">
            <h1 className="text-lg font-semibold tracking-tight">
              <span className="text-emerald-400">$</span> Portfolio
            </h1>
            <LanguageToggle />
          </header>
          <main className="mx-auto max-w-lg pb-24 pt-2">
            {children}
          </main>
          <BottomNav />
          <Toaster position="top-center" richColors />
        </I18nProvider>
      </body>
    </html>
  );
}
