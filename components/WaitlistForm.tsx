"use client";

import { useState } from "react";

/**
 * One form for every list on the site. Posts to /api/subscribe with a `list`
 * slug (see lib/lists.ts). Optionally collects a name and/or a short message.
 */
export default function WaitlistForm({
  list,
  context,
  cta = "Notify me →",
  withName = false,
  withMessage = false,
  successTitle = "You're on the list.",
  successMessage = "We'll be in touch the moment there's news.",
  compact = false,
}: {
  list: string;
  /** Optional tag recorded with the signup, e.g. which store item it was about. */
  context?: string;
  cta?: string;
  withName?: boolean;
  withMessage?: boolean;
  successTitle?: string;
  successMessage?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [human, setHuman] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fullMessage = [context && `Re: ${context}`, message].filter(Boolean).join("\n");
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, message: fullMessage, list, honeypot, human }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong. Try emailing directly.");
      else setSent(true);
    } catch {
      setError("Couldn't reach the server. Try emailing directly.");
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-snow placeholder:text-mist/50 focus:border-teal/60 focus:outline-none transition-colors";

  if (sent) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-3xl">✦</p>
        <p className="mt-3 font-bold">{successTitle}</p>
        <p className="mt-1.5 text-sm text-mist">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
      {/* Honeypot — invisible to humans, bots fill it in */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", opacity: 0, height: 0, pointerEvents: "none" }}
      />

      <div className={withName ? "grid gap-3 sm:grid-cols-2" : ""}>
        {withName && (
          <input
            className={field}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Your name"
          />
        )}
        <input
          className={field}
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Your email"
        />
      </div>

      {withMessage && (
        <textarea
          className={`${field} min-h-[96px] resize-y`}
          placeholder="Anything you want us to know? (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-label="Message"
        />
      )}

      <div
        className={`flex ${
          compact ? "flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" : "flex-wrap items-center gap-x-5 gap-y-3"
        }`}
      >
        <label className="flex cursor-pointer items-center gap-2.5 select-none">
          <input
            type="checkbox"
            checked={human}
            onChange={(e) => setHuman(e.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          <span className="text-sm text-mist">I&apos;m not a robot</span>
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-snow px-6 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending…" : cta}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400">
          {error}{" "}
          <a className="underline" href="mailto:info@alexcoulombepresents.com">
            Email directly →
          </a>
        </p>
      )}
    </form>
  );
}
