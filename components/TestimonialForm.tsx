"use client";

import { useState } from "react";

export default function TestimonialForm({ classContext }: { classContext?: string }) {
  const [quote, setQuote] = useState("");
  const [name, setName] = useState("");
  const [roleOrg, setRoleOrg] = useState("");
  const [email, setEmail] = useState("");
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
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote,
          name: name || undefined,
          roleOrg: roleOrg || undefined,
          email: email || undefined,
          classContext: classContext || undefined,
          honeypot,
          human,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try emailing directly.");
      } else {
        setSent(true);
      }
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
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-2xl">✦</p>
        <p className="mt-3 font-bold">Thank you — genuinely.</p>
        <p className="mt-2 text-sm text-mist">
          It means a lot that you took the time. Alex reads every one of these himself.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Honeypot — invisible to real users, bots fill it in */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", opacity: 0, height: 0, pointerEvents: "none" }}
      />

      <textarea
        className={`${field} min-h-[120px] resize-y`}
        placeholder="What was your honest experience? One sentence is plenty."
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        maxLength={2000}
        required
        aria-label="Your testimonial"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={field}
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={field}
          type="text"
          placeholder="Role / company (optional)"
          value={roleOrg}
          onChange={(e) => setRoleOrg(e.target.value)}
        />
      </div>

      <input
        className={field}
        type="email"
        placeholder="Email (optional — only if you'd like a reply)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="flex cursor-pointer items-center gap-3 select-none">
        <input
          type="checkbox"
          checked={human}
          onChange={(e) => setHuman(e.target.checked)}
          className="h-4 w-4 accent-teal"
        />
        <span className="text-sm text-mist">I&apos;m not a robot</span>
      </label>

      {error && (
        <p className="text-sm text-red-400">
          {error}{" "}
          <a className="underline" href="mailto:info@alexcoulombepresents.com">
            Email directly →
          </a>
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !quote.trim()}
        className="self-start rounded-full bg-snow px-7 py-3 font-semibold text-ink transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending…" : "Send it →"}
      </button>
    </form>
  );
}
