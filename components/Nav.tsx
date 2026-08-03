"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/about", label: "About" },
  { href: "/training", label: "Training" },
  { href: "/repos", label: "Open Source" },
  { href: "/skills", label: "Skills" },
  { href: "/videos", label: "Videos" },
  { href: "/appearances", label: "Appearances" },
  { href: "/lab", label: "The Lab" },
  { href: "/store", label: "Store" },
  { href: "/links", label: "Links" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      style={{ top: "var(--banner-h, 0px)" }}
      className={`fixed inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? "border-b border-line bg-ink/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 font-bold tracking-tight">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0 transition-transform duration-300 group-hover:rotate-45">
            <path d="M16 2 L19 13 L30 16 L19 19 L16 30 L13 19 L2 16 L13 13 Z" fill="#2dd4bf" />
          </svg>
          <span className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="text-lg">Alex Coulombe</span>
            <span className="grad-text text-lg transition-transform group-hover:translate-x-0.5">Presents</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  active ? "bg-line text-snow" : "text-mist hover:text-snow"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-palette"))}
            className="ml-3 hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-mist transition-colors hover:border-teal/50 hover:text-snow lg:flex"
            aria-label="Open command palette"
          >
            <span>⌘K</span>
          </button>
        </nav>

        <button
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`h-0.5 w-5 bg-snow transition-transform ${open ? "translate-y-1 rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-snow transition-transform ${open ? "-translate-y-1 -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="border-b border-line bg-ink/95 px-5 pb-4 backdrop-blur-xl md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block py-2.5 text-mist hover:text-snow">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
