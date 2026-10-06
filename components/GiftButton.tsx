"use client";

import { useId, useState } from "react";

// "Give as a gift" — a secondary control under a Buy/Join button that opens a
// small inline form, then goes through the same /api/checkout as a normal
// purchase with a `gift` attached (lib/commerce/gifts.ts). Pass `slug` for a
// store item, or `membershipTier` + `priceCents` for a fixed-term membership.
// Limits mirror the server's (GIFT_MESSAGE_MAX / GIFT_NAME_MAX); the server
// re-validates everything regardless.

const MESSAGE_MAX = 400;
const NAME_MAX = 100;
const TERMS = [1, 3] as const;

const field =
  "w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-snow placeholder:text-mist/50 focus:border-teal/60 focus:outline-none transition-colors";

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 === 0 ? 0 : 2 })}`;
}

export default function GiftButton({
  slug,
  membershipTier,
  priceCents,
  itemName,
  label = "Give as a gift",
  defaultOpen = false,
}: {
  slug?: string;
  membershipTier?: string;
  /** Monthly price for a membership tier — the form shows price × term. */
  priceCents?: number;
  itemName: string;
  label?: string;
  defaultOpen?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [months, setMonths] = useState<(typeof TERMS)[number]>(1);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [fromName, setFromName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-mist transition-colors hover:border-grape/60 hover:text-snow"
      >
        <span aria-hidden="true">🎁</span> {label}
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const gift = { recipientEmail, recipientName, fromName, message };
    const payload = membershipTier
      ? { giftMembership: true, tier: membershipTier, months, gift }
      : { slug, gift };
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass flex flex-col gap-3 rounded-2xl p-4 text-left sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-grape">Gift: {itemName}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-mono text-xs text-mist hover:text-snow"
          aria-label="Close the gift form"
        >
          ✕
        </button>
      </div>

      {membershipTier && priceCents !== undefined && (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Gift length</legend>
          {TERMS.map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                months === m ? "border-grape bg-grape/10 text-snow" : "border-line text-mist hover:border-grape/60"
              }`}
            >
              <input
                type="radio"
                name={`${id}-months`}
                value={m}
                checked={months === m}
                onChange={() => setMonths(m)}
                className="sr-only"
              />
              {m} month{m === 1 ? "" : "s"} · {dollars(priceCents * m)}
            </label>
          ))}
        </fieldset>
      )}

      <label className="sr-only" htmlFor={`${id}-to-email`}>
        Recipient&apos;s email
      </label>
      <input
        id={`${id}-to-email`}
        className={field}
        type="email"
        required
        autoComplete="off"
        placeholder="Their email"
        value={recipientEmail}
        onChange={(e) => setRecipientEmail(e.target.value)}
      />
      {/* Single column on purpose: this form often sits inside a narrow card. */}
      <div className="grid gap-3">
        <label className="sr-only" htmlFor={`${id}-to-name`}>
          Recipient&apos;s name
        </label>
        <input
          id={`${id}-to-name`}
          className={field}
          type="text"
          maxLength={NAME_MAX}
          autoComplete="off"
          placeholder="Their name"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />
        <label className="sr-only" htmlFor={`${id}-from-name`}>
          Your name
        </label>
        <input
          id={`${id}-from-name`}
          className={field}
          type="text"
          required
          maxLength={NAME_MAX}
          autoComplete="name"
          placeholder="Your name"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
        />
      </div>
      <label className="sr-only" htmlFor={`${id}-message`}>
        Personal message (optional)
      </label>
      <textarea
        id={`${id}-message`}
        className={`${field} min-h-[88px] resize-y`}
        maxLength={MESSAGE_MAX}
        placeholder="A note for them (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-mist">
          {message.length}/{MESSAGE_MAX}
        </span>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-grape px-5 py-2.5 text-sm font-semibold text-[#0a0a12] transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          {busy ? "Opening checkout…" : "Continue to payment →"}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-mist">
        You pay; they get the email with everything they need
        {membershipTier ? ". It's a one-time payment, and nothing renews." : "."}
      </p>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </form>
  );
}
