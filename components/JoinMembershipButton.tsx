"use client";

import { useState } from "react";

// Subscription checkout — no slug/sku, no live-flag branch to render an
// "inquire" fallback (this button only ever renders when MEMBERSHIP_LIVE is
// true; /api/checkout re-checks the flag server-side regardless).
export default function JoinMembershipButton({
  label = "Join the membership →",
}: {
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membership: true }),
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
        className="rounded-full bg-snow px-6 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] disabled:opacity-60"
      >
        {busy ? "Opening checkout…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
