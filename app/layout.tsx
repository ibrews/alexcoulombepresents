import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CommandPalette from "@/components/CommandPalette";
import Konami from "@/components/Konami";
import { site } from "@/lib/data";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const jetmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetmono" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.title}` },
  description: site.description,
  openGraph: {
    title: site.title,
    description: site.description,
    url: site.url,
    siteName: site.title,
    type: "website",
  },
  twitter: { card: "summary_large_image", creator: "@ibrews" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${jetmono.variable}`}>
      <body className="min-h-screen antialiased">
        <Nav />
        <CommandPalette />
        <Konami />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
