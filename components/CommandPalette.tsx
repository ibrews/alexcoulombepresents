"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { repos, products } from "@/lib/data";

type Cmd = { label: string; hint: string; action: () => void };

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      if (href.startsWith("http")) window.open(href, "_blank", "noopener");
      else router.push(href);
    },
    [router]
  );

  const commands = useMemo<Cmd[]>(
    () => [
      { label: "Home", hint: "page", action: () => go("/") },
      { label: "About Alex", hint: "page", action: () => go("/about") },
      { label: "Training", hint: "page", action: () => go("/training") },
      { label: "Open Source", hint: "page", action: () => go("/repos") },
      { label: "AI Skills", hint: "page", action: () => go("/skills") },
      { label: "Videos", hint: "page", action: () => go("/videos") },
      { label: "The Lab", hint: "page", action: () => go("/lab") },
      { label: "Store", hint: "page", action: () => go("/store") },
      { label: "Members (coming soon)", hint: "page", action: () => go("/members") },
      { label: "Newsletter", hint: "page", action: () => go("/newsletter") },
      { label: "Contact", hint: "page", action: () => go("/contact") },
      { label: "Support the Lab", hint: "page", action: () => go("/support") },
      { label: "My Account", hint: "page", action: () => go("/account") },
      { label: "Team / studio training", hint: "page", action: () => go("/training#teams") },
      { label: "Links", hint: "page", action: () => go("/links") },
      { label: "YouTube — @ibrews", hint: "external", action: () => go("https://youtube.com/@ibrews") },
      ...products.map((p) => ({ label: p.name, hint: "lab", action: () => go(`/lab/${p.slug}`) })),
      ...repos.map((r) => ({ label: r.name, hint: "repo", action: () => go(`/repos/${r.slug}`) })),
      { label: "Agile Lens", hint: "external", action: () => go("https://agilelens.com") },
      { label: "Agile Lens — portfolio", hint: "external", action: () => go("https://agilelens.com/portfolio") },
      { label: "GitHub @ibrews", hint: "external", action: () => go("https://github.com/ibrews") },
      { label: "Email Alex", hint: "external", action: () => go("mailto:info@alexcoulombepresents.com") },
      // hidden easter egg — only surfaces when you search "rage" / "smash" / "secret"
      { label: "🧨 Rage Room VR — an old chestnut", hint: "secret", action: () => go("https://tinyurl.com/rageroomvr") },
    ],
    [go]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!query) return commands.filter((c) => c.hint !== "secret");
    const eggWords = ["rage", "smash", "secret", "egg", "room"];
    return commands.filter((c) => {
      if (c.hint === "secret") return eggWords.some((w) => q.includes(w));
      return c.label.toLowerCase().includes(q) || c.hint.includes(q);
    });
  }, [commands, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActive(0);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
      setQuery("");
      setActive(0);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/70 px-4 pt-[18vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && filtered[active]) {
              filtered[active].action();
            }
          }}
          placeholder="Jump to anything…"
          className="w-full border-b border-line bg-transparent px-5 py-4 font-mono text-sm outline-none placeholder:text-mist"
        />
        <ul className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 && <li className="px-5 py-3 text-sm text-mist">Nothing matches. Yet.</li>}
          {filtered.map((c, i) => (
            <li key={c.label + c.hint}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={c.action}
                className={`flex w-full items-center justify-between px-5 py-2.5 text-left text-sm ${
                  i === active ? "bg-line text-snow" : "text-mist"
                }`}
              >
                <span>{c.label}</span>
                <span className="font-mono text-xs opacity-60">{c.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
