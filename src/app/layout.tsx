import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { appMeta } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: appMeta.name,
    template: `%s | ${appMeta.name}`,
  },
  description:
    "Plataforma de saúde e bem-estar da dr.monitora com agenda, gamificação e experiência mobile-first.",
  applicationName: appMeta.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: appMeta.name,
  },
  icons: {
    icon: appMeta.logoPath,
    apple: appMeta.logoPath,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
