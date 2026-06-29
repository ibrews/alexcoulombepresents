"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, honeypot, human }),
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
      <div className="glass rounded-3xl p-10 text-center">
        <p className="text-4xl">✦</p>
        <p className="mt-4 font-bold">Message sent.</p>
        <p className="mt-2 text-sm text-mist">
          You&apos;ll hear back at <span className="text-snow">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-mist">
            Name
          </label>
          <input
            className={field}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-mist">
            Email <span className="text-teal">*</span>
          </label>
          <input
            className={field}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-mist">
          Subject
        </label>
        <input
          className={field}
          type="text"
          placeholder="What's on your mind?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-mist">
          Message <span className="text-teal">*</span>
        </label>
        <textarea
          className={`${field} min-h-[160px] resize-y`}
          placeholder="Tell me about your project, question, or idea…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

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
        disabled={submitting}
        className="rounded-full bg-snow px-7 py-3 font-semibold text-ink transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending…" : "Send message →"}
      </button>
    </form>
  );
}
