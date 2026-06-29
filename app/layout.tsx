import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CommandPalette from "@/components/CommandPalette";
import Konami from "@/components/Konami";
import EasterEgg from "@/components/EasterEgg";
import JsonLd from "@/components/JsonLd";
import { site } from "@/lib/data";
import { siteGraph } from "@/lib/seo";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const jetmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetmono" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Alex Coulombe Presents · Unreal Engine Instructor & XR Developer",
    template: `%s · ${site.title}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  keywords: [
    "Alex Coulombe",
    "Unreal Engine training",
    "Unreal Authorized Instructor",
    "Apple Vision Pro developer",
    "Godot Vision Pro",
    "XR developer NYC",
    "MetaHuman",
    "immersive theatre",
    "Agile Lens",
  ],
  authors: [{ name: "Alex Coulombe", url: site.url }],
  creator: "Alex Coulombe",
  openGraph: {
    title: site.title,
    description: site.description,
    url: site.url,
    siteName: site.title,
    type: "website",
    images: [{ url: "/social.png", width: 1200, height: 630, alt: site.title }],
  },
  twitter: { card: "summary_large_image", creator: "@ibrews", images: ["/social.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${jetmono.variable}`}>
      <body className="min-h-screen antialiased">
        <JsonLd data={siteGraph} />
        <EasterEgg />
        <Nav />
        <CommandPalette />
        <Konami />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
