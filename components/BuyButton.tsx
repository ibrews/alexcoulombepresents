"use client";

import { useState } from "react";
import { STORE_LIVE } from "@/lib/store";

export default function BuyButton({
  slug,
  label,
  itemName,
}: {
  slug: string;
  label: string;
  itemName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-launch: an honest mailto, exactly like the forage-site pattern.
  if (!STORE_LIVE) {
    return (
      <a
        href={`mailto:info@alexcoulombepresents.com?subject=${encodeURIComponent(`Purchase: ${itemName}`)}&body=${encodeURIComponent(
          `Hi Alex — I'd like to buy "${itemName}". What's the fastest way to pay?`
        )}`}
        className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
      >
        {label}
      </a>
    );
  }

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={checkout}
        disabled={busy}
        className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] disabled:opacity-60"
      >
        {busy ? "Opening checkout…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
