"use client";

import { useState } from "react";

const PRESETS = [10, 25, 50, 100];

export default function DonateBox() {
  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effective = custom ? Math.floor(Number(custom)) : amount;
  const valid = Number.isFinite(effective) && effective >= 1 && effective <= 10000;

  async function donate() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationCents: effective * 100 }),
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
    <div className="glass rounded-2xl p-7">
      <div className="flex flex-wrap gap-3">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setAmount(p);
              setCustom("");
            }}
            className={`rounded-full border px-5 py-2 font-mono text-sm transition ${
              !custom && amount === p
                ? "border-teal bg-teal/15 text-snow"
                : "border-line text-mist hover:border-teal/50"
            }`}
          >
            ${p}
          </button>
        ))}
        <div className="flex items-center gap-1 rounded-full border border-line px-4 py-2 font-mono text-sm text-mist focus-within:border-teal/50">
          $
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="custom"
            inputMode="numeric"
            className="w-20 bg-transparent text-snow outline-none placeholder:text-mist/60"
          />
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-mist">
        You&apos;ll get a spot at checkout to leave a comment or request — a tool you wish existed,
        a topic you want covered, or just a hello. Alex reads every one.
      </p>
      <button
        onClick={donate}
        disabled={busy || !valid}
        className="mt-5 rounded-full bg-teal px-7 py-2.5 font-semibold text-[#0a0a12] transition hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Opening checkout…" : `Support the Lab — $${valid ? effective : "…"}`}
      </button>
      {error && <p className="mt-3 text-sm text-amber">{error}</p>}
    </div>
  );
}
