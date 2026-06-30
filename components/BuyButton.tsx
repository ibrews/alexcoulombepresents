"use client";

import { useState } from "react";
import { STORE_LIVE } from "@/lib/store";
import InquireButton from "@/components/InquireButton";

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

  // Pre-launch: show an inline form instead of a mailto link.
  if (!STORE_LIVE) {
    return (
      <InquireButton
        label={label}
        list="store"
        context={itemName}
        withMessage
        successMessage={`Alex will be in touch about ${itemName}.`}
      />
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
