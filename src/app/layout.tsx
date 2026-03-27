import type { Metadata } from "next";
import { DM_Sans, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { AppRouteShell } from "@/components/layout/app-route-shell";
import { APP_METADATA } from "@/constants";
import "./globals.css";
import "@/styles/offlode-login.css";
import "@/styles/reference-style.css";

const dmSans = DM_Sans({
  variable: "--font-synapse-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-offlode-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-synapse-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: APP_METADATA.title,
  description: APP_METADATA.description,
  applicationName: "Offlode",
  icons: {
    icon: "/offlode-logo.svg",
    shortcut: "/offlode-logo.svg",
    apple: "/offlode-logo.svg",
  },
  openGraph: {
    title: "Offlode",
    description: APP_METADATA.description,
    siteName: "Offlode",
  },
  twitter: {
    card: "summary",
    title: "Offlode",
    description: APP_METADATA.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>
          <AppRouteShell>{children}</AppRouteShell>
        </AppProviders>
      </body>
    </html>
  );
}
